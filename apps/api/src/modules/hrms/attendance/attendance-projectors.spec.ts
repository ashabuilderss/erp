import { AttendanceSummaryProjector } from './projectors/attendance-summary.projector';
import { PayrollAttendanceSnapshotProjector } from './projectors/payroll-attendance-snapshot.projector';
import { DashboardMetricsProjector } from './projectors/dashboard-metrics.projector';

const finalizedEvent = {
  id: 'event-1',
  correlationId: 'correlation-1',
  payload: {
    companyId: 'company-1',
    attendancePeriodId: 'period-1',
    attendanceFinalizationBatchId: 'batch-1',
    policyVersionId: 'policy-1',
    holidayCalendarVersionId: 'holiday-1',
    fullDayMinutes: 465,
    finalized: [
      {
        employeeId: 'employee-1',
        date: new Date('2026-07-03T00:00:00.000Z'),
        shiftAssignmentSnapshotId: 'shift-snapshot-1',
        result: {
          payableMinutes: 465,
          overtimeMinutes: 30,
          lateMinutes: 5,
          isAbsent: false,
          leaveMinutes: 0,
        },
      },
    ],
  },
} as never;

describe('Attendance projectors', () => {
  it('AttendanceSummaryProjector writes only attendance summaries', async () => {
    const prisma = {
      attendanceSummary: {
        upsert: jest.fn(),
      },
    };
    const processor = {
      process: jest.fn((_event, _handler, callback) => callback()),
    };
    const projector = new AttendanceSummaryProjector(
      prisma as never,
      processor as never,
    );

    await projector.handleAttendanceFinalized(finalizedEvent);

    expect(prisma.attendanceSummary.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyId_employeeId_attendancePeriodId: {
            companyId: 'company-1',
            employeeId: 'employee-1',
            attendancePeriodId: 'period-1',
          },
        },
      }),
    );
  });

  it('PayrollAttendanceSnapshotProjector writes only payroll attendance snapshots', async () => {
    const prisma = {
      payrollAttendanceSnapshot: {
        upsert: jest.fn(),
      },
    };
    const processor = {
      process: jest.fn((_event, _handler, callback) => callback()),
    };
    const projector = new PayrollAttendanceSnapshotProjector(
      prisma as never,
      processor as never,
    );

    await projector.handleAttendanceFinalized(finalizedEvent);

    expect(prisma.payrollAttendanceSnapshot.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyId_employeeId_attendancePeriodId: {
            companyId: 'company-1',
            employeeId: 'employee-1',
            attendancePeriodId: 'period-1',
          },
        },
      }),
    );
  });

  it('DashboardMetricsProjector writes only dashboard metrics snapshots', async () => {
    const prisma = {
      dashboardMetricsSnapshot: {
        upsert: jest.fn(),
      },
      dashboardKpiSnapshot: {
        upsert: jest.fn(),
      },
      employee: {
        count: jest.fn().mockResolvedValue(10),
      },
    };
    const processor = {
      process: jest.fn((_event, _handler, callback) => callback()),
    };
    const projector = new DashboardMetricsProjector(
      prisma as never,
      processor as never,
      { countActive: jest.fn().mockResolvedValue(10) } as never,
      {} as never,
    );

    await projector.handleAttendanceFinalized(finalizedEvent);

    expect(prisma.dashboardMetricsSnapshot.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyId_snapshotDate: {
            companyId: 'company-1',
            snapshotDate: new Date('2026-07-03T00:00:00.000Z'),
          },
        },
      }),
    );
  });
});
