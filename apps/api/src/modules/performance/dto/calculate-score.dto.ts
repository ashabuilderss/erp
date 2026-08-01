import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PerformancePeriod } from '@prisma/client';

export class CalculateScoreDto {
  @ApiProperty()
  @IsString()
  employeeId: string;

  @ApiProperty({ example: '2026-07' })
  @IsString()
  period: string;

  @ApiProperty({ enum: PerformancePeriod })
  @IsEnum(PerformancePeriod)
  periodType: PerformancePeriod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  calculatedById?: string;
}
