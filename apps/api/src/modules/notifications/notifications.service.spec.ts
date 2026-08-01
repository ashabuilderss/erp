import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationDeliveryService } from './channels/delivery.service';
import { RealtimeGateway } from '../../common/realtime/realtime.gateway';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockPrisma: any;
  let mockEmitter: EventEmitter2;
  let mockDeliveryService: NotificationDeliveryService;
  let mockRealtimeGateway: RealtimeGateway;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    companyId: 'company-1',
    title: 'Test Notification',
    message: 'This is a test',
    type: 'INFO',
    read: false,
    link: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockEmitter = { emit: jest.fn() } as never;
    mockDeliveryService = { deliver: jest.fn().mockResolvedValue(undefined) } as never;
    mockRealtimeGateway = { broadcastToUser: jest.fn() } as never;
    mockPrisma = {
      user: { findUnique: jest.fn() },
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    service = new NotificationsService(
      mockPrisma,
      mockEmitter,
      mockDeliveryService,
      mockRealtimeGateway,
    );
  });

  describe('create', () => {
    it('creates notification when user preferences allow it', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        notificationPreferences: { lead_assigned: true },
      });
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create({
        userId: 'user-1',
        companyId: 'company-1',
        title: 'Test Notification',
        message: 'This is a test',
        type: 'INFO',
      });

      expect(result).toEqual(mockNotification);
      expect(mockEmitter.emit).toHaveBeenCalled();
    });

    it('returns null when user has disabled this notification type', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        notificationPreferences: { lead_assigned: false },
      });

      const result = await service.create({
        userId: 'user-1',
        companyId: 'company-1',
        title: 'Lead Assigned',
        message: 'Lead assigned',
        type: 'LEAD_ASSIGNED',
      });

      expect(result).toBeNull();
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it('creates notification even when user has no preferences', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ notificationPreferences: null });
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create({
        userId: 'user-1',
        companyId: 'company-1',
        title: 'Test',
        message: 'Test',
        type: 'LEAD_ASSIGNED',
      });

      expect(result).toEqual(mockNotification);
    });
  });

  describe('findAll', () => {
    it('returns paginated notifications scoped to userId', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([mockNotification]);
      mockPrisma.notification.count.mockResolvedValue(1);

      const result = await service.findAll({}, 'user-1');

      expect(result.data).toHaveLength(1);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('returns count of unread notifications', async () => {
      mockPrisma.notification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(3);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
      });
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(mockNotification);
      mockPrisma.notification.update.mockResolvedValue({ ...mockNotification, read: true });

      const result = await service.markAsRead('notif-1', 'user-1');

      expect(result.read).toBe(true);
    });

    it('throws NotFoundException when notification not found', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('marks all unread as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('user-1');

      expect(result).toEqual({ success: true });
    });
  });

  describe('pushToUser', () => {
    it('broadcasts to user via realtime gateway', () => {
      service.pushToUser('user-1', { text: 'hello' });

      expect(mockRealtimeGateway.broadcastToUser).toHaveBeenCalledWith(
        'user-1',
        'notification',
        { text: 'hello' },
      );
    });
  });
});
