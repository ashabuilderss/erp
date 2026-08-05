import { ExpenseStatus } from '@prisma/client';
export declare class CreateExpenseClaimDto {
    amount: number;
    category: string;
    description?: string;
    expenseDate: string;
    receiptUrl?: string;
}
export declare class UpdateExpenseClaimDto {
    amount?: number;
    category?: string;
    description?: string;
    status?: ExpenseStatus;
    notes?: string;
}
