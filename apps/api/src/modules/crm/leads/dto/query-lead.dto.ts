import { IsOptional, IsString, IsEnum } from 'class-validator';
import { LeadSource, LeadStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QueryLeadDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsString()
  assignedToEmployeeId?: string;
}
