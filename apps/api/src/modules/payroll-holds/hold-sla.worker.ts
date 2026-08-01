import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { PayrollHoldStatus } from '@prisma/client';
import { ApprovalsRuntimeService } from '../approvals/approvals-runtime.service';

@Injectable()
export class HoldSlaWorker {
  private readonly logger = new Logger(HoldSlaWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalsService: ApprovalsRuntimeService,
  ) {}

  @Cron('0 0 * * * *') // Run hourly
  async handleSlaEscalations() {
    this.logger.debug('Running Hold SLA Worker...');
    const now = new Date();
    // A hold pending for > 48 hours is escalated
    const slaThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const stuckHolds = await this.prisma.payrollHold.findMany({
      where: {
        status: {
          in: [
            PayrollHoldStatus.REQUESTED,
            PayrollHoldStatus.RELEASE_REQUESTED,
          ],
        },
        updatedAt: { lt: slaThreshold },
        approvalId: { not: null },
      },
    });

    for (const hold of stuckHolds) {
      if (!hold.approvalId) continue;

      try {
        await this.prisma.$transaction(async (tx) => {
          // Re-route logic via Approvals Runtime (Escalate to Owner)
          await this.approvalsService.escalateRequest(hold.approvalId!);

          // Touch the hold record to bump updatedAt and prevent infinite escalation loops
          await tx.payrollHold.update({
            where: { id: hold.id },
            data: { updatedAt: new Date() },
          });

          await tx.payrollHoldHistory.create({
            data: {
              holdId: hold.id,
              companyId: hold.companyId,
              event: 'HOLD_SLA_ESCALATED',
              comments: `Hold pending > 48 hours. Approval workflow escalated.`,
            },
          });
        });
      } catch (err: any) {
        this.logger.error(`Failed to escalate hold ${hold.id}: ${err.message}`);
      }
    }
  }
}
