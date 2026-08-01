import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../config/prisma.service';
import { StorageProvider } from '../../uploads/storage/storage-provider.interface';

@Injectable()
export class LogArchiveJob {
  private readonly logger = new Logger(LogArchiveJob.name);

  constructor(
    private prisma: PrismaService,
    @Inject('STORAGE_PROVIDER') private storageProvider: StorageProvider
  ) {}

  @Cron('0 3 1 * *')
  async handle() {
    this.logger.log('Monthly log archive check...');
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);

    // Archive Activity Logs
    const oldLogs = await this.prisma.activityLog.findMany({
      where: { createdAt: { lt: cutoff } },
      take: 5000,
    });

    if (oldLogs.length > 0) {
      const buffer = Buffer.from(JSON.stringify(oldLogs, null, 2));
      const filename = `archives/activity_logs_${cutoff.toISOString().split('T')[0]}.json`;
      
      await this.storageProvider.upload({
        buffer,
        originalname: filename,
        mimetype: 'application/json',
        size: buffer.length
      });
      
      await this.prisma.activityLog.deleteMany({
        where: { id: { in: oldLogs.map((l) => l.id) } },
      });
      this.logger.log(
        `Archived ${oldLogs.length} activity logs to S3 (older than 3 months)`,
      );
    }

    // Archive Security Events
    const oldEvents = await this.prisma.securityEvent.findMany({
      where: { createdAt: { lt: cutoff } },
      take: 5000,
    });

    if (oldEvents.length > 0) {
      const buffer = Buffer.from(JSON.stringify(oldEvents, null, 2));
      const filename = `archives/security_events_${cutoff.toISOString().split('T')[0]}.json`;
      
      await this.storageProvider.upload({
        buffer,
        originalname: filename,
        mimetype: 'application/json',
        size: buffer.length
      });

      await this.prisma.securityEvent.deleteMany({
        where: { id: { in: oldEvents.map((e) => e.id) } },
      });
      this.logger.log(
        `Archived ${oldEvents.length} security events to S3 (older than 3 months)`,
      );
    }
  }
}
