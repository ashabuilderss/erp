import { Prisma } from '@prisma/client';
export interface RecordAuditInput {
    tx: Prisma.TransactionClient;
    companyId: string;
    entityType: string;
    entityId: string;
    action: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    previousState?: Prisma.InputJsonValue;
    newState?: Prisma.InputJsonValue;
    reason?: string;
    approvalId?: string;
}
export declare class AuditService {
    record(input: RecordAuditInput): Promise<void>;
}
