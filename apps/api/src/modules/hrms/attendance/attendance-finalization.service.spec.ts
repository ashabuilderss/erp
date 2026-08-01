import { BadRequestException } from '@nestjs/common';
import { AttendancePeriodStatus, BatchStatus } from '@prisma/client';
import { AttendanceFinalizationService } from './attendance-finalization.service';
import { AttendancePolicyEngine } from './attendance-policy.engine';
import { DomainEventTypes } from '../../governance-events/types/events';

describe('AttendanceFinalizationService', () => {
  const makeService = () => {
    const tx = {
      attendancePeriod: {
        findFirst: jest.fn(),
      },
      attendancePolicyVersion: {
        findFirst: jest.fn(),
      },
      holidayCalendarVersion: {
        findFirst: jest.fn(),
      },
      attendanceFinalizationBatch: {
        create: jest.fn(),
        update: jest.fn(),
      },
      attendanceDayAggregate: {
        findMany: jest.fn(),
      },
      leaveRequest: {
        findMany: jest.fn(),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (handler: (client: typeof tx) => Promise<unknown>) => handler(tx),
      ),
    };
    const publisher = {
      publish: jest.fn(),
    };
    const policyEngine = new AttendancePolicyEngine();
    const historyService = {
      record: jest.fn(),
    };
    const transitionService = {
      transition: jest.fn(),
    };
    const service = new AttendanceFinalizationService(
      prisma as never,
      publisher as never,
      policyEngine,
      historyService,
      transitionService as never,
    );

    return { service, prisma, tx, publisher };
  };

  it('rejects finalization when the attendance period is payroll locked', async () => {
    const { service, tx } = makeService();
    tx.attendancePeriod.findFirst.mockResolvedValue({
      id: 'period-1',
      status: AttendancePeriodStatus.PAYROLL_LOCKED,
    });

    await expect(
      service.finalizePeriod({
        companyId: 'company-1',
        attendancePeriodId: 'period-1',
        finalizedById: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a finalization batch and publishes ATTENDANCE_FINALIZED through the outbox', async () => {
    const { service, tx, publisher } = makeService();
    tx.attendancePeriod.findFirst.mockResolvedValue({
      id: 'period-1',
      status: AttendancePeriodStatus.UNDER_REVIEW,
      startDate: new Date('2026-07-01T00:00:00.000Z'),
      endDate: new Date('2026-07-31T00:00:00.000Z'),
    });
    tx.attendancePolicyVersion.findFirst.mockResolvedValue({
      id: 'policy-1',
      policyConfiguration: {
        halfDayThresholdMinutes: 300,
        fullDayMinutes: 465,
        overtimeAfterMinutes: 465,
        lateAfterMinutes: 0,
      },
    });
    tx.holidayCalendarVersion.findFirst.mockResolvedValue({
      id: 'holiday-1',
      calendarData: {},
    });
    tx.attendanceFinalizationBatch.create.mockResolvedValue({
      id: 'batch-1',
    });
    tx.attendanceDayAggregate.findMany.mockResolvedValue([
      {
        id: 'agg-1',
        employeeId: 'employee-1',
        date: new Date('2026-07-03T00:00:00.000Z'),
        totalWorkMinutes: 465,
        totalBreakMinutes: 30,
        firstPunchAt: new Date('2026-07-03T04:45:00.000Z'),
        lastPunchAt: new Date('2026-07-03T13:00:00.000Z'),
        attendanceSessions: [
          {
            shiftAssignmentSnapshots: {
              id: 'shift-snapshot-1',
              startTime: '10:15',
              endTime: '18:00',
              gracePeriodMinutes: 0,
            },
          },
        ],
      },
    ]);
    tx.leaveRequest.findMany.mockResolvedValue([]);
    tx.attendanceFinalizationBatch.update.mockResolvedValue({
      id: 'batch-1',
    });

    const result = await service.finalizePeriod({
      companyId: 'company-1',
      attendancePeriodId: 'period-1',
      finalizedById: 'user-1',
    });

    expect(result.batchId).toBe('batch-1');
    expect(tx.attendanceFinalizationBatch.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: 'company-1',
        attendancePeriodId: 'period-1',
        policyVersionId: 'policy-1',
        holidayCalendarVersionId: 'holiday-1',
        finalizedById: 'user-1',
        status: BatchStatus.PROCESSING,
      }),
    });
    expect(publisher.publish).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        eventType: DomainEventTypes.ATTENDANCE_FINALIZED,
        entityId: 'batch-1',
        entityType: 'AttendanceFinalizationBatch',
      }),
    );
  });
});
