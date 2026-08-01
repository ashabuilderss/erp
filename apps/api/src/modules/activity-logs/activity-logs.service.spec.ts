import { ActivityLogsService } from './activity-logs.service';

describe('ActivityLogsService', () => {
  let service: ActivityLogsService;
  let mockPrisma: any;

  const mockLog = {
    id: 'log-1',
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: 'user-1',
    description: 'User logged in',
    actorEmail: 'test@example.com',
    actorName: 'Test User',
    performedById: 'user-1',
    companyId: 'company-1',
    createdAt: new Date(),
    employees: {
      users: { firstName: 'Test', lastName: 'User' },
    },
  };

  beforeEach(() => {
    mockPrisma = {
      activityLog: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };
    service = new ActivityLogsService(mockPrisma);
  });

  describe('findAll', () => {
    it('returns paginated results', async () => {
      mockPrisma.activityLog.findMany.mockResolvedValue([mockLog]);
      mockPrisma.activityLog.count.mockResolvedValue(1);

      const result = await service.findAll({}, 'company-1');

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('filters by search term across multiple fields', async () => {
      mockPrisma.activityLog.findMany.mockResolvedValue([mockLog]);
      mockPrisma.activityLog.count.mockResolvedValue(1);

      await service.findAll({ search: 'login' }, 'company-1');

      expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'company-1',
            OR: expect.arrayContaining([
              expect.objectContaining({ action: { contains: 'login', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });

    it('filters by action and entityType', async () => {
      mockPrisma.activityLog.findMany.mockResolvedValue([]);
      mockPrisma.activityLog.count.mockResolvedValue(0);

      await service.findAll({ action: 'login', entityType: 'User' }, 'company-1');

      expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: { contains: 'login', mode: 'insensitive' },
            entityType: 'User',
          }),
        }),
      );
    });
  });

  describe('exportAll', () => {
    it('returns all matching logs without pagination', async () => {
      mockPrisma.activityLog.findMany.mockResolvedValue([mockLog, mockLog]);

      const result = await service.exportAll({}, 'company-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.not.objectContaining({ skip: expect.anything() }),
      );
    });
  });
});
