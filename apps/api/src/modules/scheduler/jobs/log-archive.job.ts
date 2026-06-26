import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../config/prisma.service';

@Injectable()
export class LogArchiveJob {
  private readonly logger = new Logger(LogArchiveJob.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 3 1 * *')
  async handle() {
    this.logger.log('Monthly log archive check...');
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);

    const oldLogs = await this.prisma.activityLog.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true },
      take: 5000,
    });

    if (oldLogs.length > 0) {
      await this.prisma.activityLog.deleteMany({
        where: { id: { in: oldLogs.map((l) => l.id) } },
      });
      this.logger.log(`Archived ${oldLogs.length} activity logs older than 3 months`);
    }

    const oldEvents = await this.prisma.securityEvent.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true },
      take: 5000,
    });

    if (oldEvents.length > 0) {
      await this.prisma.securityEvent.deleteMany({
        where: { id: { in: oldEvents.map((e) => e.id) } },
      });
      this.logger.log(`Archived ${oldEvents.length} security events older than 3 months`);
    }
  }
}
