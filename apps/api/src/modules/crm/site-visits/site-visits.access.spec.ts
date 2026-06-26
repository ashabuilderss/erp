import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SiteVisitsService } from './site-visits.service';

describe('SiteVisitsService employee access', () => {
  const mockPrisma = () => ({ siteVisit: { findFirst: jest.fn() }, employee: { findFirst: jest.fn() }, property: { findFirst: jest.fn() }, customer: { findFirst: jest.fn() } });
  const mockEmitter = () => ({ emit: jest.fn() });
  const mockTransition = { execute: jest.fn().mockRejectedValue(new BadRequestException('Employees can only update their own site visits')), validate: jest.fn() } as never;

  it('scopes detail lookup to the assigned employee', async () => {
    const prisma = { siteVisit: { findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new SiteVisitsService(prisma as never, { emit: jest.fn() } as never, mockTransition);

    await expect(service.findOne('visit-1', 'company-1', 'employee-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.siteVisit.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'visit-1', companyId: 'company-1', assignedToEmployeeId: 'employee-1' },
    }));
  });

  it('denies employee create with non-self assignment', async () => {
    const prisma = mockPrisma();
    (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'other' });
    (prisma.property.findFirst as jest.Mock).mockResolvedValue({ id: 'p1' });
    (prisma.customer.findFirst as jest.Mock).mockResolvedValue({ id: 'c1' });
    const service = new SiteVisitsService(prisma as never, mockEmitter() as never, mockTransition);

    await expect(
      service.create(
        { propertyId: 'p1', customerId: 'c1', scheduledDate: new Date().toISOString(), assignedToEmployeeId: 'other' } as never,
        'company-1', 'EMPLOYEE', 'employee-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('denies employee update of unassigned site visit', async () => {
    const prisma = mockPrisma();
    (prisma.siteVisit.findFirst as jest.Mock).mockResolvedValue(null);
    const service = new SiteVisitsService(prisma as never, mockEmitter() as never, mockTransition);

    await expect(
      service.update('visit-1', {} as never, 'company-1', 'employee-1', 'EMPLOYEE', 'employee-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('denies employee status update of another employee site visit', async () => {
    const prisma = mockPrisma();
    (prisma.siteVisit.findFirst as jest.Mock).mockResolvedValue({ id: 'visit-1', assignedToEmployeeId: 'other-emp' });
    const service = new SiteVisitsService(prisma as never, mockEmitter() as never, mockTransition);

    await expect(
      service.updateStatus('visit-1', 'COMPLETED' as never, 'company-1', 'employee-1', 'EMPLOYEE', 'employee-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
