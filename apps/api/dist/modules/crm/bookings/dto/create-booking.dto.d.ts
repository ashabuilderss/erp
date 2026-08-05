import { BookingStatus, PaymentStatus } from '@prisma/client';
export declare class CreateBookingDto {
    propertyId: string;
    customerId: string;
    leadId?: string;
    bookingDate: string;
    amount: number;
    status?: BookingStatus;
    paymentStatus?: PaymentStatus;
    notes?: string;
    assignedToEmployeeId: string;
}
