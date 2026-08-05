import { ScheduleStatus } from '@prisma/client';
export declare class CreatePaymentScheduleDto {
    installmentNumber: number;
    amount: number;
    dueDate: string;
    status?: ScheduleStatus;
    notes?: string;
}
export declare class UpdatePaymentScheduleDto {
    amount?: number;
    dueDate?: string;
    paidDate?: string;
    status?: ScheduleStatus;
    notes?: string;
}
