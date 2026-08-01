import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../config/prisma.service';
import { AttendanceFinalizationService } from '../../hrms/attendance/attendance-finalization.service';

@Injectable()
export class AttendanceMidnightFinalizationJob {
  private readonly logger = new Logger(AttendanceMidnightFinalizationJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly finalizationService: AttendanceFinalizationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleMidnightFinalization() {
    this.logger.log('Starting midnight attendance finalization job');

    try {
      const companies = await this.prisma.company.findMany({
        where: { isActive: true, deletedAt: null },
      });

      let successCount = 0;
      let failCount = 0;

      for (const company of companies) {
        try {
          await this.finalizationService.finalizePreviousDay(company.id);
          successCount++;
        } catch (error) {
          this.logger.error(
            `Failed to finalize attendance for company ${company.id}`,
            error.stack,
          );
          failCount++;
        }
      }

      this.logger.log(
        `Midnight attendance finalization completed. Success: ${successCount}, Failed: ${failCount}`,
      );
    } catch (error) {
      this.logger.error(
        'Critical failure in midnight attendance finalization job',
        error.stack,
      );
    }
  }
}
