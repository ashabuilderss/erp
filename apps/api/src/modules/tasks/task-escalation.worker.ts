import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../governance-events/types/events';

@Injectable()
export class TaskEscalationWorker {
  private readonly logger = new Logger(TaskEscalationWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: GovernanceEventPublisher,
  ) {}

  @Cron('0 */15 * * * *') // Run every 15 minutes as per SRS 7.4
  async handleTaskEscalations() {
    this.logger.debug('Running Task Escalation Worker...');
    const now = new Date();

    const priorities = [
      TaskPriority.CRITICAL,
      TaskPriority.IMPORTANT,
      TaskPriority.NORMAL,
    ];

    for (const priority of priorities) {
      await this.processAcknowledgmentBreaches(priority, now);
      await this.processDueDateBreaches(priority, now);
    }
    
    await this.processSlaReminders(now);
    await this.processSlaBreaches(now);
  }

  private async processAcknowledgmentBreaches(
    priority: TaskPriority,
    now: Date,
  ) {
    let allowedHours = 24;
    if (priority === TaskPriority.CRITICAL) allowedHours = 4;
    else if (priority === TaskPriority.IMPORTANT) allowedHours = 12;

    const thresholdDate = new Date(
      now.getTime() - allowedHours * 60 * 60 * 1000,
    );

    const breachedTasks = await this.prisma.task.findMany({
      where: {
        status: TaskStatus.PENDING,
        priority: priority,
        createdAt: { lt: thresholdDate },
        escalationLevel: 0,
      },
    });

    for (const task of breachedTasks) {
      await this.prisma.$transaction(async (tx) => {
        const currentTask = await tx.task.findUnique({
          where: { id: task.id },
        });
        if (!currentTask || currentTask.status !== TaskStatus.PENDING || currentTask.escalationLevel > 0) return;

        await tx.task.update({
          where: { id: task.id },
          data: { escalationLevel: 1 },
        });

        await tx.taskHistory.create({
          data: {
            taskId: task.id,
            companyId: currentTask.companyId,
            event: 'SLA_BREACH_ACKNOWLEDGMENT',
            comments: `Task acknowledgment SLA breached. Stage 1 Reminder sent.`,
          },
        });

        // In a real system, we'd also emit a Notification event here for Stage 1.
      });
    }
  }

  private getEscalationDelayHours(priority: TaskPriority): number {
    switch (priority) {
      case TaskPriority.CRITICAL: return 4;
      case TaskPriority.IMPORTANT: return 12;
      case TaskPriority.NORMAL: return 24;
      default: return 24;
    }
  }

  private async processDueDateBreaches(priority: TaskPriority, now: Date) {
    const breachedTasks = await this.prisma.task.findMany({
      where: {
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        priority: priority,
        dueDate: { lt: now },
      },
    });

    for (const task of breachedTasks) {
      await this.prisma.$transaction(async (tx) => {
        const currentTask = await tx.task.findUnique({
          where: { id: task.id },
        });
        
        if (!currentTask || currentTask.status === TaskStatus.COMPLETED || currentTask.status === TaskStatus.CANCELLED || currentTask.dueDate >= now) return;

        const hoursOverdue = (now.getTime() - currentTask.dueDate.getTime()) / (1000 * 60 * 60);
        const intervalHours = this.getEscalationDelayHours(priority);
        const expectedLevel = Math.floor(hoursOverdue / intervalHours) + 1;

        if (expectedLevel > currentTask.escalationLevel) {
          const nextLevel = currentTask.escalationLevel + 1;
          let statusUpdate = currentTask.status;
          
          if (currentTask.status !== TaskStatus.OVERDUE) {
            statusUpdate = TaskStatus.OVERDUE;
          }

          await tx.task.update({
            where: { id: task.id },
            data: {
              status: statusUpdate,
              escalationLevel: nextLevel,
            },
          });

          let actionDescription = 'Escalation level increased.';
          let eventToEmit: DomainEventTypes | null = null;

          if (nextLevel === 1) {
            actionDescription = 'Task Overdue - Stage 1 Reminder Sent.';
          } else if (nextLevel === 2) {
            if (priority === TaskPriority.CRITICAL) {
              actionDescription = 'Task Overdue Stage 2 - Warning Issued.';
              eventToEmit = DomainEventTypes.TASK_OVERDUE; // Triggers warning
            } else {
              actionDescription = 'Task Overdue Stage 2 - Escalated to Manager.';
              eventToEmit = DomainEventTypes.TASK_ESCALATED_MANAGER;
            }
          } else if (nextLevel === 3) {
            if (priority === TaskPriority.CRITICAL) {
              actionDescription = 'Task Overdue Stage 3 - Escalated to HR.';
              eventToEmit = DomainEventTypes.TASK_ESCALATED_HR;
            } else {
              actionDescription = 'Task Overdue Stage 3 - Warning Issued.';
              eventToEmit = DomainEventTypes.TASK_OVERDUE;
            }
          } else if (nextLevel === 4 && priority !== TaskPriority.CRITICAL) {
             actionDescription = 'Task Overdue Stage 4 - Escalated to HR.';
             eventToEmit = DomainEventTypes.TASK_ESCALATED_HR;            }
          

          await tx.taskHistory.create({
            data: {
              taskId: task.id,
              companyId: currentTask.companyId,
              event: 'SLA_BREACH_DUE_DATE',
              comments: actionDescription,
            },
          });

          if (eventToEmit) {
            await this.eventPublisher.publish(tx, {
              eventType: eventToEmit,
              entityType: 'TASK',
              entityId: task.id,
              companyId: currentTask.companyId,
              payload: {
                companyId: currentTask.companyId,
                taskId: task.id,
                assigneeId: currentTask.assigneeId,
                priority: currentTask.priority,
                escalationLevel: nextLevel,
              },
            });
          }
        }
      });
    }
  }

  private async processSlaReminders(now: Date) {
    const reminderThreshold = new Date(now.getTime() + 30 * 60 * 1000); // 30 mins from now
    
    const tasksToRemind = await this.prisma.task.findMany({
      where: {
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        slaDeadline: { not: null, lte: reminderThreshold, gt: now },
        reminderSentAt: null,
      },
    });

    for (const task of tasksToRemind) {
      await this.prisma.$transaction(async (tx) => {
        const currentTask = await tx.task.findUnique({ where: { id: task.id } });
        if (!currentTask || currentTask.reminderSentAt) return;

        await tx.task.update({
          where: { id: task.id },
          data: { reminderSentAt: now },
        });

        const remainingMs = currentTask.slaDeadline!.getTime() - now.getTime();
        const remainingMinutes = Math.max(0, Math.floor(remainingMs / 60000));

        await this.eventPublisher.publish(tx, {
          eventType: DomainEventTypes.TASK_SLA_REMINDER,
          entityType: 'TASK',
          entityId: task.id,
          companyId: currentTask.companyId,
          payload: {
            companyId: currentTask.companyId,
            taskId: task.id,
            assigneeId: currentTask.assigneeId,
            slaDeadline: currentTask.slaDeadline!.toISOString(),
            remainingMinutes,
          },
        });
      });
    }
  }

  private async processSlaBreaches(now: Date) {
    const breachedTasks = await this.prisma.task.findMany({
      where: {
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED, TaskStatus.OVERDUE] },
        slaDeadline: { not: null, lt: now },
      },
    });

    for (const task of breachedTasks) {
      await this.prisma.$transaction(async (tx) => {
        const currentTask = await tx.task.findUnique({ where: { id: task.id } });
        if (!currentTask || currentTask.status === TaskStatus.OVERDUE || currentTask.status === TaskStatus.COMPLETED || currentTask.status === TaskStatus.CANCELLED) return;

        const nextLevel = currentTask.escalationLevel === 0 ? 1 : currentTask.escalationLevel + 1;

        await tx.task.update({
          where: { id: task.id },
          data: {
            status: TaskStatus.OVERDUE,
            escalationLevel: nextLevel,
          },
        });

        await tx.taskHistory.create({
          data: {
            taskId: task.id,
            companyId: currentTask.companyId,
            event: 'SLA_BREACH_TIME_LIMIT',
            comments: 'Task missed hourly time limit SLA. Marked as OVERDUE.',
          },
        });

        const breachMinutes = Math.floor((now.getTime() - currentTask.slaDeadline!.getTime()) / 60000);

        await this.eventPublisher.publish(tx, {
          eventType: DomainEventTypes.TASK_SLA_BREACHED,
          entityType: 'TASK',
          entityId: task.id,
          companyId: currentTask.companyId,
          payload: {
            companyId: currentTask.companyId,
            taskId: task.id,
            assigneeId: currentTask.assigneeId,
            creatorId: currentTask.creatorId,
            slaHours: currentTask.slaHours,
            breachMinutes,
          },
        });
      });
    }
  }
}
