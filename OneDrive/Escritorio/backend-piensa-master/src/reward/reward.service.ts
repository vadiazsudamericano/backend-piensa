import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { TransactionType, RedemptionStatus } from '@prisma/client';

@Injectable()
export class RewardService {
  constructor(private prisma: PrismaService) {}

  // Profesor crear recompensa
  async createReward(teacherId: string, dto: CreateRewardDto) {
    // Verifica que el profesor es dueño de la materia
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, teacherId: teacherId },
    });

    if (!subject) {
      throw new ForbiddenException('No tienes permiso para crear recompensas en esta materia');
    }

    return this.prisma.reward.create({
      data: {
        name: dto.name,
        cost: dto.cost,
        subjectId: dto.subjectId,
      },
    });
  }

  // Estudiante ve recompensas disponibles 
  async getRewardsForSubject(subjectId: string) {
    return this.prisma.reward.findMany({
      where: { subjectId },
    });
  }

  // Estudiante canjear recompensa 
  async redeemReward(studentId: string, dto: RedeemRewardDto) {
    // 1. Buscar la recompensa y su costo
    const reward = await this.prisma.reward.findUnique({
      where: { id: dto.rewardId },
    });

    if (!reward) throw new NotFoundException('Recompensa no encontrada');

    // 2. Verificar saldo del estudiante EN ESA MATERIA
    const balance = await this.prisma.pointBalance.findUnique({
      where: {
        studentId_subjectId: {
          studentId: studentId,
          subjectId: reward.subjectId,
        },
      },
    });

    if (!balance || balance.amount < reward.cost) {
      throw new BadRequestException('Saldo insuficiente para canjear esta recompensa');
    }

    // 3. Transacción: Restar puntos y crear solicitud de canje
    return this.prisma.$transaction(async (prisma) => {
      // A. Restar puntos
      await prisma.pointBalance.update({
        where: {
            studentId_subjectId: {
                studentId: studentId,
                subjectId: reward.subjectId,
            }
         },
        data: { amount: { decrement: reward.cost } },
      });

      // B. Registrar transacción (historial)
      await prisma.pointTransaction.create({
        data: {
          amount: -reward.cost, // Negativo porque es un gasto
          type: TransactionType.REDEEMED,
          reason: `Canje: ${reward.name}`,
          studentId: studentId,
          subjectId: reward.subjectId,
        },
      });

      // C. Crear la solicitud de canje (para que el profesor la vea)
      return prisma.redemptionRequest.create({
        data: {
          studentId: studentId,
          rewardId: reward.id,
          status: RedemptionStatus.PENDING, // El profesor deberá aprobarla después (Fase futura opcional)
        },
      });
    });
  }
}