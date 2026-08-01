import {
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveType } from '@prisma/client';

export class CreateLeaveRequestDto {
  @IsString()
  employeeId: string;

  @ApiProperty({ example: '2024-02-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-02-03' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: LeaveType, default: LeaveType.MEDICAL })
  @IsEnum(LeaveType)
  type: LeaveType = LeaveType.MEDICAL;

  @ApiPropertyOptional({ example: 'Medical emergency' })
  @ValidateIf((o) => o.type === LeaveType.MEDICAL)
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentUrl?: string;
}
