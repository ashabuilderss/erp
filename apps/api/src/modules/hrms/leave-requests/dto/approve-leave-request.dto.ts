import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveStatus } from '@prisma/client';

export class ApproveLeaveRequestDto {
  @ApiProperty({ enum: LeaveStatus })
  @IsEnum(LeaveStatus)
  status: LeaveStatus;

  @ApiPropertyOptional({ example: 'Approved for vacation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
