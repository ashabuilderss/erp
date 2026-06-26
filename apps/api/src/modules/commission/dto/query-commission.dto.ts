import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CommissionStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryCommissionDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @IsOptional()
  @IsString()
  employeeId?: string;
}
