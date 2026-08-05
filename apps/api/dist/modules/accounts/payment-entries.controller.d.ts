import { PaymentEntriesService } from './payment-entries.service';
import { CreatePaymentEntryDto, UpdatePaymentEntryDto } from './dto/create-payment-entry.dto';
export declare class PaymentEntriesController {
    private readonly service;
    constructor(service: PaymentEntriesService);
    findByBooking(bookingId: string, companyId: string): Promise<({
        employees: {
            employeeCode: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        method: import(".prisma/client").$Enums.PaymentMethod;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        bookingId: string;
        recordedById: string | null;
        reference: string | null;
        paymentDate: Date;
    })[]>;
    create(bookingId: string, dto: CreatePaymentEntryDto, currentUserId: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        method: import(".prisma/client").$Enums.PaymentMethod;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        bookingId: string;
        recordedById: string | null;
        reference: string | null;
        paymentDate: Date;
    }>;
    update(id: string, dto: UpdatePaymentEntryDto, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        method: import(".prisma/client").$Enums.PaymentMethod;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        bookingId: string;
        recordedById: string | null;
        reference: string | null;
        paymentDate: Date;
    }>;
    remove(id: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        method: import(".prisma/client").$Enums.PaymentMethod;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        bookingId: string;
        recordedById: string | null;
        reference: string | null;
        paymentDate: Date;
    }>;
}
