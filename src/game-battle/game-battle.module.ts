import { Module } from '@nestjs/common';
import { GameBattleGateway } from './game-battle.gateway';
import { GameBattleService } from './game-battle.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [
    GameBattleGateway,
    GameBattleService,
    PrismaService
  ],
  exports: [
    GameBattleService
  ],
})
export class GameBattleModule {}
