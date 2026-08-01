import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../config/prisma.service';

const RETENTION_DAYS = 90;

@Injectable()
export class ExportRetentionJob {
  private readonly logger = new Logger(ExportRetentionJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handle() {
    this.logger.log('Cleaning up stale export records...');

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    const deletedExports = await this.prisma.reportExport.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        status: { in: ['COMPLETED', 'FAILED'] },
      },
    });

    if (deletedExports.count > 0) {
      this.logger.log(
        `Deleted ${deletedExports.count} ReportExport metadata records older than ${RETENTION_DAYS} days`,
      );
    }

    this.logger.log(
      'ExportLog and DownloadLog retained per SRS append-only audit requirement',
    );
  }
}
