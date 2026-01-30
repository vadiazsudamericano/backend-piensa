import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEnum(Role, { message: 'El rol debe ser STUDENT o TEACHER' })
  @IsOptional() // Opcional porque por defecto seraSTUDENT
  role?: Role;
}