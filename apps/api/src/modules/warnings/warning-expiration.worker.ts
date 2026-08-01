import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class WarningExpirationWorker {
  private readonly logger = new Logger(WarningExpirationWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 0 * * * *') // Run hourly
  async handleWarningExpirations() {
    this.logger.debug('Running Warning Expiration Worker...');
    const now = new Date();

    const expiredWarnings = await this.prisma.warning.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
        expiresAt: { lt: now },
      },
      // In a real system, you might want a flag like 'isExpiredProcessed'
      // but since we only process it once, we check if it already has an 'WARNING_EXPIRED' event
      include: {
        warningHistories: {
          where: { event: 'WARNING_EXPIRED' },
        },
      },
    });

    for (const warning of expiredWarnings) {
      if (warning.warningHistories.length > 0) continue; // Already processed

      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.warningHistory.create({
            data: {
              warningId: warning.id,
              companyId: warning.companyId,
              event: 'WARNING_EXPIRED',
              comments: `Warning expiration period reached.`,
            },
          });
        });
      } catch (err: any) {
        this.logger.error(
          `Failed to process expiration for warning ${warning.id}: ${err.message}`,
        );
      }
    }
  }
}
