import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingsService } from './bookings.service';

describe('BookingsService employee access', () => {
  const mockPrisma = () => ({ booking: { findFirst: jest.fn() }, employee: { findFirst: jest.fn() }, property: { findFirst: jest.fn() }, customer: { findFirst: jest.fn() }, lead: { findFirst: jest.fn() }, $transaction: jest.fn() });
  const mockEmitter = () => ({ emit: jest.fn() });
  const mockTransition = { execute: jest.fn().mockRejectedValue(new BadRequestException('Employees can only update their own bookings')), validate: jest.fn() } as never;

  it('scopes detail lookup to the assigned employee', async () => {
    const prisma = { booking: { findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new BookingsService(prisma as never, { emit: jest.fn() } as never, mockTransition);

    await expect(service.findOne('booking-1', 'company-1', 'employee-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.booking.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'booking-1', companyId: 'company-1', assignedToEmployeeId: 'employee-1' },
    }));
  });

  it('denies employee create with non-self assignment', async () => {
    const prisma = mockPrisma();
    (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'other' });
    (prisma.property.findFirst as jest.Mock).mockResolvedValue({ id: 'p1', status: 'AVAILABLE' });
    (prisma.customer.findFirst as jest.Mock).mockResolvedValue({ id: 'c1' });
    (prisma.booking.findFirst as jest.Mock).mockResolvedValue(null);
    const service = new BookingsService(prisma as never, mockEmitter() as never, mockTransition);

    await expect(
      service.create(
        { propertyId: 'p1', customerId: 'c1', bookingDate: new Date().toISOString(), amount: 100000, status: 'PENDING', paymentStatus: 'PENDING', assignedToEmployeeId: 'other' } as never,
        'company-1', 'EMPLOYEE', 'employee-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('denies employee update of unassigned booking', async () => {
    const prisma = mockPrisma();
    (prisma.booking.findFirst as jest.Mock).mockResolvedValue(null);
    const service = new BookingsService(prisma as never, mockEmitter() as never, mockTransition);

    await expect(
      service.update('booking-1', {} as never, 'company-1', 'employee-1', 'EMPLOYEE', 'employee-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('denies employee status update of another employee booking', async () => {
    const prisma = mockPrisma();
    (prisma.booking.findFirst as jest.Mock).mockResolvedValue({ id: 'booking-1', assignedToEmployeeId: 'other-emp', propertyId: 'p1' });
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: never) => Promise<never>) => {
      return fn(prisma as never);
    });
    const service = new BookingsService(prisma as never, mockEmitter() as never, mockTransition);

    await expect(
      service.updateStatus('booking-1', 'CONFIRMED' as never, 'company-1', 'employee-1', 'EMPLOYEE', 'employee-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
