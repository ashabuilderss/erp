import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, PayrollHoldStatus } from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { DomainEventTypes } from '../types/events';
import { PrismaService } from '../../../config/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class TaskEscalationNotificationListener {
  private readonly logger = new Logger(TaskEscalationNotificationListener.name);

  constructor(
    private readonly processor: GovernanceEventProcessor,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(DomainEventTypes.TASK_ESCALATED_MANAGER)
  async handleEscalatedToManager(event: DomainEvent) {
    await this.processor.process(
      event,
      'TaskEscalationNotificationListener_handleEscalatedToManager',
      async () => {
        this.logger.log(
          `Processing TASK_ESCALATED_MANAGER for Task ID ${event.entityId}`,
        );

        const task = await this.prisma.task.findUnique({
          where: { id: event.entityId },
          include: {
            employeesTasksAssigneeIdToemployees: {
              select: { managerId: true, userId: true, companyId: true },
            },
          },
        });

        if (!task) {
          this.logger.warn(`Task ${event.entityId} not found`);
          return;
        }

        const assignee = task.employeesTasksAssigneeIdToemployees;
        if (!assignee?.managerId) {
          this.logger.warn(`No manager found for assignee of task ${event.entityId}`);
          return;
        }

        const manager = await this.prisma.employee.findUnique({
          where: { id: assignee.managerId },
          select: { userId: true },
        });

        if (!manager?.userId) {
          this.logger.warn(`Manager ${assignee.managerId} has no linked user account`);
          return;
        }

        const companyId = assignee.companyId || (event.payload as any)?.companyId || '';
        const payload: any = event.payload;

        await this.notificationsService.create({
          userId: manager.userId,
          companyId,
          title: 'Task Escalated to You',
          message: `Task "${task.title}" has been escalated to you for review (SLA breach).`,
          type: 'WARNING',
          link: `/dashboard/my-tasks/${task.id}`,
        });
      },
    );
  }

  @OnEvent(DomainEventTypes.TASK_ESCALATED_HR)
  async handleEscalatedToHR(event: DomainEvent) {
    await this.processor.process(
      event,
      'TaskEscalationNotificationListener_handleEscalatedToHR',
      async () => {
        this.logger.log(
          `Processing TASK_ESCALATED_HR for Task ID ${event.entityId}`,
        );

        const task = await this.prisma.task.findUnique({
          where: { id: event.entityId },
          include: {
            companies: { select: { id: true } },
          },
        });

        if (!task) {
          this.logger.warn(`Task ${event.entityId} not found`);
          return;
        }

        const companyId = task.companyId || (event.payload as any)?.companyId || '';

        // Find all OWNER/HR_MANAGER users in the company to notify
        const hrUsers = await this.prisma.user.findMany({
          where: {
            companyId,
            role: { in: ['OWNER', 'HR_MANAGER'] },
            deletedAt: null,
          },
          select: { id: true },
        });

        for (const user of hrUsers) {
          await this.notificationsService.create({
            userId: user.id,
            companyId,
            title: 'Task Escalated to HR',
            message: `Task "${task.title}" has been escalated to HR (critical SLA breach).`,
            type: 'ERROR',
            link: `/dashboard/my-tasks/${task.id}`,
          });
        }

        // At escalation level 3+, also create a Warning record for the assignee
        if (task.escalationLevel >= 3) {
          const payload: any = event.payload;
          await this.prisma.warning.create({
            data: {
              companyId,
              employeeId: task.assigneeId,
              category: 'TASK_PERFORMANCE',
              severity: task.escalationLevel >= 4 ? 'LEVEL_3_FINAL' : 'LEVEL_2_WRITTEN',
              reason: `Task "${task.title}" escalated to HR after repeated SLA breaches (level ${task.escalationLevel}).`,
              isSystemGenerated: true,
              status: 'PENDING',
            },
          });
        }
      },
    );
  }

  @OnEvent(DomainEventTypes.TASK_PROOF_ESCALATED_HR)
  async handleProofEscalatedToHR(event: DomainEvent) {
    await this.processor.process(
      event,
      'TaskEscalationNotificationListener_handleProofEscalatedToHR',
      async () => {
        this.logger.log(
          `Processing TASK_PROOF_ESCALATED_HR for TaskProof ID ${event.entityId}`,
        );

        const proof = await this.prisma.taskProof.findUnique({
          where: { id: event.entityId },
          include: {
            tasks: {
              include: {
                employeesTasksAssigneeIdToemployees: {
                  select: { companyId: true },
                },
              },
            },
          },
        });

        if (!proof) {
          this.logger.warn(`TaskProof ${event.entityId} not found`);
          return;
        }

        const companyId = proof.tasks?.employeesTasksAssigneeIdToemployees?.companyId
          || (event.payload as any)?.companyId || '';

        const hrUsers = await this.prisma.user.findMany({
          where: {
            companyId,
            role: { in: ['OWNER', 'HR_MANAGER'] },
            deletedAt: null,
          },
          select: { id: true },
        });

        for (const user of hrUsers) {
          await this.notificationsService.create({
            userId: user.id,
            companyId,
            title: 'Task Proof Escalated to HR',
            message: `A task proof submission has been escalated to HR for review.`,
            type: 'WARNING',
            link: `/dashboard/my-tasks/${proof.taskId}`,
          });
        }
      },
    );
  }

  @OnEvent(DomainEventTypes.TASK_EXTENSION_REQUESTED)
  async handleExtensionRequested(event: DomainEvent) {
    await this.processor.process(
      event,
      'TaskEscalationNotificationListener_handleExtensionRequested',
      async () => {
        this.logger.log(
          `Processing TASK_EXTENSION_REQUESTED for Task ID ${event.entityId}`,
        );

        const task = await this.prisma.task.findUnique({
          where: { id: event.entityId },
          include: {
            employeesTasksCreatorIdToemployees: {
              select: { userId: true },
            },
            employeesTasksAssigneeIdToemployees: {
              select: { companyId: true },
            },
          },
        });

        if (!task) {
          this.logger.warn(`Task ${event.entityId} not found`);
          return;
        }

        const creatorUserId = task.employeesTasksCreatorIdToemployees?.userId;
        const companyId = task.employeesTasksAssigneeIdToemployees?.companyId
          || (event.payload as any)?.companyId || '';

        if (!creatorUserId) {
          this.logger.warn(`Task creator has no linked user account`);
          return;
        }

        const payload: any = event.payload;

        await this.notificationsService.create({
          userId: creatorUserId,
          companyId,
          title: 'Extension Requested',
          message: `An extension has been requested for task "${task.title}".`,
          type: 'INFO',
          link: `/dashboard/my-tasks/${task.id}`,
        });
      },
    );
  }
}
