import { LeaveStatus, LeaveType, UserRole } from '@prisma/client';
import { LeaveRequestsService } from './leave-requests.service';

describe('LeaveRequestsService approval', () => {
  it('consumes the allocation matching the requested leave type', async () => {
    const prisma: any = {
      leaveRequest: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'leave-1',
          companyId: 'company-1',
          employeeId: 'employee-1',
          status: LeaveStatus.PENDING,
          type: LeaveType.MEDICAL,
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
      $transaction: jest.fn(
        async (fn: (tx: any) => Promise<unknown>): Promise<unknown> =>
          fn(prisma),
      ),
    };
    const service = new LeaveRequestsService(
      prisma as never,
      { emit: jest.fn() } as never,
      { validate: jest.fn(), execute: jest.fn() } as never,
      { findBasicById: jest.fn().mockResolvedValue({ id: 'employee-1' }), findByUserId: jest.fn().mockResolvedValue({ id: 'approver-employee' }) } as never,
    );

    await service.approve(
      'leave-1',
      { status: LeaveStatus.APPROVED },
      'approver-user',
      'company-1',
      UserRole.OWNER,
    );

    expect(prisma.leaveAllocation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          employeeId_companyId_year_leaveType: expect.objectContaining({
            leaveType: LeaveType.MEDICAL,
          }),
        },
      }),
    );
  });
});
