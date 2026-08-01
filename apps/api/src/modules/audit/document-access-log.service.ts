import { Injectable } from '@nestjs/common';
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

@Injectable()
export class DocumentAccessLogService {
  async log(input: LogDocumentAccessInput): Promise<void> {
    await input.tx.documentAccessLog.create({
      data: {
        companyId: input.companyId,
        documentId: input.documentId,
        userId: input.userId,
        action: input.action,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }
}
