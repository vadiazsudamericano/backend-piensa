import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto'; 
import { TransactionType, RedemptionStatus } from '@prisma/client';

@Injectable()
export class RewardService {
  constructor(private prisma: PrismaService) {}

  // 1. Crear Recompensa
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

  // 4. Eliminar Recompensa
  async deleteReward(teacherId: string, rewardId: string) {
    const reward = await this.prisma.reward.findUnique({ 
        where: { id: rewardId },
        include: { subject: true } 
    });

    if (!reward || reward.subject.teacherId !== teacherId) {
        throw new ForbiddenException('No tienes permiso');
    }

    return this.prisma.reward.delete({
      where: { id: rewardId },
    });
  }

  // 5. Canjear (Estudiante)
  async redeemReward(studentId: string, dto: RedeemRewardDto) {
    const reward = await this.prisma.reward.findUnique({ where: { id: dto.rewardId } });
    
    if (!reward) throw new NotFoundException('Recompensa no encontrada');
    if (!reward.isActive) throw new ForbiddenException('Esta recompensa ya no está disponible');

    const balance = await this.prisma.pointBalance.findUnique({
      where: {
        studentId_subjectId: { studentId, subjectId: reward.subjectId },
      },
    });

    if (!balance || balance.amount < reward.cost) {
      throw new ForbiddenException('Saldo insuficiente');
    }

    return this.prisma.$transaction(async (tx) => {
      // Restar puntos
      await tx.pointBalance.update({
        where: { studentId_subjectId: { studentId, subjectId: reward.subjectId } },
        data: { amount: { decrement: reward.cost } },
      });

      // Crear registro en historial
      await tx.pointTransaction.create({
        data: {
          amount: -reward.cost,
          type: TransactionType.REDEEMED,
          reason: `Canje: ${reward.name}`,
          studentId,
          subjectId: reward.subjectId,
        },
      });

      // Crear solicitud de canje
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

  // 🔥 NUEVOS MÉTODOS PARA NOTIFICACIONES Y APROBACIÓN 🔥

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
        // Devolver puntos al alumno
        await tx.pointBalance.update({
          where: {
            studentId_subjectId: {
              studentId: request.studentId,
              subjectId: request.reward.subjectId,
            },
          },
          data: { amount: { increment: request.reward.cost } },
        });

        // Crear registro de devolución en historial
        await tx.pointTransaction.create({
          data: {
            amount: request.reward.cost,
            type: TransactionType.EARNED,
            reason: `Devolución: ${request.reward.name} (Rechazado)`,
            studentId: request.studentId,
            subjectId: request.reward.subjectId,
          },
        });

        // Marcar solicitud como rechazada
        return tx.redemptionRequest.update({
          where: { id: requestId },
          data: { status: RedemptionStatus.REJECTED },
        });
      });
    }
  }

  // 9. Obtener canjes del estudiante (Para su campana de notificaciones)
  async getStudentRedemptions(studentId: string) {
    return this.prisma.redemptionRequest.findMany({
      where: { studentId },
      include: {
        reward: { select: { name: true, subject: { select: { name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10, // Últimos 10 para no saturar
    });
  }
}