import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateCostEntryDto {
  @IsString()
  category: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
