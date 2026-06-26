import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../config/prisma.service';
import { AdvisoryLockService } from '../../../common/services/advisory-lock.service';

const ESCALATION_LOCK_KEY = 20260620;

@Injectable()
export class EscalationTriggerJob {
  private readonly logger = new Logger(EscalationTriggerJob.name);

  constructor(
    private prisma: PrismaService,
    private advisoryLock: AdvisoryLockService,
  ) {}

  @Cron('*/5 * * * *')
  async handle() {
    const acquired = await this.advisoryLock.tryLock(ESCALATION_LOCK_KEY);
    if (!acquired) {
      this.logger.warn('Escalation job already running on another instance, skipping');
      return;
    }

    try {
      await this.runEvaluation();
    } finally {
      await this.advisoryLock.unlock(ESCALATION_LOCK_KEY);
    }
  }

  private async runEvaluation() {
    this.logger.log('Evaluating escalation rules...');

    const rules = await this.prisma.escalationRule.findMany({
      where: { isActive: true },
    });

    if (rules.length === 0) {
      this.logger.log('No active escalation rules');
      return;
    }

    for (const rule of rules) {
      try {
        await this.evaluateRule(rule);
      } catch (err) {
        this.logger.error(`Error evaluating rule ${rule.id}: ${err}`);
      }
    }
  }

  private async evaluateRule(rule: {
    id: string;
    companyId: string;
    triggerType: string;
    config: unknown;
    level: number;
    notifyRoles: string[];
  }) {
    const config = (rule.config as Record<string, unknown>) ?? {};
    const staleDays = (config.staleDays as number) ?? 3;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - staleDays);

    const existingEventKeys = await this.prisma.escalationEvent.findMany({
      where: {
        ruleId: rule.id,
        status: { not: 'RESOLVED' },
        triggeredAt: { gte: cutoff },
      },
      select: { entityId: true, entityType: true },
    });
    const alreadyTriggered = new Set(
      existingEventKeys.map((e) => `${e.entityType}:${e.entityId}`),
    );

    switch (rule.triggerType) {
      case 'LEAD_STALE': {
        const staleLeads = await this.prisma.lead.findMany({
          where: {
            companyId: rule.companyId,
            status: { in: ['NEW', 'CONTACTED', 'INTERESTED'] },
            updatedAt: { lt: cutoff },
          },
          select: { id: true, customerName: true },
        });

        for (const lead of staleLeads) {
          const key = `Lead:${lead.id}`;
          if (alreadyTriggered.has(key)) continue;
          alreadyTriggered.add(key);
          await this.createEvent(rule, lead.id, 'Lead', `Lead "${lead.customerName}" stale for ${staleDays}+ days`);
        }
        break;
      }

      case 'ATTENDANCE_MISSED': {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const employees = await this.prisma.employee.findMany({
          where: { companyId: rule.companyId, status: 'ACTIVE' },
          select: { id: true, userId: true },
        });

        for (const emp of employees) {
          const attendance = await this.prisma.attendance.findUnique({
            where: {
              companyId_employeeId_date: { companyId: rule.companyId, employeeId: emp.id, date: today },
            },
          });
          if (!attendance || attendance.status === 'ABSENT') {
            const key = `Employee:${emp.id}`;
            if (alreadyTriggered.has(key)) continue;
            alreadyTriggered.add(key);
            await this.createEvent(rule, emp.id, 'Employee', `Employee missed attendance today`);
          }
        }
        break;
      }

      case 'LEAVE_PENDING': {
        const pendingLeaves = await this.prisma.leaveRequest.findMany({
          where: {
            employee: { companyId: rule.companyId },
            status: 'PENDING',
            createdAt: { lt: cutoff },
          },
          select: { id: true, employeeId: true },
        });

        for (const leave of pendingLeaves) {
          const key = `LeaveRequest:${leave.id}`;
          if (alreadyTriggered.has(key)) continue;
          alreadyTriggered.add(key);
          await this.createEvent(rule, leave.id, 'LeaveRequest', `Leave request pending for ${staleDays}+ days`);
        }
        break;
      }

      case 'APPROVAL_PENDING': {
        const staleApprovals = await this.prisma.leaveRequest.findMany({
          where: {
            employee: { companyId: rule.companyId },
            status: 'PENDING',
            createdAt: { lt: cutoff },
          },
          select: { id: true },
        });

        for (const app of staleApprovals) {
          const key = `LeaveRequest:${app.id}`;
          if (alreadyTriggered.has(key)) continue;
          alreadyTriggered.add(key);
          await this.createEvent(rule, app.id, 'LeaveRequest', `Leave request awaiting approval for ${staleDays}+ days`);
        }
        break;
      }

      case 'TASK_OVERDUE': {
        const overdueTasks = await this.prisma.employeeAssignment.findMany({
          where: {
            companyId: rule.companyId,
            endDate: { lt: new Date() },
            type: { in: ['PROPERTY', 'LEAD', 'SITE_VISIT', 'BOOKING'] },
          },
          select: { id: true },
        });

        for (const task of overdueTasks) {
          const key = `EmployeeAssignment:${task.id}`;
          if (alreadyTriggered.has(key)) continue;
          alreadyTriggered.add(key);
          await this.createEvent(rule, task.id, 'EmployeeAssignment', `Task overdue`);
        }
        break;
      }
    }
  }

  private async createEvent(
    rule: { id: string; companyId: string; notifyRoles: string[] },
    entityId: string,
    entityType: string,
    description: string,
  ) {
    const event = await this.prisma.escalationEvent.create({
      data: {
        ruleId: rule.id,
        companyId: rule.companyId,
        entityId,
        entityType,
        notes: description,
        status: 'TRIGGERED',
        triggeredAt: new Date(),
      },
    });

    const targetUsers = await this.prisma.user.findMany({
      where: {
        companyId: rule.companyId,
        role: { in: rule.notifyRoles as any },
        isActive: true,
      },
      select: { id: true },
    });

    for (const user of targetUsers) {
      await this.prisma.notification.create({
        data: {
          userId: user.id,
          companyId: rule.companyId,
          title: `Escalation: ${entityType}`,
          message: description,
          type: 'ESCALATION',
          link: `/escalation`,
        },
      });
    }

    this.logger.log(`Escalation event created: ${entityType}#${entityId}`);
    return event;
  }
}
