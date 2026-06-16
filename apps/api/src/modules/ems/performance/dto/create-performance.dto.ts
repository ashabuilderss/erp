import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePerformanceDto {
  @IsString()
  employeeId: string;

  @ApiProperty({ example: 2024 })
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 1, minimum: 1, maximum: 4 })
  @IsInt()
  @Min(1)
  @Max(4)
  quarter: number;

  @ApiProperty({ example: 85, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;

  @ApiPropertyOptional({ example: 'Exceeded targets' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
