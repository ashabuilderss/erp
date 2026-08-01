import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AnnouncementStatus } from '@prisma/client';
import { AnnouncementService } from './announcement.service';
import { TransitionService } from '../../common/services/transition.service';

describe('AnnouncementService', () => {
  const companyId = 'comp-1';
  const userId = 'usr-1';

  const mockPrisma = () => ({
    announcement: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    employee: { findMany: jest.fn() },
    $transaction: jest.fn(),
  });

  const mockEventPublisher = () => ({
    publish: jest.fn(),
  });

  const mockNotificationsService = () => ({
    create: jest.fn(),
  });

  const mockAuditService = () => ({
    record: jest.fn(),
  });

  const mockTransitionService = {
    validate: jest.fn(),
    canTransition: jest.fn().mockReturnValue(true),
    execute: jest.fn(),
    getRule: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransitionService.validate.mockReset();
    mockTransitionService.validate.mockImplementation(() => {});
  });

  const buildService = (overrides?: {
    prisma?: ReturnType<typeof mockPrisma>;
    eventPublisher?: ReturnType<typeof mockEventPublisher>;
    notificationsService?: ReturnType<typeof mockNotificationsService>;
    auditService?: ReturnType<typeof mockAuditService>;
  }) => {
    const prisma = overrides?.prisma ?? mockPrisma();
    const eventPublisher = overrides?.eventPublisher ?? mockEventPublisher();
    const notificationsService =
      overrides?.notificationsService ?? mockNotificationsService();
    const auditService = overrides?.auditService ?? mockAuditService();
    const service = new AnnouncementService(
      prisma as never,
      eventPublisher as never,
      notificationsService as never,
      auditService,
      mockTransitionService as never,
    );
    return {
      service,
      prisma,
      eventPublisher,
      notificationsService,
      auditService,
    };
  };

  describe('create', () => {
    it('creates an announcement in DRAFT status and publishes event', async () => {
      const { service, prisma, eventPublisher, auditService } = buildService();
      prisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          announcement: {
            create: jest.fn().mockResolvedValue({ id: 'ann-1' }),
          },
        };
        return fn(tx);
      });

      const result = await service.create({
        companyId,
        title: 'Test Announcement',
        body: 'Body text',
        targetRoles: ['EMPLOYEE'],
        targetEmployees: [],
        createdById: userId,
      });

      expect(result).toBe('ann-1');
      expect(eventPublisher.publish).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('throws NotFoundException when announcement not found', async () => {
      const { service, prisma } = buildService();
      prisma.announcement.findFirst.mockResolvedValue(null);

      await expect(
        service.publish({
          companyId,
          announcementId: 'ann-1',
          userId,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when status is not DRAFT', async () => {
      const { service, prisma } = buildService();
      prisma.announcement.findFirst.mockResolvedValue({
        id: 'ann-1',
        companyId,
        status: AnnouncementStatus.PUBLISHED,
      });

      await expect(
        service.publish({
          companyId,
          announcementId: 'ann-1',
          userId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('transitions DRAFT to PUBLISHED and sends notifications', async () => {
      const { service, prisma, eventPublisher, notificationsService } =
        buildService();
      prisma.announcement.findFirst.mockResolvedValueOnce({
        id: 'ann-1',
        companyId,
        status: AnnouncementStatus.DRAFT,
        title: 'Test',
        body: 'Body',
        targetRoles: [],
        targetEmployees: ['emp-1'],
      });
      prisma.employee.findMany.mockResolvedValue([{ userId: 'usr-2' }]);
      const mockTxAnnouncement = { update: jest.fn() };
      prisma.$transaction.mockImplementation(async (fn: Function) =>
        fn({ announcement: mockTxAnnouncement }),
      );

      await service.publish({
        companyId,
        announcementId: 'ann-1',
        userId,
      });

      expect(mockTxAnnouncement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ann-1' },
          data: expect.objectContaining({
            status: AnnouncementStatus.PUBLISHED,
          }),
        }),
      );
      expect(eventPublisher.publish).toHaveBeenCalled();
      expect(notificationsService.create).toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    it('throws NotFoundException when announcement not found', async () => {
      const { service, prisma } = buildService();
      prisma.announcement.findFirst.mockResolvedValue(null);

      await expect(
        service.archive({
          companyId,
          announcementId: 'ann-1',
          userId,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when status is not PUBLISHED', async () => {
      const { service, prisma } = buildService();
      prisma.announcement.findFirst.mockResolvedValue({
        id: 'ann-1',
        companyId,
        status: AnnouncementStatus.DRAFT,
      });

      await expect(
        service.archive({
          companyId,
          announcementId: 'ann-1',
          userId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('transitions PUBLISHED to ARCHIVED', async () => {
      const { service, prisma, eventPublisher } = buildService();
      prisma.announcement.findFirst.mockResolvedValue({
        id: 'ann-1',
        companyId,
        status: AnnouncementStatus.PUBLISHED,
        title: 'Test',
      });
      const mockTxAnnouncement = { update: jest.fn() };
      prisma.$transaction.mockImplementation(async (fn: Function) =>
        fn({ announcement: mockTxAnnouncement }),
      );

      await service.archive({
        companyId,
        announcementId: 'ann-1',
        userId,
      });

      expect(mockTxAnnouncement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: AnnouncementStatus.ARCHIVED,
          }),
        }),
      );
      expect(eventPublisher.publish).toHaveBeenCalled();
    });
  });

  describe('getAnnouncement', () => {
    it('throws NotFoundException when not found', async () => {
      const { service, prisma } = buildService();
      prisma.announcement.findFirst.mockResolvedValue(null);

      await expect(
        service.getAnnouncement('ann-1', companyId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns announcement with includes', async () => {
      const { service, prisma } = buildService();
      const mockAnn = { id: 'ann-1', companyId, title: 'Test' };
      prisma.announcement.findFirst.mockResolvedValue(mockAnn);

      const result = await service.getAnnouncement('ann-1', companyId);
      expect(result).toEqual(mockAnn);
    });
  });

  describe('listAnnouncements', () => {
    it('returns paginated results with meta', async () => {
      const { service, prisma } = buildService();
      prisma.announcement.findMany.mockResolvedValue([]);
      prisma.announcement.count.mockResolvedValue(0);

      const result = await service.listAnnouncements(companyId, {});
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toEqual(expect.objectContaining({ total: 0 }));
    });
  });
});
