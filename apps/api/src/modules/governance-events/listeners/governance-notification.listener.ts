import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { DomainEventTypes } from '../types/events';
import { PrismaService } from '../../../config/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

/**
 * §15.1 Notification gate.
 *
 * Surfaces domain-event-only events (not on the `NotificationEvents` channel
 * that `NotificationListener` subscribes to) as in-app notifications.
 *
 * SAFETY: every handler routes through `GovernanceEventProcessor.process`, which
 * is idempotent via the `processedEvent` table, so outbox re-dispatch or retries
 * never create duplicate notifications. No new events are published and no
 * projectors are touched, so dashboard KPIs are unaffected.
 */
@Injectable()
export class GovernanceNotificationListener {
  private readonly logger = new Logger(GovernanceNotificationListener.name);

  constructor(
    private readonly processor: GovernanceEventProcessor,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(DomainEventTypes.TASK_COMPLETED)
  async handleTaskCompleted(event: DomainEvent) {
    await this.processor.process(
      event,
      'GovernanceNotificationListener_handleTaskCompleted',
      async () => {
        const taskId = event.entityId;
        const companyId =
          (event.payload as { companyId?: string })?.companyId ?? '';
        const task = await this.prisma.task.findUnique({
          where: { id: taskId },
          select: { title: true, creatorId: true },
        });
        if (!task) return;

        // Task.creatorId is an Employee id -> resolve to a User.
        const creatorEmployee = await this.prisma.employee.findUnique({
          where: { id: task.creatorId },
          select: { userId: true },
        });
        const creatorUserId = creatorEmployee?.userId;
        if (!creatorUserId) return;

        await this.notificationsService.create({
          companyId,
          userId: creatorUserId,
          title: 'Task completed',
          message: `Task "${task.title}" has been marked as completed.`,
          type: 'TASK',
          link: `/dashboard/my-tasks/${taskId}`,
        });
      },
    );
  }

  @OnEvent(DomainEventTypes.TASK_COMPLETION_ACKNOWLEDGED)
  async handleTaskCompletionAcknowledged(event: DomainEvent) {
    await this.processor.process(
      event,
      'GovernanceNotificationListener_handleTaskCompletionAcknowledged',
      async () => {
        const taskId = event.entityId;
        const companyId =
          (event.payload as { companyId?: string })?.companyId ?? '';
        const task = await this.prisma.task.findUnique({
          where: { id: taskId },
          select: { title: true },
        });
        if (!task) return;

        // Notify every OWNER user in the company: the distinct "Approve
        // completion" step (§7.10) is now actionable.
        const owners = await this.prisma.user.findMany({
          where: { companyId, role: 'OWNER', deletedAt: null },
          select: { id: true },
        });

        for (const owner of owners) {
          await this.notificationsService.create({
            companyId,
            userId: owner.id,
            title: 'Approve completion',
            message: `Task "${task.title}" has been acknowledged by a manager. Please approve completion.`,
            type: 'TASK',
            link: `/dashboard/my-tasks/${taskId}`,
          });
        }
      },
    );
  }

  @OnEvent(DomainEventTypes.APPROVAL_APPROVED)
  async handleApprovalApproved(event: DomainEvent) {
    await this.onApprovalOutcome(event, 'approved', 'APPROVAL_APPROVED');
  }

  @OnEvent(DomainEventTypes.APPROVAL_REJECTED)
  async handleApprovalRejected(event: DomainEvent) {
    await this.onApprovalOutcome(event, 'rejected', 'APPROVAL_REJECTED');
  }

  private async onApprovalOutcome(
    event: DomainEvent,
    outcome: 'approved' | 'rejected',
    handlerName: string,
  ) {
    await this.processor.process(
      event,
      `GovernanceNotificationListener_${handlerName}`,
      async () => {
        const companyId =
          (event.payload as { companyId?: string })?.companyId ?? '';
        const entityType = event.entityType ?? '';
        // entityType/entityId identify the business entity the approval request
        // was created for; createdById is the user who originated the request.
        const approvalRequest = await this.prisma.approvalRequest.findFirst({
          where: {
            companyId,
            entityType,
            entityId: event.entityId,
          },
          select: { createdById: true },
        });
        if (!approvalRequest) return;

        const label = entityType ? entityType.toLowerCase() : 'request';
        await this.notificationsService.create({
          companyId,
          userId: approvalRequest.createdById,
          title: `Your ${label} request was ${outcome}`,
          message: `Your request to approve the ${label} has been ${outcome}.`,
          type: 'APPROVAL',
          link: `/dashboard/approvals`,
        });
      },
    );
  }

  @OnEvent(DomainEventTypes.PAYROLL_HOLD_RELEASE_REQUESTED)
  async handlePayrollHoldReleaseRequested(event: DomainEvent) {
    await this.processor.process(
      event,
      'GovernanceNotificationListener_handlePayrollHoldReleaseRequested',
      async () => {
        const companyId =
          (event.payload as { companyId?: string })?.companyId ?? '';
        const holdId = event.entityId;
        const hold = await this.prisma.payrollHold.findUnique({
          where: { id: holdId },
          select: { employeeId: true },
        });
        if (!hold) return;

        const employee = await this.prisma.employee.findUnique({
          where: { id: hold.employeeId },
          select: { userId: true },
        });
        const userId = employee?.userId;
        if (!userId) return;

        await this.notificationsService.create({
          companyId,
          userId,
          title: 'Payroll hold release requested',
          message:
            'A release has been requested for a payroll hold on your account. A manager will review it shortly.',
          type: 'PAYROLL',
          link: `/dashboard/payroll-holds`,
        });
      },
    );
  }
}
