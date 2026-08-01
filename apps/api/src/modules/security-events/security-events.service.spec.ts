import { SecurityEventsService } from './security-events.service';

describe('SecurityEventsService', () => {
  let service: SecurityEventsService;
  let mockPrisma: any;

  const mockEvent = {
    id: 'evt-1',
    companyId: 'company-1',
    eventType: 'LOGIN_SUCCESS',
    severity: 'INFO',
    description: 'Successful login',
    userId: 'user-1',
    metadata: { email: 'test@example.com' },
    ipAddress: '192.168.1.1',
    createdAt: new Date(),
  };

  const mockRefreshToken = {
    id: 'token-1',
    companyId: 'company-1',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    revokedAt: null,
    users: { email: 'test@example.com' },
  };

  beforeEach(() => {
    mockPrisma = {
      securityEvent: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      refreshToken: { findMany: jest.fn() },
    };
    service = new SecurityEventsService(mockPrisma);
  });

  describe('create', () => {
    it('creates a security event with all fields', async () => {
      mockPrisma.securityEvent.create.mockResolvedValue(mockEvent);

      const result = await service.create({
        companyId: 'company-1',
        eventType: 'LOGIN_SUCCESS',
        severity: 'INFO',
        description: 'Successful login',
        userId: 'user-1',
        metadata: { email: 'test@example.com' },
        ipAddress: '192.168.1.1',
      });

      expect(result).toEqual(mockEvent);
    });
  });

  describe('findAll', () => {
    it('filters by eventType and severity', async () => {
      mockPrisma.securityEvent.findMany.mockResolvedValue([]);
      mockPrisma.securityEvent.count.mockResolvedValue(0);

      await service.findAll({ eventType: 'LOGIN_FAILURE', severity: 'WARNING' }, 'company-1');

      expect(mockPrisma.securityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventType: 'LOGIN_FAILURE',
            severity: 'WARNING',
          }),
        }),
      );
    });
  });

  describe('findLoginHistory', () => {
    it('returns formatted login events', async () => {
      mockPrisma.securityEvent.findMany.mockResolvedValue([mockEvent]);

      const result = await service.findLoginHistory('company-1');

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        email: 'test@example.com',
        status: 'success',
        reason: 'Successful login',
      });
      expect(result.data[0].createdAt).toEqual(expect.any(String));
    });
  });

  describe('findSessions', () => {
    it('returns active non-revoked tokens', async () => {
      mockPrisma.refreshToken.findMany.mockResolvedValue([mockRefreshToken]);

      const result = await service.findSessions('company-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'token-1',
        email: 'test@example.com',
      });
      expect(result[0].createdAt).toEqual(expect.any(String));
    });
  });
});
