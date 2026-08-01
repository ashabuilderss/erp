import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, AnnouncementStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../governance-events/types/events';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

export interface CreateAnnouncementInput {
  companyId: string;
  title: string;
  body: string;
  priority?: string;
  targetRoles: string[];
  targetEmployees: string[];
  expiresAt?: Date;
  createdById: string;
}

export interface PublishAnnouncementInput {
  companyId: string;
  announcementId: string;
  userId: string;
}

export interface ArchiveAnnouncementInput {
  companyId: string;
  announcementId: string;
  userId: string;
}

@Injectable()
export class AnnouncementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: GovernanceEventPublisher,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
    private readonly transitionService: TransitionService,
  ) {}

  async create(input: CreateAnnouncementInput): Promise<string> {
    const {
      companyId,
      title,
      body,
      priority,
      targetRoles,
      targetEmployees,
      expiresAt,
      createdById,
    } = input;

    const announcementId = await this.prisma.$transaction(async (tx) => {
      const announcement = await tx.announcement.create({
        data: {
          companyId,
          title,
          body,
          priority: priority ?? 'NORMAL',
          targetRoles: targetRoles,
          targetEmployees: targetEmployees,
          status: AnnouncementStatus.DRAFT,
          expiresAt: expiresAt ?? null,
          createdById,
        },
      });

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.ANNOUNCEMENT_CREATED,
        entityId: announcement.id,
        entityType: 'Announcement',
        companyId,
        payload: {
          companyId,
          title,
          body,
          priority: priority ?? 'NORMAL',
          targetRoles,
          targetEmployees,
          createdById,
        },
      });

      await this.auditService.record({
        tx,
        companyId,
        entityType: 'Announcement',
        entityId: announcement.id,
        action: 'CREATED',
        userId: createdById,
        newState: { title, body, status: 'DRAFT' },
      });

      return announcement.id;
    });

    return announcementId;
  }

  async publish(input: PublishAnnouncementInput): Promise<void> {
    const { companyId, announcementId, userId } = input;

    const announcement = await this.prisma.announcement.findFirst({
      where: { id: announcementId, companyId },
    });
    if (!announcement) {
      throw new NotFoundException(
        `Announcement with ID ${announcementId} not found`,
      );
    }
    if (announcement.status !== AnnouncementStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft announcements can be published',
      );
    }

    this.transitionService.validate('Announcement', announcement.status, 'PUBLISHED');

    await this.prisma.$transaction(async (tx) => {
      await tx.announcement.update({
        where: { id: announcementId },
        data: {
          status: AnnouncementStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.ANNOUNCEMENT_PUBLISHED,
        entityId: announcementId,
        entityType: 'Announcement',
        companyId,
        payload: {
          companyId,
          title: announcement.title,
          targetRoles: announcement.targetRoles,
          targetEmployees: announcement.targetEmployees,
          publishedById: userId,
        },
      });

      await this.auditService.record({
        tx,
        companyId,
        entityType: 'Announcement',
        entityId: announcementId,
        action: 'PUBLISHED',
        userId,
        previousState: { status: 'DRAFT' },
        newState: { status: 'PUBLISHED' },
      });
    });

    await this.sendPublishNotifications(announcement);
  }

  async archive(input: ArchiveAnnouncementInput): Promise<void> {
    const { companyId, announcementId, userId } = input;

    const announcement = await this.prisma.announcement.findFirst({
      where: { id: announcementId, companyId },
    });
    if (!announcement) {
      throw new NotFoundException(
        `Announcement with ID ${announcementId} not found`,
      );
    }
    if (announcement.status !== AnnouncementStatus.PUBLISHED) {
      throw new BadRequestException(
        'Only published announcements can be archived',
      );
    }

    this.transitionService.validate('Announcement', announcement.status, 'ARCHIVED');

    await this.prisma.$transaction(async (tx) => {
      await tx.announcement.update({
        where: { id: announcementId },
        data: { status: AnnouncementStatus.ARCHIVED },
      });

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.ANNOUNCEMENT_ARCHIVED,
        entityId: announcementId,
        entityType: 'Announcement',
        companyId,
        payload: {
          companyId,
          title: announcement.title,
          archivedById: userId,
        },
      });

      await this.auditService.record({
        tx,
        companyId,
        entityType: 'Announcement',
        entityId: announcementId,
        action: 'ARCHIVED',
        userId,
        previousState: { status: 'PUBLISHED' },
        newState: { status: 'ARCHIVED' },
      });
    });
  }

  async getAnnouncement(id: string, companyId: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, companyId },
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        receipts: {
          include: {
            users: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }
    return announcement;
  }

  async listAnnouncements(
    companyId: string,
    options: { page?: number; limit?: number; status?: AnnouncementStatus },
  ) {
    const { page = 1, limit = 10, status } = options;
    const where: Prisma.AnnouncementWhereInput = { companyId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          users: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { receipts: true } },
        },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPublishedForEmployee(companyId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { users: { select: { role: true } } },
    });
    if (!employee) return [];

    const userRole = employee.users?.role ?? 'EMPLOYEE';

    const announcements = await this.prisma.announcement.findMany({
      where: {
        companyId,
        status: AnnouncementStatus.PUBLISHED,
        OR: [
          { targetRoles: { array_contains: userRole } },
          { targetEmployees: { array_contains: employeeId } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        users: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return announcements;
  }

  private async sendPublishNotifications(announcement: any) {
    const targetEmployeeIds = announcement.targetEmployees as string[];
    const targetRoles = announcement.targetRoles as string[];

    let employeeIds = targetEmployeeIds;

    if (targetRoles.length > 0 && employeeIds.length === 0) {
      const employees = await this.prisma.employee.findMany({
        where: {
          companyId: announcement.companyId,
          status: 'ACTIVE',
          users: { role: { in: targetRoles as UserRole[] } },
        },
        select: { id: true, userId: true },
      });
      employeeIds = employees.map((e) => e.id);
    }

    const employeesWithUsers = await this.prisma.employee.findMany({
      where: { id: { in: employeeIds }, companyId: announcement.companyId },
      select: { userId: true },
    });

    for (const emp of employeesWithUsers) {
      if (emp.userId) {
        await this.notificationsService.create({
          userId: emp.userId,
          companyId: announcement.companyId,
          title: announcement.title,
          message: announcement.body.substring(0, 200),
          type: 'ANNOUNCEMENT',
          link: `/dashboard/announcements/${announcement.id}`,
        });
      }
    }
  }
}
