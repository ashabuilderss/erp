import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryItemDto {
  @ApiProperty({ description: 'Construction site ID' })
  @IsString()
  siteId: string;

  @ApiProperty({ description: 'Material ID' })
  @IsString()
  materialId: string;

  @ApiPropertyOptional({ description: 'Initial quantity on hand', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantityOnHand?: number;

  @ApiPropertyOptional({ description: 'Low stock threshold', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;
}
