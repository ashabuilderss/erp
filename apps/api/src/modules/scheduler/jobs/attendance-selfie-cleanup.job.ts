import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../config/prisma.service';

@Injectable()
export class AttendanceSelfieCleanupJob {
  private readonly logger = new Logger(AttendanceSelfieCleanupJob.name);
  private readonly RETENTION_DAYS = 90;

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handle() {
    this.logger.log('Running attendance selfie cleanup...');

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.RETENTION_DAYS);

    const staleEvidence = await this.prisma.attendanceEvidence.findMany({
      where: {
        type: 'SELFIE',
        createdAt: { lt: cutoff },
      },
      select: { id: true, storageObjectId: true },
    });

    if (staleEvidence.length === 0) {
      this.logger.log('No stale attendance selfies found.');
      return;
    }

    const storageObjectIds = staleEvidence
      .map((e) => e.storageObjectId)
      .filter((id): id is string => id !== null && id !== undefined);

    if (storageObjectIds.length === 0) return;

    const deleted = await this.prisma.storageObject.deleteMany({
      where: { id: { in: storageObjectIds } },
    });

    this.logger.log(
      `Deleted ${deleted.count} attendance selfie storage objects (evidence metadata retained).`,
    );
  }
}
