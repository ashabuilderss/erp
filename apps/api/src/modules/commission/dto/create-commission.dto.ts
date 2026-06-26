import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateCommissionDto {
  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsString()
  employeeId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  percentage?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
