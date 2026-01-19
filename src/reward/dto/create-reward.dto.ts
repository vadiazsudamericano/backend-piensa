import { IsNotEmpty, IsNumber, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateRewardDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  // 👇 ESTO ES LO QUE TE FALTABA
  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty() 
  @IsNumber()
  cost: number;

  @IsNotEmpty() 
  @IsUUID()
  subjectId: string;
}