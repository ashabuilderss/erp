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

  @OnEvent(DomainEventTypes.DOCUMENT_UPLOADED)
  async handleDocumentUploaded(event: DomainEvent) {
    await this.processor.process(
      event,
      'GovernanceNotificationListener_handleDocumentUploaded',
      async () => {
        const companyId =
          (event.payload as { companyId?: string })?.companyId ?? '';
        const { name, uploadedById } = event.payload as {
          name?: string;
          uploadedById?: string;
        };
        const label = name ? `"${name}"` : 'A document';
        await this.notifyOwners(
          companyId,
          'Document uploaded',
          `${label} was uploaded to the document registry.`,
          '/dashboard/documents',
          uploadedById,
        );
      },
    );
  }

  @OnEvent(DomainEventTypes.DOCUMENT_DELETED)
  async handleDocumentDeleted(event: DomainEvent) {
    await this.processor.process(
      event,
      'GovernanceNotificationListener_handleDocumentDeleted',
      async () => {
        const companyId =
          (event.payload as { companyId?: string })?.companyId ?? '';
        const { name, deletedById } = event.payload as {
          name?: string;
          deletedById?: string;
        };
        const label = name ? `"${name}"` : 'A document';
        await this.notifyOwners(
          companyId,
          'Document deleted',
          `${label} was deleted from the document registry.`,
          '/dashboard/documents',
          deletedById,
        );
      },
    );
  }

  @OnEvent(DomainEventTypes.LEAD_STATUS_CHANGED)
  async handleLeadStatusChanged(event: DomainEvent) {
    await this.processor.process(
      event,
      'GovernanceNotificationListener_handleLeadStatusChanged',
      async () => {
        const companyId =
          (event.payload as { companyId?: string })?.companyId ?? '';
        const { metadata, userId } = event.payload as {
          metadata?: {
            previousStatus?: string;
            newStatus?: string;
            leadName?: string;
          };
          userId?: string;
        };
        const name = metadata?.leadName ?? 'A lead';
        const from = metadata?.previousStatus ?? 'previous';
        const to = metadata?.newStatus ?? 'new';
        await this.notifyOwners(
          companyId,
          'Lead status changed',
          `${name} moved from ${from} to ${to}.`,
          '/dashboard/leads',
          userId,
        );
      },
    );
  }

  @OnEvent(DomainEventTypes.SITE_VISIT_COMPLETED)
  async handleSiteVisitCompleted(event: DomainEvent) {
    await this.processor.process(
      event,
      'GovernanceNotificationListener_handleSiteVisitCompleted',
      async () => {
        const companyId =
          (event.payload as { companyId?: string })?.companyId ?? '';
        const userId = (event.payload as { userId?: string })?.userId;
        await this.notifyOwners(
          companyId,
          'Site visit completed',
          'A scheduled site visit has been marked as completed.',
          '/dashboard/site-visits',
          userId,
        );
      },
    );
  }

  @OnEvent(DomainEventTypes.BOOKING_CREATED)
  async handleBookingCreated(event: DomainEvent) {
    await this.processor.process(
      event,
      'GovernanceNotificationListener_handleBookingCreated',
      async () => {
        const companyId =
          (event.payload as { companyId?: string })?.companyId ?? '';
        const { metadata, userId } = event.payload as {
          metadata?: {
            propertyTitle?: string;
            customerName?: string;
            bookingAmount?: number;
          };
          userId?: string;
        };
        const property = metadata?.propertyTitle ?? 'a property';
        const customer = metadata?.customerName ?? 'a customer';
        await this.notifyOwners(
          companyId,
          'Booking created',
          `A booking for ${property} (${customer}) was created.`,
          '/dashboard/bookings',
          userId,
        );
      },
    );
  }

  @OnEvent(DomainEventTypes.PROPERTY_CREATED)
  async handlePropertyCreated(event: DomainEvent) {
    await this.processor.process(
      event,
      'GovernanceNotificationListener_handlePropertyCreated',
      async () => {
        const companyId =
          (event.payload as { companyId?: string })?.companyId ?? '';
        const { metadata, userId } = event.payload as {
          metadata?: { title?: string };
          userId?: string;
        };
        const title = metadata?.title ?? 'A property';
        await this.notifyOwners(
          companyId,
          'Property added',
          `${title} was added to the property portfolio.`,
          '/dashboard/properties',
          userId,
        );
      },
    );
  }

  @OnEvent(DomainEventTypes.PROPERTY_STATUS_CHANGED)
  async handlePropertyStatusChanged(event: DomainEvent) {
    await this.processor.process(
      event,
      'GovernanceNotificationListener_handlePropertyStatusChanged',
      async () => {
        const companyId =
          (event.payload as { companyId?: string })?.companyId ?? '';
        const { metadata, userId } = event.payload as {
          metadata?: {
            title?: string;
            previousStatus?: string;
            newStatus?: string;
          };
          userId?: string;
        };
        const title = metadata?.title ?? 'A property';
        const from = metadata?.previousStatus ?? 'previous';
        const to = metadata?.newStatus ?? 'new';
        await this.notifyOwners(
          companyId,
          'Property status changed',
          `${title} moved from ${from} to ${to}.`,
          '/dashboard/properties',
          userId,
        );
      },
    );
  }

  @OnEvent(DomainEventTypes.PAYROLL_PROCESSED)
  async handlePayrollProcessed(event: DomainEvent) {
    await this.processor.process(
      event,
      'GovernanceNotificationListener_handlePayrollProcessed',
      async () => {
        const companyId =
          (event.payload as { companyId?: string })?.companyId ?? '';
        const { employeeCount, totalNetPay, heldEmployeeCount } =
          event.payload as {
            employeeCount?: number;
            totalNetPay?: number;
            heldEmployeeCount?: number;
          };
        await this.notifyOwners(
          companyId,
          'Payroll processed',
          `A payroll run was processed for ${employeeCount ?? 0} employees (net ${totalNetPay ?? 0}). ${heldEmployeeCount ? `${heldEmployeeCount} excluded by holds.` : ''}`,
          '/dashboard/payroll',
        );
      },
    );
  }

  @OnEvent(DomainEventTypes.ATTENDANCE_FINALIZED)
  async handleAttendanceFinalized(event: DomainEvent) {
    await this.processor.process(
      event,
      'GovernanceNotificationListener_handleAttendanceFinalized',
      async () => {
        const companyId =
          (event.payload as { companyId?: string })?.companyId ?? '';
        const { finalized } = event.payload as {
          finalized?: Array<{ employeeId?: string; status?: string }>;
        };
        const count = Array.isArray(finalized) ? finalized.length : 0;
        await this.notifyOwners(
          companyId,
          'Attendance finalized',
          `An attendance period was finalized for ${count} employees.`,
          '/dashboard/attendance',
        );
      },
    );
  }

  private async notifyOwners(
    companyId: string,
    title: string,
    message: string,
    link: string,
    actorUserId?: string,
  ) {
    if (!companyId) return;
    const owners = await this.prisma.user.findMany({
      where: { companyId, role: 'OWNER', deletedAt: null },
      select: { id: true },
    });
    for (const owner of owners) {
      // Skip the acting user to avoid self-notification noise.
      if (actorUserId && owner.id === actorUserId) continue;
      await this.notificationsService.create({
        companyId,
        userId: owner.id,
        title,
        message,
        type: 'SYSTEM',
        link,
      });
    }
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
