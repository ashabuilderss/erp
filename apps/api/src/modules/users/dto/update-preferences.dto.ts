import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  lead_assigned?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  lead_converted?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  leave_requested?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  leave_approved?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  leave_rejected?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  site_visit_scheduled?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  booking_confirmed?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  employee_invited?: boolean;
}
