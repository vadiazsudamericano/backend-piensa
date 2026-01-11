import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AchievementsService {
  constructor(private prisma: PrismaService) {}

  async getMyAchievements(userId: string) {
    // Si tienes un modelo Achievement en Prisma, úsalo aquí.
    // Si no, devolvemos un array vacío por ahora para que no rompa el frontend.
    /*
    return this.prisma.achievement.findMany({
        where: { userId }
    });
    */
    return []; 
  }
}