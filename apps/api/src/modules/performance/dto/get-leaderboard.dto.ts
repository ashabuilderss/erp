import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PerformancePeriod } from '@prisma/client';

export class GetLeaderboardDto {
  @ApiProperty({ example: '2026-07' })
  @IsString()
  period: string;

  @ApiProperty({ enum: PerformancePeriod })
  @IsEnum(PerformancePeriod)
  periodType: PerformancePeriod;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
