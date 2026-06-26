import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  const mockPrisma = () => ({
    lead: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    employee: { findFirst: jest.fn() },
    property: { findFirst: jest.fn(), update: jest.fn() },
    customer: { findFirst: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  });

  const mockEventEmitter = () => ({ emit: jest.fn() });
  const mockTransition = () => ({ execute: jest.fn() });

  describe('create', () => {
    it('throws BadRequestException when employee creates lead for another employee', async () => {
      const prisma = mockPrisma();
      prisma.employee.findFirst.mockResolvedValue({ id: 'emp-other' });
      const service = new LeadsService(prisma as never, mockEventEmitter() as never, mockTransition() as never);

      await expect(
        service.create({ assignedToEmployeeId: 'emp-other', customerName: 'Test' } as never, 'c1', 'EMPLOYEE', 'emp-self'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('succeeds when employee creates lead for self', async () => {
      const prisma = mockPrisma();
      prisma.employee.findFirst.mockResolvedValue({ id: 'emp-self' });
      prisma.lead.create.mockResolvedValue({ id: 'lead-1', customerName: 'Test' });
      const eventEmitter = mockEventEmitter();
      const service = new LeadsService(prisma as never, eventEmitter as never, mockTransition() as never);

      const result = await service.create({ assignedToEmployeeId: 'emp-self', customerName: 'Test' } as never, 'c1', 'EMPLOYEE', 'emp-self');

      expect(result).toHaveProperty('id', 'lead-1');
      expect(eventEmitter.emit).toHaveBeenCalledWith('lead.created', expect.objectContaining({ companyId: 'c1' }));
    });

    it('succeeds when admin creates lead with any assignedToEmployeeId', async () => {
      const prisma = mockPrisma();
      prisma.employee.findFirst.mockResolvedValue({ id: 'emp-1' });
      prisma.lead.create.mockResolvedValue({ id: 'lead-1' });
      const service = new LeadsService(prisma as never, mockEventEmitter() as never, mockTransition() as never);

      const result = await service.create({ assignedToEmployeeId: 'emp-1', customerName: 'Test' } as never, 'c1', 'ADMIN', undefined);

      expect(result).toHaveProperty('id', 'lead-1');
    });

    it('throws BadRequestException for invalid propertyId', async () => {
      const prisma = mockPrisma();
      prisma.employee.findFirst.mockResolvedValue(null);
      prisma.property.findFirst.mockResolvedValue(null);
      const service = new LeadsService(prisma as never, mockEventEmitter() as never, mockTransition() as never);

      await expect(
        service.create({ propertyId: 'prop-invalid', customerName: 'Test' } as never, 'c1', 'ADMIN', undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException for invalid customerId', async () => {
      const prisma = mockPrisma();
      prisma.property.findFirst.mockResolvedValue({ id: 'prop-1' });
      prisma.customer.findFirst.mockResolvedValue(null);
      const service = new LeadsService(prisma as never, mockEventEmitter() as never, mockTransition() as never);

      await expect(
        service.create({ customerId: 'cust-invalid', propertyId: 'prop-1', customerName: 'Test' } as never, 'c1', 'ADMIN', undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('emits lead.created event', async () => {
      const prisma = mockPrisma();
      prisma.lead.create.mockResolvedValue({ id: 'lead-1' });
      const eventEmitter = mockEventEmitter();
      const service = new LeadsService(prisma as never, eventEmitter as never, mockTransition() as never);

      await service.create({ customerName: 'Test' } as never, 'c1', 'ADMIN', undefined);

      expect(eventEmitter.emit).toHaveBeenCalledWith('lead.created', { companyId: 'c1', entityId: 'lead-1' });
    });
  });

  describe('updateStatus', () => {
    it('delegates to transitionService.execute with correct params', async () => {
      const transition = mockTransition();
      transition.execute.mockResolvedValue({ id: 'lead-1', status: 'CONTACTED' });
      const eventEmitter = mockEventEmitter();
      const service = new LeadsService(mockPrisma() as never, eventEmitter as never, transition as never);

      const result = await service.updateStatus('lead-1', 'CONTACTED' as never, 'c1', 'emp-1', 'EMPLOYEE', 'emp-1');

      expect(transition.execute).toHaveBeenCalledWith(expect.objectContaining({
        entityType: 'Lead',
        id: 'lead-1',
        newStatus: 'CONTACTED',
        companyId: 'c1',
      }));
      expect(result).toHaveProperty('id', 'lead-1');
    });

    it('emits lead.updated event', async () => {
      const transition = mockTransition();
      transition.execute.mockResolvedValue({ id: 'lead-1' });
      const eventEmitter = mockEventEmitter();
      const service = new LeadsService(mockPrisma() as never, eventEmitter as never, transition as never);

      await service.updateStatus('lead-1', 'CONTACTED' as never, 'c1', 'emp-1', 'EMPLOYEE', 'emp-1');

      expect(eventEmitter.emit).toHaveBeenCalledWith('lead.updated', { companyId: 'c1', entityId: 'lead-1' });
    });
  });

  describe('convertToCustomer', () => {
    it('throws BadRequestException when lead is already converted', async () => {
      const prisma = mockPrisma();
      prisma.lead.findFirst.mockResolvedValue({
        id: 'lead-1',
        status: 'CONVERTED',
        convertedToCustomerId: 'cust-1',
        companyId: 'c1',
      });
      const service = new LeadsService(prisma as never, mockEventEmitter() as never, mockTransition() as never);

      await expect(service.convertToCustomer('lead-1', 'c1', 'emp-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates customer, updates lead status, updates property status', async () => {
      const prisma = mockPrisma();
      prisma.lead.findFirst.mockResolvedValue({
        id: 'lead-1',
        status: 'NEW',
        convertedToCustomerId: null,
        companyId: 'c1',
        propertyId: 'prop-1',
        customerName: 'John',
        customerEmail: 'john@test.com',
        customerPhone: '123',
        source: 'WEBSITE',
        notes: '',
        assignedToEmployeeId: 'emp-1',
        assignedTo: { user: { id: 'user-1' } },
      });
      const eventEmitter = mockEventEmitter();
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          customer: { create: jest.fn().mockResolvedValue({ id: 'cust-1', name: 'John' }) },
          property: { update: jest.fn() },
          lead: {
            update: jest.fn().mockResolvedValue({
              id: 'lead-1',
              status: 'CONVERTED',
              convertedToCustomerId: 'cust-1',
              assignedTo: { user: { id: 'user-1' } },
            }),
          },
        };
        return fn(tx);
      });
      const service = new LeadsService(prisma as never, eventEmitter as never, mockTransition() as never);

      const result = await service.convertToCustomer('lead-1', 'c1', 'emp-1');

      expect(result).toHaveProperty('lead');
      expect(result).toHaveProperty('customer');
      expect(eventEmitter.emit).toHaveBeenCalledWith('lead.updated', { companyId: 'c1', entityId: 'lead-1' });
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when lead not found', async () => {
      const prisma = mockPrisma();
      prisma.lead.findFirst.mockResolvedValue(null);
      const service = new LeadsService(prisma as never, mockEventEmitter() as never, mockTransition() as never);

      await expect(service.remove('lead-1', 'c1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes lead and emits lead.deleted', async () => {
      const prisma = mockPrisma();
      prisma.lead.findFirst.mockResolvedValue({ id: 'lead-1', companyId: 'c1' });
      prisma.lead.delete.mockResolvedValue({});
      const eventEmitter = mockEventEmitter();
      const service = new LeadsService(prisma as never, eventEmitter as never, mockTransition() as never);

      await service.remove('lead-1', 'c1');

      expect(prisma.lead.delete).toHaveBeenCalledWith({ where: { id: 'lead-1' } });
      expect(eventEmitter.emit).toHaveBeenCalledWith('lead.deleted', { companyId: 'c1', entityId: 'lead-1' });
    });
  });
});
