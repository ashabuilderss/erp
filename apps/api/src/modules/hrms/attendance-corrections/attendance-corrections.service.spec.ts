import { AttendanceCorrectionsService } from './attendance-corrections.service';

describe('AttendanceCorrectionsService', () => {
  const makeService = () => {
    const tx = {
      employee: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'employee-1', userId: 'user-creator' }),
      },
      attendanceDayAggregate: {
        findFirst: jest.fn(),
      },
      attendancePeriod: {
        findFirst: jest.fn().mockResolvedValue({ id: 'period-1' }),
      },
      attendanceCorrection: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
      },
      approvalRequest: {
        findFirst: jest.fn(),
      },
      attendanceHistory: {
        create: jest.fn(),
      },
    };
    const prisma = {
      ...tx,
      $transaction: jest.fn(
        async (handler: (client: typeof tx) => Promise<unknown>) => handler(tx),
      ),
    };
    const spawning = {
      spawnRequest: jest.fn(),
    };
    const runtime = {
      approveStep: jest.fn(),
      rejectStep: jest.fn(),
    };
    const finalization = {
      finalizePeriod: jest.fn(),
    };
    const eventPublisher = {
      publish: jest.fn(),
    };
    const historyService = {
      record: jest.fn(),
    };
    const service = new AttendanceCorrectionsService(
      prisma as never,
      spawning as never,
      runtime as never,
      finalization as never,
      { findBasicByIdAndCompany: jest.fn().mockResolvedValue({ id: 'employee-1', userId: 'user-creator' }) } as never,
      eventPublisher as never,
      historyService,
    );

    return { service, prisma: tx, spawning, runtime, finalization };
  };

  it('creates a correction and persists the correction payload', async () => {
    const { service, prisma, spawning } = makeService();
    prisma.attendanceDayAggregate.findFirst.mockResolvedValue({ id: 'day-1' });
    prisma.attendanceCorrection.create.mockResolvedValue({
      id: 'correction-1',
    });
    spawning.spawnRequest.mockResolvedValue({ id: 'approval-1' });
    prisma.attendanceCorrection.update.mockResolvedValue({
      id: 'correction-1',
      approvalRequestId: 'approval-1',
    });

    const result = await service.create(
      {
        date: '2026-07-03',
        reason: 'Forgot punch out',
        requestedCheckIn: '2026-07-03T10:00:00.000Z',
        requestedCheckOut: '2026-07-03T18:00:00.000Z',
      },
      'employee-1',
      'company-1',
    );

    expect(prisma.attendanceCorrection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reason: 'Forgot punch out',
        requestedCheckIn: '2026-07-03T10:00:00.000Z',
        requestedCheckOut: '2026-07-03T18:00:00.000Z',
      }),
    });
    expect(result.approvalRequestId).toBe('approval-1');
  });

  it('approves through Approval Runtime and re-finalizes with correction overrides', async () => {
    const { service, prisma, runtime, finalization } = makeService();

    const correctionRecord = {
      id: 'correction-1',
      employeeId: 'employee-1',
      companyId: 'company-1',
      approvalRequestId: 'approval-1',
      dayAggregateId: 'day-1',
      requestedCheckIn: '2026-07-03T10:00:00.000Z',
      requestedCheckOut: '2026-07-03T18:00:00.000Z',
      attendanceDayAggregates: {
        date: new Date('2026-07-03'),
      },
    };
    prisma.attendanceCorrection.findFirst
      .mockResolvedValueOnce(correctionRecord)
      .mockResolvedValueOnce({
        id: 'correction-1',
        dayAggregateId: 'day-1',
        requestedCheckIn: '2026-07-03T10:00:00.000Z',
        requestedCheckOut: '2026-07-03T18:00:00.000Z',
      })
      .mockResolvedValueOnce({ ...correctionRecord, approvalRequestId: null });
    prisma.approvalRequest.findFirst.mockResolvedValue({
      id: 'approval-1',
      status: 'APPROVED',
    });

    await service.approve('correction-1', 'user-1', 'company-1', 'Approved');

    expect(runtime.approveStep).toHaveBeenCalledWith(
      'approval-1',
      'user-1',
      'Approved',
    );
    expect(finalization.finalizePeriod).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        correctionOverrides: [
          {
            dayAggregateId: 'day-1',
            requestedCheckIn: '2026-07-03T10:00:00.000Z',
            requestedCheckOut: '2026-07-03T18:00:00.000Z',
          },
        ],
      }),
    );
  });
});
