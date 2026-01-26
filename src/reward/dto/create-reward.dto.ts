import { IsNotEmpty, IsNumber, IsString, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateRewardDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty() 
  @IsNumber()
  @Min(1) // Evita que pongan costos de 0 o negativos
  cost: number;

  @IsNotEmpty() 
  @IsUUID()
  subjectId: string;

  // 🔥 NUEVO: Campo para el límite de canjes
  @IsOptional()
  @IsNumber()
  @Min(0) // 0 significa ilimitado
  stock?: number;
}