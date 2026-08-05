import { PrismaService } from '../../config/prisma.service';
import { CreatePaymentEntryDto, UpdatePaymentEntryDto } from './dto/create-payment-entry.dto';
import { Prisma } from '@prisma/client';
export declare class PaymentEntriesService {
    private prisma;
    constructor(prisma: PrismaService);
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
        amount: Prisma.Decimal;
        bookingId: string;
        recordedById: string | null;
        reference: string | null;
        paymentDate: Date;
    })[]>;
    create(bookingId: string, dto: CreatePaymentEntryDto, recordedById: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        method: import(".prisma/client").$Enums.PaymentMethod;
        notes: string | null;
        amount: Prisma.Decimal;
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
        amount: Prisma.Decimal;
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
        amount: Prisma.Decimal;
        bookingId: string;
        recordedById: string | null;
        reference: string | null;
        paymentDate: Date;
    }>;
}
