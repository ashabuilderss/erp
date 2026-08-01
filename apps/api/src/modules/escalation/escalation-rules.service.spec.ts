import { NotFoundException } from '@nestjs/common';
import { EscalationRulesService } from './escalation-rules.service';

describe('EscalationRulesService', () => {
  let service: EscalationRulesService;
  let mockPrisma: any;

  const mockRule = {
    id: 'rule-1',
    companyId: 'company-1',
    name: 'Late Attendance',
    triggerType: 'ATTENDANCE_MISSED',
    config: { threshold: 3 },
    level: 1,
    notifyRoles: ['HR_MANAGER'],
    isActive: true,
    deletedAt: null,
  };

  beforeEach(() => {
    mockPrisma = {
      escalationRule: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new EscalationRulesService(mockPrisma);
  });

  describe('findAll', () => {
    it('returns rules ordered by level', async () => {
      mockPrisma.escalationRule.findMany.mockResolvedValue([mockRule]);

      const result = await service.findAll('company-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.escalationRule.findMany).toHaveBeenCalledWith({
        where: { companyId: 'company-1' },
        orderBy: { level: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('creates rule with defaults', async () => {
      mockPrisma.escalationRule.create.mockResolvedValue(mockRule);

      const result = await service.create(
        { name: 'Late Attendance', triggerType: 'ATTENDANCE_MISSED', level: 1 } as any,
        'company-1',
      );

      expect(result).toEqual(mockRule);
    });
  });

  describe('update', () => {
    it('updates rule when found', async () => {
      mockPrisma.escalationRule.findFirst.mockResolvedValue(mockRule);
      mockPrisma.escalationRule.update.mockResolvedValue({ ...mockRule, name: 'Updated' });

      const result = await service.update('rule-1', { name: 'Updated' } as any, 'company-1');

      expect(result.name).toBe('Updated');
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.escalationRule.findFirst.mockResolvedValue(null);

      await expect(service.update('nonexistent', {} as any, 'company-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('soft-deletes rule by setting deletedAt', async () => {
      mockPrisma.escalationRule.findFirst.mockResolvedValue(mockRule);
      mockPrisma.escalationRule.update.mockResolvedValue({ ...mockRule, deletedAt: new Date() });

      await service.remove('rule-1', 'company-1');

      expect(mockPrisma.escalationRule.update).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
