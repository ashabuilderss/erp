import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAttendanceCorrectionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attendanceId?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requestedCheckIn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requestedCheckOut?: string;

  @ApiPropertyOptional({ enum: ['COMPLETED', 'UNDER_REVIEW'] })
  @IsOptional()
  requestedStatus?: string;
}
