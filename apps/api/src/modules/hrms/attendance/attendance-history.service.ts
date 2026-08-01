import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

interface RecordHistoryInput {
  tx: Prisma.TransactionClient;
  companyId: string;
  targetType: string;
  targetId: string;
  actorId?: string;
  transitionType: string;
  previousState?: string;
  newState?: string;
  reason?: string;
}

@Injectable()
export class AttendanceHistoryService {
  async record(input: RecordHistoryInput): Promise<void> {
    await input.tx.attendanceHistory.create({
      data: {
        companyId: input.companyId,
        targetType: input.targetType,
        targetId: input.targetId,
        actorId: input.actorId ?? null,
        transitionType: input.transitionType,
        previousState: input.previousState ?? null,
        newState: input.newState ?? null,
        reason: input.reason ?? null,
      },
    });
  }
}
