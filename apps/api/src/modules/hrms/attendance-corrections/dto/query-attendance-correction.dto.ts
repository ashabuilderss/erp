import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QueryAttendanceCorrectionDto extends BaseQueryDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;
}
