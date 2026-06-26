import { PayrollRunStatus } from '@prisma/client';
import { PayrollService } from './payroll.service';

describe('PayrollService processing', () => {
  it('pays configured weekly-off days within the payroll period', async () => {
    const run = {
      id: 'run-1',
      companyId: 'company-1',
      status: PayrollRunStatus.DRAFT,
      periodStart: new Date('2026-06-15'),
      periodEnd: new Date('2026-06-21'),
    };
    const payslipCreate = jest.fn().mockResolvedValue({});
    const prisma = {
      payrollRun: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(run)
          .mockResolvedValueOnce({ ...run, status: PayrollRunStatus.COMPLETED }),
      },
      company: {
        findUnique: jest.fn().mockResolvedValue({
          settings: {
            weeklyOffDays: ['SUNDAY'],
            payrollComponents: { pf: false, tds: false },
          },
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
      attendance: {
        findMany: jest.fn().mockResolvedValue(
          [15, 16, 17, 18, 19, 20].map((day) => ({
            employeeId: 'employee-1',
            date: new Date(`2026-06-${day}`),
            status: 'PRESENT',
          })),
        ),
      },
      leaveRequest: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(async (callback) =>
        callback({
          payrollRun: { update: jest.fn().mockResolvedValue({}) },
          payslip: { create: payslipCreate },
        }),
      ),
    };
    const service = new PayrollService(prisma as never);

    await service.processRun('run-1', 'approver-1', 'company-1');

    expect(payslipCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        grossPay: 7000,
        netPay: 7000,
      }),
    });
  });
  it('pays approved leave days within the payroll period', async () => {
    const run = {
      id: 'run-2',
      companyId: 'company-1',
      status: PayrollRunStatus.DRAFT,
      periodStart: new Date('2026-06-15'),
      periodEnd: new Date('2026-06-21'),
    };
    const payslipCreate = jest.fn().mockResolvedValue({});
    const prisma = {
      payrollRun: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(run)
          .mockResolvedValueOnce({ ...run, status: PayrollRunStatus.COMPLETED }),
      },
      company: {
        findUnique: jest.fn().mockResolvedValue({
          settings: {
            weeklyOffDays: ['SUNDAY'],
            payrollComponents: { pf: false, tds: false },
          },
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
      attendance: {
        findMany: jest.fn().mockResolvedValue(
          [15, 16, 17, 18, 19].map((day) => ({
            employeeId: 'employee-1',
            date: new Date(`2026-06-${day}`),
            status: 'PRESENT',
          })),
        ),
      },
      leaveRequest: {
        findMany: jest.fn().mockResolvedValue([
          {
            employeeId: 'employee-1',
            startDate: new Date('2026-06-20'),
            endDate: new Date('2026-06-20'),
          },
        ]),
      },
      $transaction: jest.fn(async (callback) =>
        callback({
          payrollRun: { update: jest.fn().mockResolvedValue({}) },
          payslip: { create: payslipCreate },
        }),
      ),
    };
    const service = new PayrollService(prisma as never);

    await service.processRun('run-2', 'approver-1', 'company-1');

    expect(payslipCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        grossPay: 7000,
        netPay: 7000,
      }),
    });
  });
});
