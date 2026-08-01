import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryTransactionType } from '@prisma/client';

export class RecordTransactionDto {
  @ApiProperty({ enum: InventoryTransactionType, description: 'Transaction type' })
  @IsEnum(InventoryTransactionType)
  type: InventoryTransactionType;

  @ApiProperty({ description: 'Quantity for this transaction' })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ description: 'Source site ID (required for TRANSFER)' })
  @IsOptional()
  @IsString()
  siteFromId?: string;

  @ApiPropertyOptional({ description: 'Destination site ID (required for TRANSFER)' })
  @IsOptional()
  @IsString()
  siteToId?: string;
}

export class RecordInwardDto {
  @ApiProperty({ description: 'Quantity received' })
  @IsNumber()
  @Min(0.01)
  quantity: number;
}

export class RecordOutwardDto {
  @ApiProperty({ description: 'Quantity dispatched' })
  @IsNumber()
  @Min(0.01)
  quantity: number;
}

export class RecordWastageDto {
  @ApiProperty({ description: 'Quantity wasted' })
  @IsNumber()
  @Min(0.01)
  quantity: number;
}

export class RecordTransferDto {
  @ApiProperty({ description: 'Quantity to transfer' })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ description: 'Source site ID' })
  @IsString()
  siteFromId: string;

  @ApiProperty({ description: 'Destination site ID' })
  @IsString()
  siteToId: string;
}
