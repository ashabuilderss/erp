import { PaymentSchedulesService } from './payment-schedules.service';
import { CreatePaymentScheduleDto, UpdatePaymentScheduleDto } from './dto/create-payment-schedule.dto';
export declare class PaymentSchedulesController {
    private readonly service;
    constructor(service: PaymentSchedulesService);
    findByBooking(bookingId: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.ScheduleStatus;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        bookingId: string;
        installmentNumber: number;
        dueDate: Date;
        paidDate: Date | null;
    }[]>;
    create(bookingId: string, dto: CreatePaymentScheduleDto, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.ScheduleStatus;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        bookingId: string;
        installmentNumber: number;
        dueDate: Date;
        paidDate: Date | null;
    }>;
    update(id: string, dto: UpdatePaymentScheduleDto, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.ScheduleStatus;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        bookingId: string;
        installmentNumber: number;
        dueDate: Date;
        paidDate: Date | null;
    }>;
    remove(id: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.ScheduleStatus;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        bookingId: string;
        installmentNumber: number;
        dueDate: Date;
        paidDate: Date | null;
    }>;
}
