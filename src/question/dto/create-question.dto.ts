import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

// DTO anidado para las opciones
class OptionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  text: string; // "De qué color es el cielo?"

  @IsUUID()
  @IsNotEmpty()
  subjectId: string; // ID de la materia

  @IsArray()
  @ValidateNested({ each: true }) // Valida cada objeto del array
  @ArrayMinSize(4) // Debe tener exactamente 4 opciones
  @ArrayMaxSize(4)
  @Type(() => OptionDto) // Importante para que la validación anidada funcione
  options: OptionDto[]; // [{ text: "Azul", isCorrect: true }, { text: "Rojo", isCorrect: false }, ...]
}