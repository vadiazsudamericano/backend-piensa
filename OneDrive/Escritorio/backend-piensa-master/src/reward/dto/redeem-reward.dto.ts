import { IsNotEmpty, IsUUID } from 'class-validator';

export class RedeemRewardDto {
  @IsUUID()
  @IsNotEmpty()
  rewardId: string; // ID de la recompensa que quiere canjear
}