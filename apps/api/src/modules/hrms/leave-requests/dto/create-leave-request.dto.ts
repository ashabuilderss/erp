import {
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveType } from '@prisma/client';

export class CreateLeaveRequestDto {
  @IsString()
  employeeId: string;

  @ApiProperty({ example: '2024-02-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-02-05' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: LeaveType, default: LeaveType.OTHER })
  @IsEnum(LeaveType)
  type: LeaveType = LeaveType.OTHER;

  @ApiPropertyOptional({ example: 'Family vacation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
