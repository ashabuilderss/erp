import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PerformancePeriod } from '@prisma/client';

export class ListScoresDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ enum: PerformancePeriod })
  @IsOptional()
  @IsEnum(PerformancePeriod)
  periodType?: PerformancePeriod;

  @ApiPropertyOptional({ example: '2026-07' })
  @IsOptional()
  @IsString()
  period?: string;
}
