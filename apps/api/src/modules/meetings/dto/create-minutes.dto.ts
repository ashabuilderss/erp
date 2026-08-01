import { IsString, IsOptional } from 'class-validator';

export class CreateMinutesDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  recordedById?: string;
}
