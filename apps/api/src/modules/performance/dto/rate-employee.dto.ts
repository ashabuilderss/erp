import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RateEmployeeDto {
  @ApiProperty()
  @IsString()
  performanceScoreId: string;

  @ApiProperty()
  @IsString()
  ratedById: string;

  @ApiProperty({ example: 8, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  score: number;

  @ApiPropertyOptional({ example: 'Strong performance this period' })
  @IsOptional()
  @IsString()
  comment?: string;
}
