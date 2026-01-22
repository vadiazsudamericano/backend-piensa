import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AssignPointsDto {
  // 🔥 CAMBIO: Usamos studentCode (string) en lugar de studentId (UUID)
  @IsString()
  @IsNotEmpty()
  studentCode: string; // El código de 5 dígitos del estudiante (ej: A7X92)

  @IsUUID()
  @IsNotEmpty()
  subjectId: string; // ID de la materia donde se ganaron los puntos

  @IsNumber()
  @Min(1)
  @IsOptional()
  amount?: number; // Cantidad de puntos (default 100)

  @IsString()
  @IsOptional()
  reason?: string; // Motivo (ej: "Participación")
}