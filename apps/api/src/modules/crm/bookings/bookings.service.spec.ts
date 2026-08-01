import { NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';

const mockGovernanceEventPublisher = {
  publish: jest.fn().mockResolvedValue(undefined),
};

describe('BookingsService tenant isolation', () => {
  it('rejects a property that does not belong to the booking company', async () => {
    const prisma = {
      property: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'property-beta',
          companyId: 'company-beta',
          status: 'AVAILABLE',
        }),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      booking: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn().mockResolvedValue({ id: 'booking-alpha' }),
    };
    const eventEmitter = { emit: jest.fn() };
    const mockTransition = {} as never;
    const service = new BookingsService(
      prisma as never,
      eventEmitter as never,
      mockTransition,
      mockGovernanceEventPublisher as never,
    );

    await expect(
      service.create(
        {
          propertyId: 'property-beta',
          customerId: 'customer-alpha',
          assignedToEmployeeId: 'employee-alpha',
          bookingDate: new Date().toISOString(),
          amount: 1000,
        },
        'company-alpha',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('rejects a customer that does not belong to the booking company', async () => {
    const prisma = {
      property: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'property-alpha',
          companyId: 'company-alpha',
          status: 'AVAILABLE',
        }),
      },
      customer: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      employee: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'employee-alpha',
          companyId: 'company-alpha',
        }),
      },
      booking: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn().mockResolvedValue({ id: 'booking-alpha' }),
    };
    const eventEmitter = { emit: jest.fn() };
    const mockTransition = {} as never;
    const service = new BookingsService(
      prisma as never,
      eventEmitter as never,
      mockTransition,
      mockGovernanceEventPublisher as never,
    );

    await expect(
      service.create(
        {
          propertyId: 'property-alpha',
          customerId: 'customer-beta',
          assignedToEmployeeId: 'employee-alpha',
          bookingDate: new Date().toISOString(),
          amount: 1000,
        },
        'company-alpha',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('rejects an assignee that does not belong to the booking company', async () => {
    const prisma = {
      property: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'property-alpha',
          companyId: 'company-alpha',
          status: 'AVAILABLE',
        }),
      },
      customer: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'customer-alpha',
          companyId: 'company-alpha',
        }),
      },
      employee: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      booking: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn().mockResolvedValue({ id: 'booking-alpha' }),
    };
    const eventEmitter = { emit: jest.fn() };
    const mockTransition = {} as never;
    const service = new BookingsService(
      prisma as never,
      eventEmitter as never,
      mockTransition,
      mockGovernanceEventPublisher as never,
    );

    await expect(
      service.create(
        {
          propertyId: 'property-alpha',
          customerId: 'customer-alpha',
          assignedToEmployeeId: 'employee-beta',
          bookingDate: new Date().toISOString(),
          amount: 1000,
        },
        'company-alpha',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('rejects an optional lead that belongs to another company', async () => {
    const prisma = {
      property: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'property-alpha',
          companyId: 'company-alpha',
          status: 'AVAILABLE',
        }),
      },
      customer: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'customer-alpha',
          companyId: 'company-alpha',
        }),
      },
      employee: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'employee-alpha',
          companyId: 'company-alpha',
        }),
      },
      lead: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      booking: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn().mockResolvedValue({ id: 'booking-alpha' }),
    };
    const eventEmitter = { emit: jest.fn() };
    const mockTransition = {} as never;
    const service = new BookingsService(
      prisma as never,
      eventEmitter as never,
      mockTransition,
      mockGovernanceEventPublisher as never,
    );

    await expect(
      service.create(
        {
          propertyId: 'property-alpha',
          customerId: 'customer-alpha',
          leadId: 'lead-beta',
          assignedToEmployeeId: 'employee-alpha',
          bookingDate: new Date().toISOString(),
          amount: 1000,
        },
        'company-alpha',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
