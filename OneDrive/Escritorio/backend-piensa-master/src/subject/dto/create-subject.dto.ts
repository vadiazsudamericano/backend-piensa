import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Ej: "Matemáticas"

  @IsString()
  @IsNotEmpty()
  cycle: string; // Ej: "Ciclo 1"

  @IsNumber()
  @IsNotEmpty()
  year: number; // Ej: 2025
}