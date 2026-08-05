import { Prisma, ExportFormat } from '@prisma/client';
export interface LogExportInput {
    tx: Prisma.TransactionClient;
    companyId: string;
    exportConfigId?: string;
    exportType: string;
    format: ExportFormat;
    requestedById: string;
    rowCount?: number;
    isSensitive?: boolean;
    approvalId?: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface LogDownloadInput {
    tx: Prisma.TransactionClient;
    companyId: string;
    exportLogId: string;
    userId: string;
    fileName?: string;
    ipAddress?: string;
}
export declare class ExportAuditService {
    logExport(input: LogExportInput): Promise<string>;
    logDownload(input: LogDownloadInput): Promise<void>;
}
