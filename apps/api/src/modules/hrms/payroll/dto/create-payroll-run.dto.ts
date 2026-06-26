import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePayrollRunDto {
  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ example: '2026-06-30' })
  @IsDateString()
  periodEnd: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
