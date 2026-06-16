import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateEmployeeWithUserDto {
  @ApiProperty({ example: 'john.doe@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({ example: 'TempPass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    example: 'SE-001',
    description: 'Auto-generated if not provided',
  })
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @ApiProperty({ example: 'cmq20oo840003owi1oni3eozv' })
  @IsString()
  departmentId: string;

  @ApiProperty({ example: 'cmq20oo8o0008owi1hn27zl4u' })
  @IsString()
  designationId: string;

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

  @ApiPropertyOptional({ enum: UserRole, example: 'EMPLOYEE' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
