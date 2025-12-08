// src/game-battle/game-battle.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GameBattleService {
    constructor(private prisma: PrismaService) {}

    async registerWin(studentId: string, subjectId: string): Promise<void> {
        console.log(`[DB] Registrando victoria y puntos para el estudiante ${studentId} en la materia ${subjectId}`);
        // Lógica de Prisma para la base de datos aquí...
    }
}