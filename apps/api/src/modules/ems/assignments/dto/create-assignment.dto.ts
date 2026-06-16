import {
  IsEnum,
  IsOptional,
  IsDateString,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AssignmentType {
  PROPERTY = 'PROPERTY',
  LEAD = 'LEAD',
  SITE_VISIT = 'SITE_VISIT',
  BOOKING = 'BOOKING',
}

export class CreateAssignmentDto {
  @ApiProperty({ enum: AssignmentType })
  @IsEnum(AssignmentType)
  type: AssignmentType;

  @IsString()
  employeeId: string;

  @IsString()
  entityId: string;

  @ApiPropertyOptional({ example: '2024-02-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-02-28' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Handle this lead' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
