import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus, PaymentStatus } from '@prisma/client';

export class CreateBookingDto {
  @IsString()
  propertyId: string;

  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsDateString()
  bookingDate: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  assignedToEmployeeId: string;
}
