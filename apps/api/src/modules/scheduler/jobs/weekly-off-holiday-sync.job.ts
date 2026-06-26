import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../config/prisma.service';

@Injectable()
export class WeeklyOffHolidaySyncJob {
  private readonly logger = new Logger(WeeklyOffHolidaySyncJob.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handle() {
    this.logger.log('Syncing weekly-off and holiday rules...');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const companies = await this.prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, settings: true },
    });

    for (const company of companies) {
      const settings = (company.settings as Record<string, unknown>) ?? {};
      const weeklyOffDays = (settings.weeklyOffDays as string[]) ?? ['SUNDAY'];
      const dayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][today.getDay()];

      if (weeklyOffDays.includes(dayName)) {
        const employees = await this.prisma.employee.findMany({
          where: { companyId: company.id, status: 'ACTIVE' },
          select: { id: true },
        });

        for (const emp of employees) {
          await this.prisma.attendance.upsert({
            where: {
              companyId_employeeId_date: { companyId: company.id, employeeId: emp.id, date: today },
            },
            create: {
              employeeId: emp.id,
              companyId: company.id,
              date: today,
              status: 'PRESENT',
              checkIn: new Date(today.getTime() + 10 * 60 * 60 * 1000),
              checkOut: new Date(today.getTime() + 19 * 60 * 60 * 1000),
            },
            update: {},
          });
        }
        this.logger.log(`Weekly off (${dayName}) synced for ${employees.length} employees in ${company.id}`);
      }
    }
  }
}
