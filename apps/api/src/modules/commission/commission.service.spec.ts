import { NotFoundException } from '@nestjs/common';
import { CommissionService } from './commission.service';

describe('CommissionService', () => {
  let service: CommissionService;
  let mockPrisma: any;

  const mockCommission = {
    id: 'comm-1',
    employeeId: 'emp-1',
    companyId: 'company-1',
    amount: 50000,
    status: 'PENDING',
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = {
      employee: { findFirst: jest.fn() },
      pipelineCommission: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new CommissionService(mockPrisma);
  });

  describe('create', () => {
    it('creates commission when employee exists', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 'emp-1' });
      mockPrisma.pipelineCommission.create.mockResolvedValue(mockCommission);

      const result = await service.create(
        { employeeId: 'emp-1', amount: 50000 } as any,
        'company-1',
      );

      expect(result).toEqual(mockCommission);
    });

    it('throws NotFoundException when employee not found', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ employeeId: 'nonexistent' } as any, 'company-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns paginated commissions with status filter', async () => {
      mockPrisma.pipelineCommission.findMany.mockResolvedValue([mockCommission]);
      mockPrisma.pipelineCommission.count.mockResolvedValue(1);

      const result = await service.findAll(
        { status: 'PENDING', page: 1, limit: 20 },
        'company-1',
      );

      expect(result.data).toHaveLength(1);
      expect(mockPrisma.pipelineCommission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns commission when found within company', async () => {
      mockPrisma.pipelineCommission.findFirst.mockResolvedValue(mockCommission);

      const result = await service.findOne('comm-1', 'company-1');

      expect(result).toEqual(mockCommission);
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.pipelineCommission.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('sets paidAt when status is PAID', async () => {
      mockPrisma.pipelineCommission.findFirst.mockResolvedValue(mockCommission);
      mockPrisma.pipelineCommission.update.mockResolvedValue({
        ...mockCommission,
        status: 'PAID',
        paidAt: new Date(),
      });

      const result = await service.updateStatus('comm-1', 'PAID' as any, 'company-1');

      expect(result.status).toBe('PAID');
      expect(result.paidAt).toBeDefined();
      expect(mockPrisma.pipelineCommission.update).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: expect.objectContaining({ status: 'PAID', paidAt: expect.any(Date) }),
      });
    });
  });
});
