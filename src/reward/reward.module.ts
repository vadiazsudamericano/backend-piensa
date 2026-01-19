import { Module } from '@nestjs/common';
import { RewardController } from './reward.controller';
import { RewardService } from './reward.service';
import { PrismaModule } from '../prisma/prisma.module'; // Importante

@Module({
  imports: [PrismaModule], // 🔥 Necesario para usar la BD
  controllers: [RewardController],
  providers: [RewardService]
})
export class RewardModule {}