import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../config/prisma.service';
import { getTodayInTz, getTimeInTz, getCompanyTz } from '../../../common/utils/company-time';

@Injectable()
export class MissingPunchoutJob {
  private readonly logger = new Logger(MissingPunchoutJob.name);
  private readonly AUTO_CHECKOUT_HOUR = 18;
  private readonly AUTO_CHECKOUT_MINUTE = 0;

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handle() {
    const companies = await this.prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, settings: true },
    });

    for (const company of companies) {
      try {
        await this.processCompany(company.id, company.settings);
      } catch (err) {
        this.logger.error(`Error processing company ${company.id}: ${err}`);
      }
    }
  }

  private async processCompany(companyId: string, settingsJson: unknown) {
    const settings = (settingsJson as Record<string, unknown>) ?? {};
    const tz = getCompanyTz(settings);
    const { hours, minutes } = getTimeInTz(tz);

    if (hours < this.AUTO_CHECKOUT_HOUR) {
      return;
    }

    const today = getTodayInTz(tz);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await this.prisma.attendance.findMany({
      where: {
        companyId,
        date: { gte: today, lt: tomorrow },
        checkIn: { not: null },
        checkOut: null,
      },
      include: {
        employee: { include: { user: true } },
      },
    });

    if (records.length === 0) return;

    let autoChecked = 0;
    for (const record of records) {
      const defaultCheckOut = new Date(record.date);
      defaultCheckOut.setUTCHours(
        this.AUTO_CHECKOUT_HOUR,
        this.AUTO_CHECKOUT_MINUTE,
        0,
        0,
      );

      await this.prisma.attendance.update({
        where: { id: record.id },
        data: { checkOut: defaultCheckOut },
      });
      autoChecked++;

      const user = record.employee?.user;
      if (user) {
        this.logger.warn(
          `Auto-checked out: ${user.firstName} ${user.lastName} (${record.employeeId}) company=${companyId}`,
        );
      }
    }

    if (autoChecked > 0) {
      this.logger.log(`Auto-checked out ${autoChecked} employees in company ${companyId}`);
    }
  }
}
