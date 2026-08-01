import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationListener } from './notification-listener';
import { TaskSlaListener } from './listeners/task-sla.listener';
import { NotificationRouter } from './router/notification-router';
import { EmailService } from './channels/email.service';
import { PushService } from './channels/push.service';
import { NotificationDeliveryService } from './channels/delivery.service';
import { PrismaModule } from '../../config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationListener,
    TaskSlaListener,
    NotificationRouter,
    EmailService,
    PushService,
    NotificationDeliveryService,
  ],
  exports: [NotificationsService, NotificationDeliveryService],
})
export class NotificationsModule {}
