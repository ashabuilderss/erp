import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QuerySecurityEventDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsString()
  severity?: string;
}
