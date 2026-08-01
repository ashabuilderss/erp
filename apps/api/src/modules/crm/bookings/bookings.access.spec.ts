import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingsService } from './bookings.service';

describe('BookingsService employee access', () => {
  const mockPrisma = () => ({
    booking: { findFirst: jest.fn() },
    employee: { findFirst: jest.fn() },
    property: { findFirst: jest.fn() },
    customer: { findFirst: jest.fn() },
    lead: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  });
  const mockEmitter = () => ({ emit: jest.fn() });
  const mockTransition = {
    execute: jest
      .fn()
      .mockRejectedValue(
        new BadRequestException('Employees can only update their own bookings'),
      ),
    validate: jest.fn(),
  } as never;
  const mockGovernanceEventPublisher = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  it('scopes detail lookup to the assigned employee', async () => {
    const prisma = {
      booking: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new BookingsService(
      prisma as never,
      { emit: jest.fn() } as never,
      mockTransition,
      mockGovernanceEventPublisher as never,
    );

    await expect(
      service.findOne('booking-1', {
        companyId: 'company-1',
        assignedToEmployeeId: 'employee-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'booking-1',
          companyId: 'company-1',
          assignedToEmployeeId: 'employee-1',
        },
      }),
    );
  });

  it('denies employee create with non-self assignment', async () => {
    const prisma = mockPrisma();
    prisma.employee.findFirst.mockResolvedValue({ id: 'other' });
    prisma.property.findFirst.mockResolvedValue({
      id: 'p1',
      status: 'AVAILABLE',
    });
    prisma.customer.findFirst.mockResolvedValue({ id: 'c1' });
    prisma.booking.findFirst.mockResolvedValue(null);
    const service = new BookingsService(
      prisma as never,
      mockEmitter() as never,
      mockTransition,
      mockGovernanceEventPublisher as never,
    );

    await expect(
      service.create(
        {
          propertyId: 'p1',
          customerId: 'c1',
          bookingDate: new Date().toISOString(),
          amount: 100000,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          assignedToEmployeeId: 'other',
        } as never,
        'company-1',
        'EMPLOYEE',
        'employee-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('denies employee update of unassigned booking', async () => {
    const prisma = mockPrisma();
    prisma.booking.findFirst.mockResolvedValue(null);
    const service = new BookingsService(
      prisma as never,
      mockEmitter() as never,
      mockTransition,
      mockGovernanceEventPublisher as never,
    );

    await expect(
      service.update(
        'booking-1',
        {},
        'company-1',
        { assignedToEmployeeId: 'employee-1', companyId: 'company-1' },
        'EMPLOYEE',
        'employee-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('denies employee status update of another employee booking', async () => {
    const prisma = mockPrisma();
    prisma.booking.findFirst.mockResolvedValue({
      id: 'booking-1',
      assignedToEmployeeId: 'other-emp',
      propertyId: 'p1',
    });
    prisma.$transaction.mockImplementation(
      async (fn: (tx: never) => Promise<never>) => {
        return fn(prisma as never);
      },
    );
    const service = new BookingsService(
      prisma as never,
      mockEmitter() as never,
      mockTransition,
      mockGovernanceEventPublisher as never,
    );

    await expect(
      service.updateStatus(
        'booking-1',
        'CONFIRMED',
        'company-1',
        { assignedToEmployeeId: 'employee-1', companyId: 'company-1' },
        'EMPLOYEE',
        'employee-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
