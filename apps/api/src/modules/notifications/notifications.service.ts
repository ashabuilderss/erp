import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../config/prisma.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationEvents } from './events/notification-events';
import { Prisma } from '@prisma/client';
import { safeSortBy } from '../../common/utils/sort-by';
import { Subject } from 'rxjs';

const ALLOWED_SORT = [
  'createdAt',
  'updatedAt',
  'title',
  'type',
  'read',
] as const;

@Injectable()
export class NotificationsService {
  private sseSubjects = new Map<string, Subject<unknown>>();

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  private typeToPrefKey: Record<string, string> = {
    LEAD_ASSIGNED: 'lead_assigned',
    LEAD_CONVERTED: 'lead_converted',
    LEAVE_REQUESTED: 'leave_requested',
    LEAVE_APPROVED: 'leave_approved',
    LEAVE_REJECTED: 'leave_rejected',
    SITE_VISIT_SCHEDULED: 'site_visit_scheduled',
    BOOKING_CONFIRMED: 'booking_confirmed',
    EMPLOYEE_INVITED: 'employee_invited',
  };

  async create(dto: CreateNotificationDto) {
    const type = dto.type ?? 'INFO';
    const prefKey = this.typeToPrefKey[type];

    if (prefKey) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
        select: { notificationPreferences: true },
      });

      const prefs = user?.notificationPreferences as Record<
        string,
        boolean
      > | null;
      if (prefs && prefs[prefKey] === false) return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        companyId: dto.companyId,
        title: dto.title,
        message: dto.message,
        type,
        link: dto.link,
      },
    });

    this.eventEmitter.emit(
      NotificationEvents.NotificationCreated,
      notification,
    );
    return notification;
  }

  async findAll(query: QueryNotificationDto, userId: string) {
    const {
      page = 1,
      limit = 20,
      read,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.NotificationWhereInput = { userId };

    if (read !== undefined) where.read = read === 'true';
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification)
      throw new NotFoundException(`Notification with ID ${id} not found`);

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { success: true };
  }

  subscribe(userId: string): Subject<unknown> {
    if (!this.sseSubjects.has(userId)) {
      this.sseSubjects.set(userId, new Subject<unknown>());
    }
    return this.sseSubjects.get(userId)!;
  }

  pushToUser(userId: string, data: unknown) {
    if (this.sseSubjects.has(userId)) {
      this.sseSubjects.get(userId)!.next(data);
    }
  }
}
