import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { SiteVisitStatus } from '@prisma/client';

export class CreateSiteVisitDto {
  @IsString()
  propertyId: string;

  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsDateString()
  scheduledDate: string;

  @IsOptional()
  @IsEnum(SiteVisitStatus)
  status?: SiteVisitStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsString()
  assignedToEmployeeId: string;
}
