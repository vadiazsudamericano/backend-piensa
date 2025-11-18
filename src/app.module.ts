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

// 🔥 1. IMPORTACIÓN DEL GATEWAY 🔥
// Nota: El error menciona GameBattleGateway, pero usaré GameGateway ya que es el que me proporcionaste.
import { GameBattleGateway } from './game-battle/game-battle.gateway'; 

// 🔥 NUEVA IMPORTACIÓN NECESARIA 🔥
// Debes importar el servicio que tu Gateway está usando.
// Asumiendo la ruta:
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 🔥 2. AGREGAR EL SERVICIO A LOS PROVIDERS 🔥
    GameBattleGateway,
    GameBattleService, 
  ],
})
export class AppModule {}