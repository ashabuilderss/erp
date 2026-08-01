import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { DomainEventTypes } from '../../governance-events/types/events';
import { DomainEvent } from '@prisma/client';

@Injectable()
export class TaskSlaListener {
  private readonly logger = new Logger(TaskSlaListener.name);

  constructor(private notificationsService: NotificationsService) {}

  @OnEvent(DomainEventTypes.TASK_SLA_REMINDER)
  async handleSlaReminder(event: DomainEvent) {
    this.logger.log(`Received SLA reminder for task ${event.entityId}`);
    const payload = event.payload as any;
    
    await this.notificationsService.create({
      userId: payload.assigneeId,
      companyId: event.companyId,
      title: 'Task Deadline Approaching',
      message: `Task SLA deadline is in 30 minutes.`,
      type: 'TASK_SLA_REMINDER',
      link: `/dashboard/my-tasks/${event.entityId}`,
    });
  }

  @OnEvent(DomainEventTypes.TASK_SLA_BREACHED)
  async handleSlaBreached(event: DomainEvent) {
    this.logger.log(`Received SLA breach for task ${event.entityId}`);
    const payload = event.payload as any;
    
    // Notify Assignee
    await this.notificationsService.create({
      userId: payload.assigneeId,
      companyId: event.companyId,
      title: 'Task SLA Breached',
      message: `You missed the time limit for task ${event.entityId}.`,
      type: 'TASK_SLA_BREACHED_ASSIGNEE',
      link: `/dashboard/my-tasks/${event.entityId}`,
    });

    // Notify Creator if they are not the assignee
    if (payload.creatorId !== payload.assigneeId) {
      await this.notificationsService.create({
        userId: payload.creatorId,
        companyId: event.companyId,
        title: 'Task SLA Breached (Assignee)',
        message: `Task ${event.entityId} was not completed within the SLA time limit.`,
        type: 'TASK_SLA_BREACHED_CREATOR',
        link: `/dashboard/my-tasks/${event.entityId}`,
      });
    }
  }
}
