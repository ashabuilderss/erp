import { IsOptional, IsString, IsEnum } from 'class-validator';
import { CustomerType } from '@prisma/client';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QueryCustomerDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @IsOptional()
  @IsString()
  createdById?: string;
}
