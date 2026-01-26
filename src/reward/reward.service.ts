import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto'; 
import { UpdateRewardDto } from './dto/update-reward.dto'; 
import { TransactionType, RedemptionStatus } from '@prisma/client';

@Injectable()
export class RewardService {
  constructor(private prisma: PrismaService) {}

  // 1. Crear Recompensa con soporte para Stock
  async createReward(teacherId: string, dto: CreateRewardDto) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, teacherId },
    });

    if (!subject) throw new ForbiddenException('Materia no encontrada o no te pertenece');

    return this.prisma.reward.create({
      data: {
        name: dto.name,
        description: dto.description, 
        cost: dto.cost,
        subjectId: dto.subjectId,
        isActive: true,
        stock: dto.stock || 0,
        remainingStock: dto.stock || 0,
      },
    });
  }

  // 2. Obtener recompensas del profesor
  async getRewardsByTeacher(teacherId: string) {
    return this.prisma.reward.findMany({
      where: {
        subject: { teacherId: teacherId }
      },
      include: {
        subject: { select: { name: true } } 
      },
      orderBy: { cost: 'asc' }
    });
  }

  // 3. Activar / Desactivar
  async toggleRewardStatus(teacherId: string, rewardId: string, isActive: boolean) {
    const reward = await this.prisma.reward.findUnique({ 
        where: { id: rewardId },
        include: { subject: true } 
    });

    if (!reward || reward.subject.teacherId !== teacherId) {
        throw new ForbiddenException('No tienes permiso sobre esta recompensa');
    }

    return this.prisma.reward.update({
      where: { id: rewardId },
      data: { isActive },
    });
  }

  // 4. Eliminar Recompensa (ACTUALIZADO: Borrado seguro en cascada)
  async deleteReward(teacherId: string, rewardId: string) {
    const reward = await this.prisma.reward.findUnique({ 
        where: { id: rewardId },
        include: { subject: true } 
    });

    if (!reward || reward.subject.teacherId !== teacherId) {
        throw new ForbiddenException('No tienes permiso');
    }

    // Ejecutamos en transacción para limpiar registros relacionados y evitar errores 500
    return await this.prisma.$transaction(async (tx) => {
      // a. Borrar solicitudes de canje asociadas a esta recompensa específica
      await tx.redemptionRequest.deleteMany({
        where: { rewardId: rewardId }
      });

      // b. Borrar la recompensa
      return tx.reward.delete({
        where: { id: rewardId },
      });
    });
  }

  // 5. Canjear (Estudiante) con validación de Stock
  async redeemReward(studentId: string, dto: RedeemRewardDto) {
    const reward = await this.prisma.reward.findUnique({ where: { id: dto.rewardId } });
    
    if (!reward) throw new NotFoundException('Recompensa no encontrada');
    if (!reward.isActive) throw new ForbiddenException('Esta recompensa ya no está disponible');

    if (reward.stock > 0 && reward.remainingStock <= 0) {
      throw new ForbiddenException('Lo sentimos, esta recompensa se ha agotado para toda la clase.');
    }

    const balance = await this.prisma.pointBalance.findUnique({
      where: {
        studentId_subjectId: { studentId, subjectId: reward.subjectId },
      },
    });

    if (!balance || balance.amount < reward.cost) {
      throw new ForbiddenException('Saldo insuficiente');
    }

    return this.prisma.$transaction(async (tx) => {
      if (reward.stock > 0) {
        await tx.reward.update({
          where: { id: reward.id },
          data: { remainingStock: { decrement: 1 } },
        });
      }

      await tx.pointBalance.update({
        where: { studentId_subjectId: { studentId, subjectId: reward.subjectId } },
        data: { amount: { decrement: reward.cost } },
      });

      await tx.pointTransaction.create({
        data: {
          amount: -reward.cost,
          type: TransactionType.REDEEMED,
          reason: `Canje: ${reward.name}`,
          studentId,
          subjectId: reward.subjectId,
        },
      });

      return tx.redemptionRequest.create({
        data: {
          studentId,
          rewardId: reward.id,
          status: RedemptionStatus.PENDING,
        },
      });
    });
  }

  // 6. Obtener recompensas por materia (Para estudiantes)
  async findAllBySubject(subjectId: string) {
    return this.prisma.reward.findMany({
      where: { 
        subjectId: subjectId,
        isActive: true 
      },
      orderBy: {
        cost: 'asc',
      },
    });
  }

  // 7. Obtener canjes pendientes para el profesor
  async getPendingRedemptions(teacherId: string) {
    return this.prisma.redemptionRequest.findMany({
      where: {
        reward: { subject: { teacherId } },
        status: RedemptionStatus.PENDING,
      },
      include: {
        student: { select: { fullName: true, avatarUrl: true, studentCode: true } },
        reward: { select: { name: true, cost: true, subject: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 8. Aprobar o Rechazar Canje
  async handleRedemption(teacherId: string, requestId: string, status: RedemptionStatus) {
    const request = await this.prisma.redemptionRequest.findUnique({
      where: { id: requestId },
      include: { reward: { include: { subject: true } } },
    });

    if (!request || request.reward.subject.teacherId !== teacherId) {
      throw new ForbiddenException('No tienes permiso para gestionar esta solicitud');
    }

    if (status === RedemptionStatus.APPROVED) {
      return this.prisma.redemptionRequest.update({
        where: { id: requestId },
        data: { status: RedemptionStatus.APPROVED },
      });
    }

    if (status === RedemptionStatus.REJECTED) {
      return this.prisma.$transaction(async (tx) => {
        if (request.reward.stock > 0) {
          await tx.reward.update({
            where: { id: request.rewardId },
            data: { remainingStock: { increment: 1 } },
          });
        }

        await tx.pointBalance.update({
          where: {
            studentId_subjectId: {
              studentId: request.studentId,
              subjectId: request.reward.subjectId,
            },
          },
          data: { amount: { increment: request.reward.cost } },
        });

        await tx.pointTransaction.create({
          data: {
            amount: request.reward.cost,
            type: TransactionType.EARNED,
            reason: `Devolución: ${request.reward.name} (Rechazado)`,
            studentId: request.studentId,
            subjectId: request.reward.subjectId,
          },
        });

        return tx.redemptionRequest.update({
          where: { id: requestId },
          data: { status: RedemptionStatus.REJECTED },
        });
      });
    }
  }

  // 9. Obtener canjes del estudiante
  async getStudentRedemptions(studentId: string) {
    return this.prisma.redemptionRequest.findMany({
      where: { studentId },
      include: {
        reward: { select: { name: true, subject: { select: { name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
  }

  // 10. Actualizar/Editar Recompensa
  async updateReward(teacherId: string, rewardId: string, dto: UpdateRewardDto) {
    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId },
      include: { subject: true }
    });

    if (!reward || reward.subject.teacherId !== teacherId) {
      throw new ForbiddenException('No tienes permiso para editar esta recompensa');
    }

    return this.prisma.reward.update({
      where: { id: rewardId },
      data: {
        name: dto.name,
        description: dto.description,
        cost: dto.cost, 
        stock: dto.stock,
        remainingStock: dto.stock, 
      },
    });
  }
}