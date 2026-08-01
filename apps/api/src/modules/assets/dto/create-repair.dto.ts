import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateRepairDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class UpdateRepairDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
