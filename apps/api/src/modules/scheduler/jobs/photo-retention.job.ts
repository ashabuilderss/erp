import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../config/prisma.service';

@Injectable()
export class PhotoRetentionJob {
  private readonly logger = new Logger(PhotoRetentionJob.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handle() {
    this.logger.log('Checking photo retention policies...');
    const companies = await this.prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, settings: true },
    });

    for (const company of companies) {
      const settings = (company.settings as Record<string, unknown>) ?? {};
      const retentionDays = (settings.photoRetentionDays as number) ?? 365;
      if (retentionDays <= 0) continue;

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retentionDays);

      const old = await this.prisma.progressPhoto.findMany({
        where: {
          companyId: company.id,
          takenAt: { lt: cutoff },
        },
        select: { id: true },
      });

      if (old.length > 0) {
        await this.prisma.progressPhoto.deleteMany({
          where: { id: { in: old.map((p) => p.id) } },
        });
        this.logger.log(
          `Deleted ${old.length} progress photos older than ${retentionDays} days`,
        );
      }
    }
  }
}
