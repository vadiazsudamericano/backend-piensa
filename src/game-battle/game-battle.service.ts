import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const POINTS_PER_WIN = 10;
const TRANSACTION_REASON = "Ganador Batalla de Respuesta Rápida";

@Injectable()
export class GameBattleService {
    private readonly logger = new Logger(GameBattleService.name);

    constructor(private prisma: PrismaService) {}

    /**
     * Registra una victoria atómicamente:
     * 1. Otorga puntos al PointBalance del estudiante para esa materia (Upsert).
     * 2. Crea un registro en PointTransaction (Auditoría).
     * * @param studentId ID del User ganador (Estudiante).
     * @param subjectId ID de la materia en la que se ganó.
     */
    async registerWin(studentId: string, subjectId: string): Promise<void> {
        this.logger.log(`[DB] Iniciando transacción para registrar victoria de User ID: ${studentId} en Subject ID: ${subjectId}`);

        try {
            await this.prisma.$transaction(async (tx) => {
                
                // 1. ACTUALIZAR o CREAR el PointBalance (Saldo de Puntos)
                const balanceUpdate = await tx.pointBalance.upsert({
                    where: {
                        studentId_subjectId: {
                            studentId: studentId,
                            subjectId: subjectId,
                        },
                    },
                    update: {
                        // Incrementa el saldo actual
                        amount: { increment: POINTS_PER_WIN },
                    },
                    create: {
                        // Crea el saldo inicial si es la primera vez que gana en esta materia
                        studentId: studentId,
                        subjectId: subjectId,
                        amount: POINTS_PER_WIN,
                    },
                });

                // 2. CREAR un registro en PointTransaction (Auditoría)
                await tx.pointTransaction.create({
                    data: {
                        studentId: studentId,
                        subjectId: subjectId,
                        amount: POINTS_PER_WIN, 
                        type: 'EARNED', // Usando el Enum TransactionType
                        reason: TRANSACTION_REASON,
                    },
                });

                // Opcional: Obtener el nombre para mejor logging
                const user = await tx.user.findUnique({
                    where: { id: studentId },
                    select: { fullName: true }
                });
                
                this.logger.log(
                    `[DB] Transacción exitosa. ${user?.fullName || studentId} ha ganado ${POINTS_PER_WIN} puntos. Nuevo saldo para la materia: ${balanceUpdate.amount}`
                );
            });
            
        } catch (error) {
            this.logger.error(`[DB ERROR] Fallo al registrar victoria para ${studentId}: ${error.message}`);
            // Relanzar o manejar el error según sea necesario en el contexto de NestJS
            throw new Error('Error de integridad de datos al registrar la victoria.');
        }
    }
}