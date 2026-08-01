import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventPublisher } from '../../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../../governance-events/types/events';
import {
  getTodayInTz,
  getTimeInTz,
  getCompanyTz,
} from '../../../common/utils/company-time';

@Injectable()
export class MissingPunchoutJob {
  private readonly logger = new Logger(MissingPunchoutJob.name);
  private readonly AUTO_CHECKOUT_HOUR = 18;
  private readonly AUTO_CHECKOUT_MINUTE = 0;

  constructor(
    private prisma: PrismaService,
    private eventPublisher: GovernanceEventPublisher,
  ) {}

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
    const { hours } = getTimeInTz(tz);

    if (hours < this.AUTO_CHECKOUT_HOUR) {
      return;
    }

    const today = getTodayInTz(tz);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await this.prisma.attendanceDayAggregate.findMany({
      where: {
        companyId,
        date: { gte: today, lt: tomorrow },
        firstPunchAt: { not: null },
        lastPunchAt: null,
      },
      include: {
        employees: { include: { users: true } },
        attendanceSessions: {
          where: { sessionStatus: 'ACTIVE' },
        },
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

      await this.prisma.$transaction(async (tx) => {
        for (const session of record.attendanceSessions) {
          const elapsedMinutes = Math.floor(
            (defaultCheckOut.getTime() - session.sessionStart.getTime()) /
              60000,
          );
          const totalWorkedMinutes = Math.max(
            0,
            elapsedMinutes - (session.totalBreakMinutes || 0),
          );

          await tx.attendanceSession.update({
            where: { id: session.id },
            data: {
              sessionEnd: defaultCheckOut,
              sessionStatus: 'CLOSED',
              totalWorkedMinutes,
              lastPunchId: session.lastPunchId,
            },
          });

          await this.eventPublisher.publish(tx, {
            eventType: DomainEventTypes.ATTENDANCE_SESSION_CLOSED,
            entityId: session.id,
            entityType: 'AttendanceSession',
            companyId,
            payload: {
              companyId,
              employeeId: record.employeeId,
              sessionId: session.id,
            },
          });
        }

        const allClosedSessions = await tx.attendanceSession.findMany({
          where: { dayAggregateId: record.id, sessionStatus: 'CLOSED' },
        });
        const totalWork = allClosedSessions.reduce(
          (acc, s) => acc + (s.totalWorkedMinutes || 0),
          0,
        );
        const totalBreaks = allClosedSessions.reduce(
          (acc, s) => acc + (s.totalBreakMinutes || 0),
          0,
        );

        await tx.attendanceDayAggregate.update({
          where: { id: record.id },
          data: {
            lastPunchAt: defaultCheckOut,
            totalWorkMinutes: totalWork,
            totalBreakMinutes: totalBreaks,
            status: 'COMPLETED',
          },
        });
      });

      autoChecked++;

      const user = record.employees?.users;
      if (user) {
        this.logger.warn(
          `Auto-checked out: ${user.firstName} ${user.lastName} (${record.employeeId}) company=${companyId}`,
        );
      }
    }

    if (autoChecked > 0) {
      this.logger.log(
        `Auto-checked out ${autoChecked} employees in company ${companyId}`,
      );
    }
  }
}
