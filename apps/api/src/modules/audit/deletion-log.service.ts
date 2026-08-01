import { Injectable } from '@nestjs/common';
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

@Injectable()
export class DeletionLogService {
  async log(input: LogDeletionInput): Promise<void> {
    await input.tx.deletionLog.create({
      data: {
        companyId: input.companyId,
        entityType: input.entityType,
        entityId: input.entityId,
        userId: input.userId,
        reason: input.reason,
        approvalId: input.approvalId ?? null,
        previousState: input.previousState ?? undefined,
      },
    });
  }
}
