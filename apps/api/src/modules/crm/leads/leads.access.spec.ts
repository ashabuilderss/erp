import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LeadsService } from './leads.service';

describe('LeadsService employee access', () => {
  const mockPrisma = () => ({ lead: { findFirst: jest.fn() }, employee: { findFirst: jest.fn() } });
  const mockEmitter = () => ({ emit: jest.fn() });
  const mockTransition = { execute: jest.fn().mockRejectedValue(new BadRequestException('Employees can only update their own leads')), validate: jest.fn() } as never;

  it('scopes detail lookup to the assigned employee', async () => {
    const prisma = { lead: { findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new LeadsService(prisma as never, { emit: jest.fn() } as never, mockTransition);

    await expect(service.findOne('lead-1', 'company-1', 'employee-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lead.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'lead-1', companyId: 'company-1', assignedToEmployeeId: 'employee-1' },
    }));
  });

  it('denies employee create with non-self assignment', async () => {
    const prisma = mockPrisma();
    (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'other' });
    const service = new LeadsService(prisma as never, mockEmitter() as never, mockTransition);

    await expect(
      service.create(
        { customerName: 'Test', source: 'WEBSITE', assignedToEmployeeId: 'other' } as never,
        'company-1', 'EMPLOYEE', 'employee-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('denies employee update of unassigned lead', async () => {
    const prisma = mockPrisma();
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue(null);
    const service = new LeadsService(prisma as never, mockEmitter() as never, mockTransition);

    await expect(
      service.update('lead-1', {} as never, 'company-1', 'employee-1', 'EMPLOYEE', 'employee-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('denies employee status update of another employee lead', async () => {
    const prisma = mockPrisma();
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue({ id: 'lead-1', assignedToEmployeeId: 'other-emp' });
    const service = new LeadsService(prisma as never, mockEmitter() as never, mockTransition);

    await expect(
      service.updateStatus('lead-1', 'CONTACTED' as never, 'company-1', 'employee-1', 'EMPLOYEE', 'employee-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
