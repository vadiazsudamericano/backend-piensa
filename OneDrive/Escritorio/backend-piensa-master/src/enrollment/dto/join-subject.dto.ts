import { IsNotEmpty, IsString, Length } from 'class-validator';

export class JoinSubjectDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 10, { message: 'El código debe tener entre 4 y 10 caracteres' })
  joinCode: string;
}