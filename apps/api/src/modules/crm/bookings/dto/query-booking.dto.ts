import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QueryBookingDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsDateString()
  bookingDateFrom?: string;

  @IsOptional()
  @IsDateString()
  bookingDateTo?: string;

  @IsOptional()
  @IsString()
  assignedToEmployeeId?: string;

  @ApiPropertyOptional({ default: 'bookingDate' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'bookingDate';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
