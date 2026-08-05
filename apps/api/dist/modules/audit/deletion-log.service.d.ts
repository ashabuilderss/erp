import { Prisma } from '@prisma/client';
export interface LogDeletionInput {
    tx: Prisma.TransactionClient;
    companyId: string;
    entityType: string;
    entityId: string;
    userId: string;
    reason: string;
    approvalId?: string;
    previousState?: Prisma.InputJsonValue;
}
export declare class DeletionLogService {
    log(input: LogDeletionInput): Promise<void>;
}
