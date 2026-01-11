import * as dotenv from 'dotenv';
dotenv.config();

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Importaciones de tus módulos
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SubjectModule } from './subject/subject.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { PointsModule } from './points/points.module';
import { RewardModule } from './reward/reward.module';
import { QuestionModule } from './question/question.module';

// 👇 1. IMPORTAR EL MÓDULO DE LOGROS AQUÍ
import { AchievementsModule } from './achievements/achievements.module';

// Importaciones de Batalla
import { GameBattleGateway } from './game-battle/game-battle.gateway'; 
import { GameBattleService } from './game-battle/game-battle.service';  

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    SubjectModule,
    EnrollmentModule,
    PointsModule,
    RewardModule,
    QuestionModule,
    // 👇 2. AGREGARLO AL ARRAY DE IMPORTS AQUÍ
    AchievementsModule, 
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    GameBattleGateway,
    GameBattleService, 
  ],
})
export class AppModule {}