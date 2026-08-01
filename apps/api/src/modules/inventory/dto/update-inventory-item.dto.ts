import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({ description: 'Low stock threshold' })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ description: 'Manual quantity adjustment (overrides current)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantityOnHand?: number;
}
