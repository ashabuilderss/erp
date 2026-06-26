import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../config/prisma.service';

@Injectable()
export class SelfieCleanupJob {
  private readonly logger = new Logger(SelfieCleanupJob.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handle() {
    this.logger.log('Cleaning up old attendance selfies...');
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const old = await this.prisma.attendance.findMany({
      where: {
        date: { lt: cutoff },
        OR: [
          { checkInPhoto: { not: null } },
          { checkOutPhoto: { not: null } },
        ],
      },
      select: { id: true, checkInPhoto: true, checkOutPhoto: true },
    });

    if (old.length > 0) {
      await this.prisma.attendance.updateMany({
        where: { id: { in: old.map((a) => a.id) } },
        data: { checkInPhoto: null, checkOutPhoto: null },
      });
      this.logger.log(`Cleared selfie URLs for ${old.length} attendance records older than 90 days`);
    }
  }
}
