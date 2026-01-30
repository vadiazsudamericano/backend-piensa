import { IsOptional, IsString } from 'class-validator';

export class EditUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  // 🔥 Cambiado a IsString para evitar que la validación rebote la petición
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}