import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncentiveStatus, PayoutStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryIncentiveDto extends BaseQueryDto {
  @ApiPropertyOptional({ enum: IncentiveStatus })
  @IsOptional()
  @IsEnum(IncentiveStatus)
  status?: IncentiveStatus;

  @ApiPropertyOptional({ enum: PayoutStatus })
  @IsOptional()
  @IsEnum(PayoutStatus)
  payoutStatus?: PayoutStatus;
}
