import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SiteVisitStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QuerySiteVisitDto extends BaseQueryDto {
  @ApiPropertyOptional({ default: 'scheduledDate' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'scheduledDate';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsEnum(SiteVisitStatus)
  status?: SiteVisitStatus;

  @IsOptional()
  @IsDateString()
  scheduledDateFrom?: string;

  @IsOptional()
  @IsDateString()
  scheduledDateTo?: string;

  @IsOptional()
  @IsString()
  assignedToEmployeeId?: string;
}
