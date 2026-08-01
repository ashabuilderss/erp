import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { DomainEvent } from '@prisma/client';

export interface NotificationRule {
  titleTemplate: (payload: any) => string;
  messageTemplate: (payload: any) => string;
  resolveUsers: (payload: any) => string[];
  type: string;
}

@Injectable()
export class NotificationRouter {
  private readonly logger = new Logger(NotificationRouter.name);

  // The explicit Notification Matrix
  private readonly matrix: Record<string, NotificationRule> = {
    WARNING_CREATED: {
      titleTemplate: () => 'New Warning Issued',
      messageTemplate: (p) => `You have been issued a ${p.severity} warning.`,
      resolveUsers: (p) => [p.employeeId], // Notify the employee
      type: 'WARNING',
    },
    PAYROLL_HOLD_ACTIVATED: {
      titleTemplate: () => 'Payroll Hold Activated',
      messageTemplate: (p) =>
        `A payroll hold has been activated for your account. Reason: ${p.reason}`,
      resolveUsers: (p) => [p.employeeId],
      type: 'PAYROLL',
    },
    TASK_OVERDUE_ESCALATED: {
      titleTemplate: () => 'Task Escalated',
      messageTemplate: (p) =>
        `Task ${p.taskId} has been escalated to you due to overdue status.`,
      resolveUsers: (p) => (p.escalatedToUserId ? [p.escalatedToUserId] : []),
      type: 'TASK',
    },
    TASK_CREATED: {
      titleTemplate: () => 'New Task Assigned',
      messageTemplate: (p) => `You have been assigned a new task: ${p.title || p.taskId}.`,
      resolveUsers: (p) => (p.assigneeId ? [p.assigneeId] : []),
      type: 'TASK',
    },
    TASK_OVERDUE: {
      titleTemplate: () => 'Task Overdue',
      messageTemplate: (p) => `Task ${p.taskId} assigned to employee is now overdue.`,
      resolveUsers: (p) => (p.assignedByUserId ? [p.assignedByUserId] : []),
      type: 'TASK',
    },
  };

  constructor(private readonly notificationsService: NotificationsService) {}

  private async routeEvent(eventName: string, event: DomainEvent) {
    const rule = this.matrix[eventName];
    if (!rule) return;

    const payload = event.payload as any;
    if (!payload) return;

    const userIds = rule.resolveUsers(payload);
    for (const userId of userIds) {
      if (!userId) continue;

      await this.notificationsService.create({
        companyId: payload.companyId || '',
        userId: userId,
        title: rule.titleTemplate(payload),
        message: rule.messageTemplate(payload),
        type: rule.type,
      });
    }
  }

  // Explicit Actionable Events
  @OnEvent('WARNING_CREATED')
  async onWarningCreated(event: DomainEvent) {
    await this.routeEvent('WARNING_CREATED', event);
  }

  @OnEvent('PAYROLL_HOLD_ACTIVATED')
  async onPayrollHoldActivated(event: DomainEvent) {
    await this.routeEvent('PAYROLL_HOLD_ACTIVATED', event);
  }

  @OnEvent('TASK_OVERDUE_ESCALATED')
  async onTaskOverdueEscalated(event: DomainEvent) {
    await this.routeEvent('TASK_OVERDUE_ESCALATED', event);
  }

  @OnEvent('TASK_CREATED')
  async onTaskCreated(event: DomainEvent) {
    await this.routeEvent('TASK_CREATED', event);
  }

  @OnEvent('TASK_OVERDUE')
  async onTaskOverdue(event: DomainEvent) {
    await this.routeEvent('TASK_OVERDUE', event);
  }

  // Note: We intentionally do NOT listen to system events like EVENT_REPLAYED, EVENT_DEAD_LETTERED
}
