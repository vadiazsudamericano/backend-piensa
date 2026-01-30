import { IsOptional, IsString } from 'class-validator';

export class EditUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  // 🔥 Agregamos esto para que la validación no rebote el campo si viene del frontend
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}