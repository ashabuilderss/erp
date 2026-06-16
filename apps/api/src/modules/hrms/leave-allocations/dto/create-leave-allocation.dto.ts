import { IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveType } from '@prisma/client';

export class CreateLeaveAllocationDto {
  @ApiProperty()
  @IsString()
  employeeId: string;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiProperty({ enum: LeaveType })
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(0)
  totalDays: number;
}
