import { IsOptional, IsBoolean } from 'class-validator';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QueryBrokerDto extends BaseQueryDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
