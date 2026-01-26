import { PartialType } from '@nestjs/mapped-types';
import { CreateRewardDto } from './create-reward.dto';

// Usamos PartialType para que todos los campos de CreateReward sean opcionales al editar
export class UpdateRewardDto extends PartialType(CreateRewardDto) {}