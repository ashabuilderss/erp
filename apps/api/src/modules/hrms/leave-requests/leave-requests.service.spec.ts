import { LeaveStatus, LeaveType, UserRole } from '@prisma/client';
import { LeaveRequestsService } from './leave-requests.service';

describe('LeaveRequestsService approval', () => {
  it('consumes the allocation matching the requested leave type', async () => {
    const prisma = {
      leaveRequest: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'leave-1',
          companyId: 'company-1',
          employeeId: 'employee-1',
          status: LeaveStatus.PENDING,
          type: LeaveType.CASUAL,
          startDate: new Date('2026-06-22'),
          endDate: new Date('2026-06-23'),
        }),
        update: jest.fn().mockResolvedValue({
          employee: { user: null },
          approvedBy: null,
        }),
      },
      employee: {
        findUnique: jest.fn().mockResolvedValue({ id: 'approver-employee' }),
      },
      leaveAllocation: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn(async (fn: (tx: any) => Promise<unknown>) => fn(prisma as never)),
    };
    const service = new LeaveRequestsService(
      prisma as never,
      { emit: jest.fn() } as never,
      { validate: jest.fn(), execute: jest.fn() } as never,
    );

    await service.approve(
      'leave-1',
      { status: LeaveStatus.APPROVED },
      'approver-user',
      'company-1',
      UserRole.ADMIN,
    );

    expect(prisma.leaveAllocation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          employeeId_companyId_year_leaveType: expect.objectContaining({
            leaveType: LeaveType.CASUAL,
          }),
        },
      }),
    );
  });
});
