import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameBattleGateway } from './game-battle.gateway';

const POINTS_PER_WIN = 10;
const TRANSACTION_REASON = 'Ganador Batalla de Respuesta Rápida';

@Injectable()
export class GameBattleService {
  private readonly logger = new Logger(GameBattleService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: GameBattleGateway,
  ) {}

  /**
   * Registra la victoria de un usuario y otorga puntos.
   */
  async registerWin(studentId: string, subjectId: string): Promise<void> {
    this.logger.log(
      `🏆 Iniciando registro de victoria → User: ${studentId}, Materia: ${subjectId}`,
    );

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1️⃣ Actualizar o crear saldo
        const balance = await tx.pointBalance.upsert({
          where: {
            studentId_subjectId: { studentId, subjectId },
          },
          update: {
            amount: { increment: POINTS_PER_WIN },
          },
          create: {
            studentId,
            subjectId,
            amount: POINTS_PER_WIN,
          },
        });

        // 2️⃣ Registrar auditoría
        await tx.pointTransaction.create({
          data: {
            studentId,
            subjectId,
            amount: POINTS_PER_WIN,
            type: 'EARNED',
            reason: TRANSACTION_REASON,
          },
        });

        // 3️⃣ Obtener nombre para logs y broadcast
        const user = await tx.user.findUnique({
          where: { id: studentId },
          select: { fullName: true },
        });

        this.logger.log(
          `✔ Victoria registrada → ${user?.fullName || studentId} ganó ${POINTS_PER_WIN} puntos. Nuevo saldo: ${balance.amount}`,
        );

        // 4️⃣ Enviar broadcast global
        this.gateway.broadcastWin({
          winnerId: studentId,
          winnerName: user?.fullName || studentId, // ← agregado
          points: POINTS_PER_WIN,
          subjectId,
        });
      });
    } catch (err) {
      this.logger.error(
        `❌ Error al registrar victoria → ${studentId}: ${err.message}`,
      );
      throw new Error('Error al registrar victoria y puntos.');
    }
  }
}
