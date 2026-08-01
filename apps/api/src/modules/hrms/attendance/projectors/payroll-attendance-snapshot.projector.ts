import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../../governance-events/governance-event.processor';
import { DomainEventTypes } from '../../../governance-events/types/events';

@Injectable()
export class PayrollAttendanceSnapshotProjector {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: GovernanceEventProcessor,
  ) {}

  @OnEvent(DomainEventTypes.ATTENDANCE_FINALIZED)
  async handleAttendanceFinalized(event: DomainEvent) {
    await this.processor.process(
      event,
      PayrollAttendanceSnapshotProjector.name,
      async () => {
        const payload = event.payload as any;
        const snapshots = new Map<
          string,
          {
            employeeId: string;
            shiftAssignmentSnapshotId: string | null;
            payableMinutes: number;
            overtimeMinutes: number;
            lateMinutes: number;
            absentDays: number;
            leaveDays: number;
          }
        >();

        for (const item of payload.finalized ?? []) {
          const current = snapshots.get(item.employeeId) ?? {
            employeeId: item.employeeId,
            shiftAssignmentSnapshotId: item.shiftAssignmentSnapshotId,
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
          current.shiftAssignmentSnapshotId =
            current.shiftAssignmentSnapshotId ?? item.shiftAssignmentSnapshotId;
          snapshots.set(item.employeeId, current);
        }

        for (const snapshot of snapshots.values()) {
          const fullDayMinutes = Number(payload.fullDayMinutes);
          if (!fullDayMinutes || fullDayMinutes <= 0) {
            continue;
          }
          const snapshotData = {
            payableMinutes: snapshot.payableMinutes,
            paidDays: snapshot.payableMinutes / fullDayMinutes,
            overtimeMinutes: snapshot.overtimeMinutes,
            lateMinutes: snapshot.lateMinutes,
            absentDays: snapshot.absentDays,
            leaveDays: snapshot.leaveDays,
          };

          await this.prisma.payrollAttendanceSnapshot.upsert({
            where: {
              companyId_employeeId_attendancePeriodId: {
                companyId: payload.companyId,
                employeeId: snapshot.employeeId,
                attendancePeriodId: payload.attendancePeriodId,
              },
            },
            create: {
              companyId: payload.companyId,
              employeeId: snapshot.employeeId,
              attendancePeriodId: payload.attendancePeriodId,
              policyVersionId: payload.policyVersionId,
              shiftAssignmentSnapshotId: snapshot.shiftAssignmentSnapshotId,
              holidayCalendarVersionId: payload.holidayCalendarVersionId,
              attendanceFinalizationBatchId:
                payload.attendanceFinalizationBatchId,
              snapshotData,
              lastProcessedEventId: event.id,
              lastProcessedCorrelationId: event.correlationId,
            },
            update: {
              policyVersionId: payload.policyVersionId,
              shiftAssignmentSnapshotId: snapshot.shiftAssignmentSnapshotId,
              holidayCalendarVersionId: payload.holidayCalendarVersionId,
              attendanceFinalizationBatchId:
                payload.attendanceFinalizationBatchId,
              snapshotData,
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
