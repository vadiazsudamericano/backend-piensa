import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AssignPointsDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string; // ID del estudiante que recibirá los puntos

  @IsUUID()
  @IsNotEmpty()
  subjectId: string; // ID de la materia donde se ganaron los puntos

  @IsNumber()
  @Min(1) // No se pueden asignar 0 o menos puntos
  @IsOptional() // Hacemos que sea opcional por si no lo envían
  amount?: number; // Cantidad de puntos (default 100)

  @IsString()
  @IsOptional()
  reason?: string; // Respuesta rápida en clase
}