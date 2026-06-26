import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class CreateReportExportDto {
  @ApiProperty() @IsString() reportKey: string;
  @ApiProperty({ default: 'CSV' }) @IsString() format: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateTo?: string;
  @ApiPropertyOptional() @IsOptional() filters?: Record<string, any>;
}

export class QueryReportExportDto extends BaseQueryDto {}

export class QueryAnalyticsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ enum: ['day', 'week', 'month', 'quarter', 'year'] })
  @IsOptional() @IsString()
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month';
}
