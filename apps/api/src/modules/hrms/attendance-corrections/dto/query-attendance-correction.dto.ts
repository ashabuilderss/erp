import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CorrectionStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QueryAttendanceCorrectionDto extends BaseQueryDto {
  @ApiPropertyOptional({ enum: CorrectionStatus })
  @IsOptional()
  @IsEnum(CorrectionStatus)
  status?: CorrectionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;
}
