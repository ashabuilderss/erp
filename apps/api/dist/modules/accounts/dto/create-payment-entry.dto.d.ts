import { PaymentMethod } from '@prisma/client';
export declare class CreatePaymentEntryDto {
    amount: number;
    method: PaymentMethod;
    reference?: string;
    paymentDate: string;
    notes?: string;
}
export declare class UpdatePaymentEntryDto {
    amount?: number;
    method?: PaymentMethod;
    reference?: string;
    paymentDate?: string;
    notes?: string;
}
