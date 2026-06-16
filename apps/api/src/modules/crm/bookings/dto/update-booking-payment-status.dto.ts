import { IsEnum } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class UpdateBookingPaymentStatusDto {
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;
}
