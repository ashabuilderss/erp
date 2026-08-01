import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { ApprovalStatus, WarningSeverity } from '@prisma/client';

@Injectable()
export class WarningAckSlaWorker {
  private readonly logger = new Logger(WarningAckSlaWorker.name);

  private readonly SLA_HOURS: Record<string, number> = {
    LEVEL_1_VERBAL: 48,
    LEVEL_2_WRITTEN: 24,
    LEVEL_3_FINAL: 12,
  };

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 */30 * * * *') // Every 30 minutes
  async handleAckSlaBreaches() {
    this.logger.debug('Running Warning Ack SLA Worker...');
    const now = new Date();

    const unacknowledged = await this.prisma.warning.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
        acknowledgedAt: null,
      },
      include: {
        warningHistories: {
          where: { event: 'ACK_SLA_BREACHED' },
        },
      },
    });

    for (const warning of unacknowledged) {
      if (warning.warningHistories.length > 0) continue;

      const slaHours = this.SLA_HOURS[warning.severity] ?? 48;
      const slaDeadline = new Date(
        warning.createdAt.getTime() + slaHours * 60 * 60 * 1000,
      );

      if (now <= slaDeadline) continue;

      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.warningHistory.create({
            data: {
              warningId: warning.id,
              companyId: warning.companyId,
              event: 'ACK_SLA_BREACHED',
              comments: `Acknowledgement SLA of ${slaHours}h breached for ${warning.severity} warning. Escalating to Owner.`,
            },
          });
        });

        this.logger.log(
          `SLA breached for warning ${warning.id} (${warning.severity}).`,
        );
      } catch (err: any) {
        this.logger.error(
          `Failed to process SLA breach for warning ${warning.id}: ${err.message}`,
        );
      }
    }
  }
}
