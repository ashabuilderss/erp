import { NotFoundException } from '@nestjs/common';
import { EscalationEventsService } from './escalation-events.service';

describe('EscalationEventsService', () => {
  let service: EscalationEventsService;
  let mockPrisma: any;

  const mockEvent = {
    id: 'evt-1',
    companyId: 'company-1',
    status: 'TRIGGERED',
    triggeredAt: new Date(),
    escalationRules: { name: 'Late Attendance', triggerType: 'ATTENDANCE_MISSED', level: 1 },
  };

  beforeEach(() => {
    mockPrisma = {
      escalationEvent: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new EscalationEventsService(mockPrisma);
  });

  describe('findAll', () => {
    it('returns events with optional status filter', async () => {
      mockPrisma.escalationEvent.findMany.mockResolvedValue([mockEvent]);

      const result = await service.findAll('company-1', 'TRIGGERED');

      expect(result).toHaveLength(1);
      expect(mockPrisma.escalationEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: 'company-1', status: 'TRIGGERED' },
        }),
      );
    });

    it('returns all events when no status filter', async () => {
      mockPrisma.escalationEvent.findMany.mockResolvedValue([mockEvent]);

      const result = await service.findAll('company-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.escalationEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: 'company-1' },
        }),
      );
    });
  });

  describe('resolve', () => {
    it('marks event as RESOLVED with timestamp', async () => {
      mockPrisma.escalationEvent.findFirst.mockResolvedValue(mockEvent);
      mockPrisma.escalationEvent.update.mockResolvedValue({
        ...mockEvent,
        status: 'RESOLVED',
        resolvedAt: new Date(),
      });

      const result = await service.resolve('evt-1', 'company-1');

      expect(result.status).toBe('RESOLVED');
      expect(mockPrisma.escalationEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: { status: 'RESOLVED', resolvedAt: expect.any(Date) },
      });
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.escalationEvent.findFirst.mockResolvedValue(null);

      await expect(service.resolve('nonexistent', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
