import { Injectable } from '@nestjs/common';
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

@Injectable()
export class AuditService {
  async record(input: RecordAuditInput): Promise<void> {
    await input.tx.auditRecord.create({
      data: {
        companyId: input.companyId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        userId: input.userId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        previousState: input.previousState ?? undefined,
        newState: input.newState ?? undefined,
        reason: input.reason ?? null,
        approvalId: input.approvalId ?? null,
      },
    });
  }
}
