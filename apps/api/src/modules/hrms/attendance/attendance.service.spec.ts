import { AttendanceService } from './attendance.service';
import { PunchType } from '@prisma/client';

describe('AttendanceService punch write side', () => {
  const makeService = () => {
    const tx = {
      company: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ settings: { timezone: 'Asia/Kolkata' } }),
      },
      attendancePunch: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      employee: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'employee-1',
          companyId: 'company-1',
          companies: { settings: { timezone: 'Asia/Kolkata' } },
        }),
      },
      leaveRequest: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      officeLocation: {
        findMany: jest.fn(),
      },
      storageObject: {
        create: jest.fn().mockResolvedValue({ id: 'storage-1' }),
      },
      attendanceEvidence: {
        create: jest.fn().mockResolvedValue({ id: 'evidence-1' }),
      },
      attendanceEvidenceReview: {
        create: jest.fn(),
      },
      attendanceDayAggregate: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      shiftDefinition: {
        findFirst: jest.fn(),
      },
      employeeShiftAssignment: {
        findFirst: jest.fn(),
      },
      shiftAssignmentSnapshot: {
        create: jest.fn(),
      },
      attendanceSession: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      attendanceAnomaly: {
        create: jest.fn(),
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
    const service = new AttendanceService(
      prisma as never,
      { publish: jest.fn() } as never,
      { record: jest.fn() } as never,
      { get: jest.fn(), set: jest.fn(), del: jest.fn() } as never,
      {} as never, // transitionService
      { findByIdWithCompanySettings: jest.fn().mockResolvedValue({
        id: 'employee-1',
        companyId: 'company-1',
        companies: { settings: { timezone: 'Asia/Kolkata' } },
      }) } as never, // employeesService
      { findApprovedLeaveForDate: jest.fn().mockResolvedValue(null) } as never, // leaveRequestsService
      { broadcastToCompany: jest.fn(), broadcastToUser: jest.fn() } as never, // realtimeGateway
    );
    return { service, prisma: tx, redis: service['redis'] };
  };

  it('creates a real shift assignment snapshot instead of using a dummy id for IN punches', async () => {
    const { service, prisma, redis } = makeService();
    (redis.get as jest.Mock).mockResolvedValue('test-nonce');
    prisma.attendancePunch.create.mockResolvedValue({
      id: 'punch-1',
      punchType: PunchType.IN,
      timestamp: new Date('2026-07-03T04:45:00.000Z'),
    });
    prisma.attendanceDayAggregate.findUnique.mockResolvedValue(null);
    prisma.attendanceDayAggregate.create.mockResolvedValue({
      id: 'aggregate-1',
      firstPunchAt: null,
    });
    prisma.shiftDefinition.findFirst.mockResolvedValue({
      id: 'shift-1',
      name: 'General',
      startTime: '10:15',
      endTime: '18:00',
      gracePeriodMinutes: 0,
    });
    prisma.shiftAssignmentSnapshot.create.mockResolvedValue({
      id: 'shift-snapshot-1',
    });
    prisma.attendanceSession.create.mockResolvedValue({ id: 'session-1' });

    await service.punch('employee-1', 'company-1', {
      punchType: PunchType.IN,
      timestamp: '2026-07-03T04:45:00.000Z',
      photoUrl: 'test.jpg',
      nonce: 'test-nonce',
    });

    expect(prisma.shiftAssignmentSnapshot.create).toHaveBeenCalled();
    expect(prisma.attendanceSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shiftAssignmentSnapshotId: 'shift-snapshot-1',
      }),
    });
  });

  it('tracks break minutes between BREAK_START and BREAK_END punches', async () => {
    const { service, prisma, redis } = makeService();
    (redis.get as jest.Mock).mockResolvedValue('test-nonce');
    prisma.attendancePunch.create.mockResolvedValue({
      id: 'punch-break-end',
      punchType: PunchType.BREAK_END,
      timestamp: new Date('2026-07-03T08:00:00.000Z'),
    });
    prisma.attendanceDayAggregate.findUnique.mockResolvedValue({
      id: 'aggregate-1',
      firstPunchAt: new Date('2026-07-03T04:45:00.000Z'),
    });
    prisma.attendanceSession.findFirst.mockResolvedValue({
      id: 'session-1',
      sessionStart: new Date('2026-07-03T04:45:00.000Z'),
      totalBreakMinutes: 0,
      lastPunchId: 'punch-break-start',
      sessionStatus: 'ACTIVE',
    });
    prisma.attendancePunch.findUnique.mockResolvedValue({
      id: 'punch-break-start',
      timestamp: new Date('2026-07-03T07:30:00.000Z'),
      punchType: PunchType.BREAK_START,
    });

    await service.punch('employee-1', 'company-1', {
      punchType: PunchType.BREAK_END,
      timestamp: '2026-07-03T08:00:00.000Z',
      photoUrl: 'test.jpg',
      nonce: 'test-nonce',
    });

    expect(prisma.attendanceSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: expect.objectContaining({
        totalBreakMinutes: 30,
        lastPunchId: 'punch-break-end',
      }),
    });
  });

  it('flags office punches with GPS outside all office locations as locationMismatch', async () => {
    const { service, prisma, redis } = makeService();
    (redis.get as jest.Mock).mockResolvedValue('test-nonce');
    service['employeesService'].findByIdWithCompanySettings = jest.fn().mockResolvedValue({
      id: 'employee-1',
      companyId: 'company-1',
      staffType: 'OFFICE',
      companies: { settings: { timezone: 'Asia/Kolkata' } },
    });
    // Office located at (12.97, 77.59) with 50m radius; punch GPS far away -> mismatch
    prisma.officeLocation.findMany = jest.fn().mockResolvedValue([
      { latitude: 12.9716, longitude: 77.5946, radius: 50, ipAddress: '10.0.0.1' },
    ]);
    prisma.attendancePunch.create.mockResolvedValue({
      id: 'punch-1',
      punchType: PunchType.IN,
      timestamp: new Date('2026-07-03T04:45:00.000Z'),
    });
    prisma.attendanceDayAggregate.findUnique.mockResolvedValue(null);
    prisma.attendanceDayAggregate.create.mockResolvedValue({ id: 'aggregate-1', firstPunchAt: null });
    prisma.shiftDefinition.findFirst.mockResolvedValue(null);
    prisma.shiftAssignmentSnapshot.create = jest
      .fn()
      .mockResolvedValue({ id: 'shift-snapshot-1' });
    prisma.attendanceSession.create = jest.fn().mockResolvedValue({ id: 'session-1' });

    await service.punch('employee-1', 'company-1', {
      punchType: PunchType.IN,
      timestamp: '2026-07-03T04:45:00.000Z',
      photoUrl: 'test.jpg',
      nonce: 'test-nonce',
      latitude: 28.6139,
      longitude: 77.209,
    });

    expect(prisma.attendancePunch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ locationMismatch: true }),
      }),
    );
    expect(prisma.officeLocation.findMany).toHaveBeenCalled();
  });
});
