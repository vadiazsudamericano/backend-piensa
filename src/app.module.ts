import * as dotenv from 'dotenv';
dotenv.config();

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 🔥 IMPORTACIONES PARA ARCHIVOS ESTÁTICOS
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Importaciones de tus módulos
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SubjectModule } from './subject/subject.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { PointsModule } from './points/points.module';
import { RewardModule } from './reward/reward.module';
import { QuestionModule } from './question/question.module'; 
import { AchievementsModule } from './achievements/achievements.module';
import { UserModule } from './user/user.module';

// Importaciones de Batalla
import { GameBattleGateway } from './game-battle/game-battle.gateway'; 
import { GameBattleService } from './game-battle/game-battle.service';  

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    
    // 🔥 CONFIGURACIÓN PARA SERVIR FOTOS (URL REAL)
    // Esto hace que lo que subas a /uploads sea accesible vía HTTP
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), 
      serveRoot: '/uploads', 
    }),

    PrismaModule,
    AuthModule,
    UserModule,
    SubjectModule,
    EnrollmentModule,
    PointsModule,
    RewardModule,
    QuestionModule,
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