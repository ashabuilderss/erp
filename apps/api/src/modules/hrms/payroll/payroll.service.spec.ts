import { PayrollRunStatus } from '@prisma/client';
import { TransitionService } from '../../../common/services/transition.service';
import { PayrollService } from './payroll.service';

describe('PayrollService processing', () => {
  const mockTransitionService = {
    validate: jest.fn(),
    canTransition: jest.fn().mockReturnValue(true),
    execute: jest.fn(),
    getRule: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransitionService.validate.mockReset();
    mockTransitionService.validate.mockImplementation(() => {});
  });

  const makeService = (overrides?: { holds?: unknown[] }) => {
    const payslipCreate = jest.fn().mockResolvedValue({});
    const forbiddenRead = jest.fn(() => {
      throw new Error(
        'Operational attendance table must not be read by payroll',
      );
    });
    const prisma = {
      payrollRun: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'run-1',
            companyId: 'company-1',
            status: PayrollRunStatus.DRAFT,
            periodStart: new Date('2026-06-01'),
            periodEnd: new Date('2026-06-30'),
          })
          .mockResolvedValueOnce({
            id: 'run-1',
            companyId: 'company-1',
            status: PayrollRunStatus.COMPLETED,
            processedById: 'approver-1',
          }),
      },
      company: {
        findUnique: jest.fn().mockResolvedValue({
          settings: { payrollComponents: { pf: false, tds: false } },
        }),
      },
      employee: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'employee-1',
            salary: 30000,
            dateOfJoining: new Date('2026-01-01'),
          },
        ]),
      },
      payrollHold: {
        findMany: jest.fn().mockResolvedValue(overrides?.holds ?? []),
      },
      payrollAttendanceSnapshot: {
        findMany: jest.fn().mockResolvedValue([
          {
            employeeId: 'employee-1',
            snapshotData: {
              payableMinutes: 465 * 20,
              paidDays: 20,
            },
          },
        ]),
      },
      pipelineCommission: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      incentive: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: 'owner-1' }]),
      },
      notification: { create: jest.fn().mockResolvedValue({}) },
      payslip: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      attendancePunch: { findMany: forbiddenRead },
      attendanceSession: { findMany: forbiddenRead },
      attendanceDayAggregate: { findMany: forbiddenRead },
      attendanceSummary: { findMany: forbiddenRead },
      leaveRequest: { findMany: forbiddenRead },
      $transaction: jest.fn(async (callback) =>
        callback({
          payrollRun: { update: jest.fn().mockResolvedValue({}) },
          payslip: { create: payslipCreate },
          notification: { create: jest.fn().mockResolvedValue({}) },
          payrollAttendanceSnapshot: { findMany: jest.fn().mockResolvedValue([]) },
        }),
      ),
    };
    const eventPublisher = { publish: jest.fn() };
    const employeesService = {
      findActiveForPayroll: jest.fn().mockResolvedValue([
        {
          id: 'employee-1',
          salary: 30000,
          dateOfJoining: new Date('2026-01-01'),
        },
      ]),
    };
    const service = new PayrollService(
      prisma as never,
      eventPublisher as never,
      employeesService as never,
      mockTransitionService as never,
    );
    return { service, prisma, eventPublisher, payslipCreate, forbiddenRead, employeesService };
  };

  it('processes payroll exclusively from PayrollAttendanceSnapshot', async () => {
    const { service, prisma, payslipCreate, forbiddenRead } = makeService();

    await service.processRun('run-1', 'approver-1', 'company-1');

    expect(prisma.payrollAttendanceSnapshot.findMany).toHaveBeenCalled();
    expect(forbiddenRead).not.toHaveBeenCalled();
    expect(payslipCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        grossPay: 20000,
        netPay: 20000,
      }),
    });
  });

  it('emits PAYROLL_PROCESSED through the outbox', async () => {
    const { service, eventPublisher } = makeService();

    await service.processRun('run-1', 'approver-1', 'company-1');

    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        eventType: 'PAYROLL_PROCESSED',
        entityType: 'PayrollRun',
      }),
    );
  });

  it('excludes employees under active payroll hold', async () => {
    const { service, payslipCreate } = makeService({
      holds: [{ employeeId: 'employee-1' }],
    });

    const prisma2 = {
      payrollRun: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'run-1',
            companyId: 'company-1',
            status: PayrollRunStatus.DRAFT,
            periodStart: new Date('2026-06-01'),
            periodEnd: new Date('2026-06-30'),
          })
          .mockResolvedValueOnce({
            id: 'run-1',
            companyId: 'company-1',
            status: PayrollRunStatus.COMPLETED,
            processedById: 'approver-1',
          }),
      },
      company: {
        findUnique: jest.fn().mockResolvedValue({
          settings: { payrollComponents: { pf: false, tds: false } },
        }),
      },
      employee: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'employee-1',
            salary: 30000,
            dateOfJoining: new Date('2026-01-01'),
          },
          {
            id: 'employee-2',
            salary: 25000,
            dateOfJoining: new Date('2026-01-01'),
          },
        ]),
      },
      payrollHold: {
        findMany: jest.fn().mockResolvedValue([{ employeeId: 'employee-1' }]),
      },
      payrollAttendanceSnapshot: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { employeeId: 'employee-2', snapshotData: { paidDays: 22 } },
          ]),
      },
      pipelineCommission: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      incentive: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      notification: { create: jest.fn().mockResolvedValue({}) },
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: 'owner-1' }]),
      },
      payslip: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(async (callback) =>
        callback({
          payrollRun: { update: jest.fn().mockResolvedValue({}) },
          payslip: { create: payslipCreate },
          notification: { create: jest.fn().mockResolvedValue({}) },
          payrollAttendanceSnapshot: { findMany: jest.fn().mockResolvedValue([]) },
        }),
      ),
    };
    const eventPublisher = { publish: jest.fn() };
    const employeesService2 = {
      findActiveForPayroll: jest.fn().mockResolvedValue([
        {
          id: 'employee-1',
          salary: 30000,
          dateOfJoining: new Date('2026-01-01'),
        },
        {
          id: 'employee-2',
          salary: 25000,
          dateOfJoining: new Date('2026-01-01'),
        },
      ]),
    };
    const service2 = new PayrollService(
      prisma2 as never,
      eventPublisher as never,
      employeesService2 as never,
      mockTransitionService as never,
    );

    await service2.processRun('run-1', 'approver-1', 'company-1');

    expect(payslipCreate).toHaveBeenCalledTimes(1);
    expect(payslipCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        employeeId: 'employee-2',
      }),
    });
  });

  it('filters active payroll holds without blocking markPaid', async () => {
    const mockPayslips = [
      { id: 'ps-1', employeeId: 'employee-1' },
      { id: 'ps-2', employeeId: 'employee-2' },
    ];
    const prisma = {
      payrollRun: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'run-1',
          companyId: 'company-1',
          status: PayrollRunStatus.COMPLETED,
          processedById: 'approver-1',
        }),
      },
      payrollHold: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { employeeId: 'employee-1', reason: 'Overdue task' },
          ]),
      },
      payslip: {
        findMany: jest.fn().mockResolvedValue(mockPayslips),
      },
      $transaction: jest
        .fn()
        .mockImplementation(async (fn: Function) => fn({ payslip: { updateMany: jest.fn() }, payrollRun: { update: jest.fn() } })),
    };
    const eventPublisher = { publish: jest.fn() };
    const service = new PayrollService(
      prisma as never,
      eventPublisher as never,
      { findActiveForPayroll: jest.fn().mockResolvedValue([]) } as never,
      mockTransitionService as never,
    );

    const result = await service.markPaid('run-1', 'company-1');
    expect(result).toBeDefined();
  });

  it('blocks markPaid when processedById is missing', async () => {
    const prisma = {
      payrollRun: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'run-1',
          companyId: 'company-1',
          status: PayrollRunStatus.COMPLETED,
          processedById: null,
        }),
      },
      payrollHold: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      payslip: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest
        .fn()
        .mockImplementation(async (fn: Function) => fn({})),
    };
    const eventPublisher = { publish: jest.fn() };
    const service = new PayrollService(
      prisma as never,
      eventPublisher as never,
      { findActiveForPayroll: jest.fn().mockResolvedValue([]) } as never,
      mockTransitionService as never,
    );

    await expect(service.markPaid('run-1', 'company-1')).rejects.toThrow(
      'no processing record',
    );
  });
});
