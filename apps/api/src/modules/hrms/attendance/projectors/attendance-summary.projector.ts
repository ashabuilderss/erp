import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../../governance-events/governance-event.processor';
import { DomainEventTypes } from '../../../governance-events/types/events';

@Injectable()
export class AttendanceSummaryProjector {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: GovernanceEventProcessor,
  ) {}

  @OnEvent(DomainEventTypes.ATTENDANCE_FINALIZED)
  async handleAttendanceFinalized(event: DomainEvent) {
    await this.processor.process(
      event,
      AttendanceSummaryProjector.name,
      async () => {
        const payload = event.payload as any;
        const summaries = new Map<
          string,
          {
            employeeId: string;
            payableMinutes: number;
            overtimeMinutes: number;
            lateMinutes: number;
            absentDays: number;
            leaveDays: number;
          }
        >();

        for (const item of payload.finalized ?? []) {
          const current = summaries.get(item.employeeId) ?? {
            employeeId: item.employeeId,
            payableMinutes: 0,
            overtimeMinutes: 0,
            lateMinutes: 0,
            absentDays: 0,
            leaveDays: 0,
          };
          current.payableMinutes += item.result.payableMinutes ?? 0;
          current.overtimeMinutes += item.result.overtimeMinutes ?? 0;
          current.lateMinutes += item.result.lateMinutes ?? 0;
          current.absentDays += item.result.isAbsent ? 1 : 0;
          current.leaveDays += item.result.leaveMinutes > 0 ? 1 : 0;
          summaries.set(item.employeeId, current);
        }

        for (const summary of summaries.values()) {
          await this.prisma.attendanceSummary.upsert({
            where: {
              companyId_employeeId_attendancePeriodId: {
                companyId: payload.companyId,
                employeeId: summary.employeeId,
                attendancePeriodId: payload.attendancePeriodId,
              },
            },
            create: {
              companyId: payload.companyId,
              employeeId: summary.employeeId,
              attendancePeriodId: payload.attendancePeriodId,
              policyVersionId: payload.policyVersionId,
              attendanceFinalizationBatchId:
                payload.attendanceFinalizationBatchId,
              payableMinutes: summary.payableMinutes,
              overtimeMinutes: summary.overtimeMinutes,
              lateMinutes: summary.lateMinutes,
              absentDays: summary.absentDays,
              leaveDays: summary.leaveDays,
              lastProcessedEventId: event.id,
              lastProcessedCorrelationId: event.correlationId,
            },
            update: {
              policyVersionId: payload.policyVersionId,
              attendanceFinalizationBatchId:
                payload.attendanceFinalizationBatchId,
              payableMinutes: summary.payableMinutes,
              overtimeMinutes: summary.overtimeMinutes,
              lateMinutes: summary.lateMinutes,
              absentDays: summary.absentDays,
              leaveDays: summary.leaveDays,
              lastProcessedEventId: event.id,
              lastProcessedCorrelationId: event.correlationId,
              lastProjectionUpdate: new Date(),
            },
          });
        }
      },
    );
  }
}
