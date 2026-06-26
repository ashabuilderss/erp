import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PropertyType, PropertyStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QueryPropertyDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  locality?: string;

  @IsOptional()
  @IsString()
  assignedToEmployeeId?: string;
}
