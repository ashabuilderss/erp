import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { EmailService } from './email.service';
import { PushService } from './push.service';

@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private pushService: PushService,
    private eventEmitter: EventEmitter2,
  ) {}

  async deliver(payload: {
    userId: string;
    companyId: string;
    title: string;
    message: string;
    type: string;
    link?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        email: true,
        notificationPreferences: true,
      },
    });
    if (!user) return;

    const prefs = (user.notificationPreferences as Record<string, boolean>) ?? {};

    const prefKey = this.typeToPrefKey(payload.type);
    if (prefKey && prefs[prefKey] === false) {
      this.logger.log(`Notification suppressed by user pref: ${payload.type}`);
      return;
    }

    if (prefKey && prefs[`${prefKey}_email`] !== false) {
      this.emailService.send({
        to: user.email,
        subject: payload.title,
        html: `<p>${payload.message}</p>${payload.link ? `<p><a href="${payload.link}">View details</a></p>` : ''}`,
      });
    }

    if (prefKey && prefs[`${prefKey}_push`] !== false) {
      const deviceRegistrations = await this.prisma.deviceRegistration.findMany({
        where: { employee: { user: { id: payload.userId } } },
        select: { id: true, fcmToken: true },
      });
      for (const device of deviceRegistrations) {
        if (device.fcmToken) {
          const data: Record<string, string> = { type: payload.type };
          if (payload.link) data.link = payload.link;
          this.pushService.send({
            token: device.fcmToken,
            title: payload.title,
            body: payload.message,
            data,
          });
        }
      }
    }

    this.eventEmitter.emit('notification.created', payload);
  }

  private typeToPrefKey(type: string): string | undefined {
    const map: Record<string, string> = {
      LEAD_ASSIGNED: 'lead_assigned',
      LEAD_CONVERTED: 'lead_converted',
      LEAVE_REQUESTED: 'leave_requested',
      LEAVE_APPROVED: 'leave_approved',
      LEAVE_REJECTED: 'leave_rejected',
      SITE_VISIT_SCHEDULED: 'site_visit_scheduled',
      BOOKING_CONFIRMED: 'booking_confirmed',
      EMPLOYEE_INVITED: 'employee_invited',
    };
    return map[type];
  }
}
