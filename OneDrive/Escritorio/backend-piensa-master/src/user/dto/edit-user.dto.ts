import { IsOptional, IsString } from 'class-validator';

export class EditUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  bio?: string;      // Biografía del docente

  @IsString()
  @IsOptional()
  avatarUrl?: string; // URL de la imagen (Base64 o Link)
}