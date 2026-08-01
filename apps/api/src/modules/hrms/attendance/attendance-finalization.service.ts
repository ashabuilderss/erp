import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BatchStatus, DayAggregateStatus } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { TransitionService } from '../../../common/services/transition.service';
import { GovernanceEventPublisher } from '../../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../../governance-events/types/events';
import { AttendancePolicyEngine } from './attendance-policy.engine';
import { AttendanceHistoryService } from './attendance-history.service';

interface FinalizePeriodInput {
  companyId: string;
  attendancePeriodId: string;
  finalizedById: string;
  correctionOverrides?: {
    dayAggregateId: string;
    requestedCheckIn?: string;
    requestedCheckOut?: string;
  }[];
}

interface FinalizePeriodResult {
  batchId: string;
  processedCount: number;
  failedCount: number;
}

interface CreatePeriodInput {
  companyId: string;
  startDate: Date;
  endDate: Date;
  createdById: string;
}

@Injectable()
export class AttendanceFinalizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: GovernanceEventPublisher,
    private readonly policyEngine: AttendancePolicyEngine,
    private readonly historyService: AttendanceHistoryService,
    private readonly transitionService: TransitionService,
  ) {}

  async finalizePeriod(
    input: FinalizePeriodInput,
  ): Promise<FinalizePeriodResult> {
    return this.prisma.$transaction(async (tx) => {
      const period = await tx.attendancePeriod.findFirst({
        where: { id: input.attendancePeriodId, companyId: input.companyId },
      });
      if (!period) {
        throw new NotFoundException('Attendance period not found');
      }
      if (period.status === 'PAYROLL_LOCKED') {
        throw new BadRequestException(
          'Attendance period is payroll locked. Use adjustment workflows.',
        );
      }

      const policyVersion = await tx.attendancePolicyVersion.findFirst({
        where: {
          companyId: input.companyId,
          effectiveFrom: { lte: period.endDate },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: period.startDate } },
          ],
        },
        orderBy: { versionNumber: 'desc' },
      });
      if (!policyVersion) {
        throw new NotFoundException('Attendance policy version not found');
      }

      const holidayVersion = await tx.holidayCalendarVersion.findFirst({
        where: { companyId: input.companyId },
        orderBy: { versionNumber: 'desc' },
      });
      if (!holidayVersion) {
        throw new NotFoundException('Holiday calendar version not found');
      }

      const batch = await tx.attendanceFinalizationBatch.create({
        data: {
          companyId: input.companyId,
          attendancePeriodId: input.attendancePeriodId,
          policyVersionId: policyVersion.id,
          holidayCalendarVersionId: holidayVersion.id,
          finalizedById: input.finalizedById,
          status: BatchStatus.PROCESSING,
        },
      });

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.ATTENDANCE_FINALIZATION_BATCH_STARTED,
        entityId: batch.id,
        entityType: 'AttendanceFinalizationBatch',
        companyId: input.companyId,
        payload: {
          companyId: input.companyId,
          attendancePeriodId: input.attendancePeriodId,
          attendanceFinalizationBatchId: batch.id,
        },
      });

      await this.historyService.record({
        tx,
        companyId: input.companyId,
        targetType: 'AttendancePeriod',
        targetId: input.attendancePeriodId,
        actorId: input.finalizedById,
        transitionType: 'FINALIZATION_STARTED',
        previousState: period.status,
        newState: 'UNDER_REVIEW',
      });

      const aggregates = await tx.attendanceDayAggregate.findMany({
        where: {
          companyId: input.companyId,
          date: { gte: period.startDate, lte: period.endDate },
        },
        include: {
          attendanceSessions: {
            include: { shiftAssignmentSnapshots: true },
          },
        },
      });

      const leaves = await tx.leaveRequest.findMany({
        where: {
          companyId: input.companyId,
          status: 'APPROVED',
          startDate: { lte: period.endDate },
          endDate: { gte: period.startDate },
        },
      });

      const policy = this.parsePolicy(policyVersion.policyConfiguration);
      const holidayDates = this.parseHolidayDates(holidayVersion.calendarData);
      const weeklyOffDays = this.parseWeeklyOffDays(
        policyVersion.policyConfiguration,
      );
      const overridesMap = new Map(
        (input.correctionOverrides ?? []).map((o) => [o.dayAggregateId, o]),
      );
      const eligibleAggregates = aggregates.filter(
        (aggregate) =>
          aggregate.status === DayAggregateStatus.VERIFIED ||
          aggregate.status === DayAggregateStatus.COMPLETED ||
          overridesMap.has(aggregate.id),
      );
      const finalized = eligibleAggregates.map((aggregate) => {
        const shift = aggregate.attendanceSessions[0]?.shiftAssignmentSnapshots;
        const employeeLeaves = leaves.filter(
          (leave) => leave.employeeId === aggregate.employeeId,
        );
        const approvedLeaveMinutes =
          employeeLeaves.length > 0 ? policy.fullDayMinutes : 0;

        const dateStr = aggregate.date.toISOString().slice(0, 10);
        const dayOfWeek = aggregate.date.toLocaleDateString('en-US', {
          weekday: 'long',
          timeZone: 'UTC',
        });
        const isHoliday = holidayDates.has(dateStr);
        const isWeeklyOff = weeklyOffDays.has(dayOfWeek);

        let workMinutes = aggregate.totalWorkMinutes;
        let firstPunchAt = aggregate.firstPunchAt;
        let lastPunchAt = aggregate.lastPunchAt;

        const override = overridesMap.get(aggregate.id);
        if (override) {
          if (override.requestedCheckIn) {
            firstPunchAt = new Date(override.requestedCheckIn);
          }
          if (override.requestedCheckOut) {
            lastPunchAt = new Date(override.requestedCheckOut);
          }
          if (firstPunchAt && lastPunchAt) {
            workMinutes = Math.max(
              0,
              Math.floor(
                (lastPunchAt.getTime() - firstPunchAt.getTime()) / 60000,
              ),
            );
          }
        }

        return {
          employeeId: aggregate.employeeId,
          date: aggregate.date,
          shiftAssignmentSnapshotId: shift?.id ?? null,
          result: this.policyEngine.evaluateDay({
            workMinutes,
            breakMinutes: aggregate.totalBreakMinutes,
            firstPunchAt,
            lastPunchAt,
            approvedLeaveMinutes,
            shift: {
              startTime: shift?.startTime ?? '10:15',
              endTime: shift?.endTime ?? '18:00',
              gracePeriodMinutes: shift?.gracePeriodMinutes ?? 0,
            },
            policy,
            device: { required: false, isTrusted: true },
            geofence: { required: false },
            isHoliday,
            isWeeklyOff,
          }),
        };
      });

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.ATTENDANCE_FINALIZED,
        entityId: batch.id,
        entityType: 'AttendanceFinalizationBatch',
        companyId: input.companyId,
        payload: {
          companyId: input.companyId,
          attendancePeriodId: input.attendancePeriodId,
          attendanceFinalizationBatchId: batch.id,
          policyVersionId: policyVersion.id,
          holidayCalendarVersionId: holidayVersion.id,
          fullDayMinutes: policy.fullDayMinutes,
          finalized,
        },
      });

      await tx.attendanceFinalizationBatch.update({
        where: { id: batch.id },
        data: {
          status: BatchStatus.COMPLETED,
          completedAt: new Date(),
          processedCount: finalized.length,
          failedCount: 0,
        },
      });

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.ATTENDANCE_FINALIZATION_BATCH_COMPLETED,
        entityId: batch.id,
        entityType: 'AttendanceFinalizationBatch',
        companyId: input.companyId,
        payload: {
          companyId: input.companyId,
          attendancePeriodId: input.attendancePeriodId,
          attendanceFinalizationBatchId: batch.id,
          processedCount: finalized.length,
        },
      });

      await this.historyService.record({
        tx,
        companyId: input.companyId,
        targetType: 'AttendancePeriod',
        targetId: input.attendancePeriodId,
        actorId: input.finalizedById,
        transitionType: 'FINALIZATION_COMPLETED',
        previousState: 'UNDER_REVIEW',
        newState: 'CLOSED',
      });

      return {
        batchId: batch.id,
        processedCount: finalized.length,
        failedCount: 0,
      };
    });
  }

  async createPeriod(input: CreatePeriodInput) {
    const existing = await this.prisma.attendancePeriod.findUnique({
      where: {
        companyId_startDate_endDate: {
          companyId: input.companyId,
          startDate: input.startDate,
          endDate: input.endDate,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Attendance period already exists for these dates',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const period = await tx.attendancePeriod.create({
        data: {
          companyId: input.companyId,
          startDate: input.startDate,
          endDate: input.endDate,
          status: 'OPEN',
        },
      });

      await this.historyService.record({
        tx,
        companyId: input.companyId,
        targetType: 'AttendancePeriod',
        targetId: period.id,
        actorId: input.createdById,
        transitionType: 'PERIOD_CREATED',
        newState: 'OPEN',
      });

      return period;
    });
  }

  async lockPeriod(companyId: string, periodId: string, lockedById: string) {
    const period = await this.prisma.attendancePeriod.findFirst({
      where: { id: periodId, companyId },
    });
    if (!period) {
      throw new NotFoundException('Attendance period not found');
    }
    if (period.status === 'PAYROLL_LOCKED') {
      throw new BadRequestException('Period is already payroll locked');
    }

    this.transitionService.validate('AttendancePeriod', period.status, 'PAYROLL_LOCKED');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.attendancePeriod.update({
        where: { id: periodId },
        data: { status: 'PAYROLL_LOCKED' },
      });

      await this.historyService.record({
        tx,
        companyId,
        targetType: 'AttendancePeriod',
        targetId: periodId,
        actorId: lockedById,
        transitionType: 'PERIOD_LOCKED',
        previousState: period.status,
        newState: 'PAYROLL_LOCKED',
      });

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.ATTENDANCE_PERIOD_LOCKED,
        entityId: periodId,
        entityType: 'AttendancePeriod',
        companyId,
        payload: {
          companyId,
          attendancePeriodId: periodId,
          lockedById,
        },
      });

      return updated;
    });
  }

  private parsePolicy(value: unknown) {
    const config = (value as Record<string, unknown>) ?? {};

    const fullDayMinutes = Number(config.fullDayMinutes);
    if (!fullDayMinutes || fullDayMinutes <= 0) {
      throw new BadRequestException(
        'Attendance policy configuration is invalid: fullDayMinutes is required and must be a positive number',
      );
    }

    const overtimeAfterMinutes = Number(config.overtimeAfterMinutes);
    if (!overtimeAfterMinutes || overtimeAfterMinutes <= 0) {
      throw new BadRequestException(
        'Attendance policy configuration is invalid: overtimeAfterMinutes is required and must be a positive number',
      );
    }

    return {
      halfDayThresholdMinutes: Number(config.halfDayThresholdMinutes) || 300,
      fullDayMinutes,
      overtimeAfterMinutes,
      lateAfterMinutes: Number(config.lateAfterMinutes) || 0,
    };
  }

  private parseHolidayDates(calendarData: unknown): Set<string> {
    const data = (calendarData as Record<string, unknown>) ?? {};
    const holidays = (data.holidays as Array<{ date: string }>) ?? [];
    return new Set(
      holidays.map((h) => {
        const d = new Date(h.date);
        return d.toISOString().slice(0, 10);
      }),
    );
  }

  private parseWeeklyOffDays(policyConfiguration: unknown): Set<string> {
    const config = (policyConfiguration as Record<string, unknown>) ?? {};
    const days = (config.weeklyOffDays as string[]) ?? [];
    return new Set(days);
  }

  async finalizePreviousDay(companyId: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    // Find an owner or admin user to act as the system actor
    const systemUser = await this.prisma.user.findFirst({
      where: {
        companyId,
        role: 'OWNER',
        isActive: true,
        deletedAt: null,
      },
    });

    if (!systemUser) {
      throw new BadRequestException(
        `No valid OWNER found for company ${companyId} to finalize attendance`,
      );
    }

    // Find or create attendance period for yesterday
    let period = await this.prisma.attendancePeriod.findFirst({
      where: {
        companyId,
        startDate: { lte: yesterday },
        endDate: { gte: yesterday },
      },
    });

    if (!period) {
      period = await this.prisma.attendancePeriod.create({
        data: {
          companyId,
          startDate: yesterday,
          endDate: yesterday,
          status: 'OPEN',
        },
      });
    }

    if (period.status !== 'OPEN') {
      return; // Already processed
    }

    return this.finalizePeriod({
      companyId,
      attendancePeriodId: period.id,
      finalizedById: systemUser.id,
    });
  }
}
