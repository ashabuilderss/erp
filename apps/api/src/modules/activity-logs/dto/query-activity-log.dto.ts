import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryActivityLogDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  performedById?: string;

  @IsOptional()
  @IsString()
  format?: 'csv' | 'json';
}
