import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuotationDto {
  @IsString()
  referenceNumber: string;

  @IsString()
  @IsOptional()
  leadId?: string;

  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsNumber()
  @Type(() => Number)
  totalAmount: number;

  @IsObject()
  breakdown: Record<string, any>;

  @IsDateString()
  validUntil: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
