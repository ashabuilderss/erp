import { Prisma } from '@prisma/client';
export interface LogDocumentAccessInput {
    tx: Prisma.TransactionClient;
    companyId: string;
    documentId: string;
    userId: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
}
export declare class DocumentAccessLogService {
    log(input: LogDocumentAccessInput): Promise<void>;
}
