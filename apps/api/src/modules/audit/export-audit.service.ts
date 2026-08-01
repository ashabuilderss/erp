import { Injectable } from '@nestjs/common';
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

@Injectable()
export class ExportAuditService {
  async logExport(input: LogExportInput): Promise<string> {
    const record = await input.tx.exportLog.create({
      data: {
        companyId: input.companyId,
        exportConfigId: input.exportConfigId ?? null,
        exportType: input.exportType,
        format: input.format,
        requestedById: input.requestedById,
        rowCount: input.rowCount ?? 0,
        isSensitive: input.isSensitive ?? false,
        approvalId: input.approvalId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
    return record.id;
  }

  async logDownload(input: LogDownloadInput): Promise<void> {
    await input.tx.downloadLog.create({
      data: {
        companyId: input.companyId,
        exportLogId: input.exportLogId,
        userId: input.userId,
        fileName: input.fileName ?? null,
        ipAddress: input.ipAddress ?? null,
      },
    });
  }
}
