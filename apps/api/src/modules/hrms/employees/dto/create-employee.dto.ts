import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeStatus, EmployeeStaffType } from '@prisma/client';

export class CreateEmployeeDto {
  @ApiPropertyOptional({
    example: 'EMP001',
    description: 'Auto-generated if not provided',
  })
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  departmentId: string;

  @IsString()
  designationId: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfJoining?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  salary?: number;

  @ApiPropertyOptional({ example: '123 Main St, City' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus = EmployeeStatus.ACTIVE;

  @ApiPropertyOptional({ enum: EmployeeStaffType, default: EmployeeStaffType.OFFICE })
  @IsOptional()
  @IsEnum(EmployeeStaffType)
  staffType?: EmployeeStaffType = EmployeeStaffType.OFFICE;

  @ApiPropertyOptional({ description: 'Send invitation email after creation' })
  @IsOptional()
  @IsBoolean()
  inviteToLogin?: boolean;
}
