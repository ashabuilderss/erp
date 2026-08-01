import { IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAttendanceDto {
  @IsString()
  employeeId: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: '2024-01-15T09:00:00Z' })
  @IsOptional()
  @IsString()
  checkIn?: string;

  @ApiPropertyOptional({ example: '2024-01-15T18:00:00Z' })
  @IsOptional()
  @IsString()
  checkOut?: string;

  @ApiPropertyOptional({
    enum: ['COMPLETED', 'UNDER_REVIEW'],
    default: 'UNDER_REVIEW',
  })
  @IsOptional()
  @IsString()
  status?: string = 'UNDER_REVIEW';
}
