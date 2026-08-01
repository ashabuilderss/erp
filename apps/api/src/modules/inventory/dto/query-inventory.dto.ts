import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class QueryInventoryDto {
  @ApiPropertyOptional({ description: 'Filter by construction site ID' })
  @IsOptional()
  @IsString()
  siteId?: string;

  @ApiPropertyOptional({ description: 'Filter by material ID' })
  @IsOptional()
  @IsString()
  materialId?: string;

  @ApiPropertyOptional({ description: 'Filter only low stock items', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  lowStock?: boolean;
}
