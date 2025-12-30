import { Module, forwardRef } from '@nestjs/common';
import { GameBattleGateway } from './game-battle.gateway';
import { GameBattleService } from './game-battle.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GameBattleGateway, GameBattleService],
})
export class GameBattleModule {}
