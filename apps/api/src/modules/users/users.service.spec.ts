import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let mockPrisma: any;
  let mockEmitter: EventEmitter2;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'EMPLOYEE',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    notificationPreferences: {},
    employees: [{ id: 'emp-1', employeeCode: 'EMP-001', departments: { name: 'Operations' } }],
  };

  beforeEach(() => {
    mockEmitter = { emit: jest.fn() } as never;
    mockPrisma = {
      user: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    service = new UsersService(mockPrisma, mockEmitter);
  });

  describe('findAll', () => {
    it('returns paginated users with search filter', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.findAll(
        { search: 'test', page: 1, limit: 10 },
        'company-1',
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'company-1',
            OR: expect.arrayContaining([
              expect.objectContaining({ firstName: { contains: 'test', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });

    it('filters by role when provided', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.findAll({ role: 'OWNER' }, 'company-1');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'OWNER' }),
        }),
      );
    });

    it('excludes sensitive fields from results', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.findAll({}, 'company-1');

      expect(result.data[0]).not.toHaveProperty('hashedPassword');
      expect(result.data[0]).not.toHaveProperty('refreshToken');
    });
  });

  describe('findOne', () => {
    it('returns user when found within company', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findOne('user-1', 'company-1');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-1', companyId: 'company-1' },
        include: expect.any(Object),
      });
    });

    it('throws NotFoundException when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates user and emits event', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await service.update('user-1', { role: 'ADMIN' as never }, 'company-1');

      expect(result).toEqual(mockUser);
      expect(mockEmitter.emit).toHaveBeenCalledWith('user.updated', {
        companyId: 'company-1',
        entityId: 'user-1',
      });
    });
  });

  describe('remove', () => {
    it('deactivates user instead of hard-deleting', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

      const result = await service.remove('user-1', 'company-1');

      expect(result.isActive).toBe(false);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isActive: false },
      });
    });
  });

  describe('updatePreferences', () => {
    it('merges new preferences with existing ones', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        notificationPreferences: { email: true, sms: false },
      });
      mockPrisma.user.update.mockImplementation((args: any) => {
        return { notificationPreferences: args.data.notificationPreferences };
      });

      const result = await service.updatePreferences('user-1', { lead_assigned: true });

      expect(result.notificationPreferences).toMatchObject({
        email: true,
        sms: false,
        lead_assigned: true,
      });
    });

    it('handles null existing preferences', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ notificationPreferences: null });
      mockPrisma.user.update.mockImplementation((args: any) => {
        return { notificationPreferences: args.data.notificationPreferences };
      });

      const result = await service.updatePreferences('user-1', { lead_assigned: true });

      expect(result.notificationPreferences).toEqual({ lead_assigned: true });
    });
  });
});
