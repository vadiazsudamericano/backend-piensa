import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Ej: "+2 Pts en Tarea"

  @IsNumber()
  @Min(1) // Costo mínimo de 1 punto
  cost: number; // Ej: 1000

  @IsUUID()
  @IsNotEmpty()
  subjectId: string; // ID de la materia
}