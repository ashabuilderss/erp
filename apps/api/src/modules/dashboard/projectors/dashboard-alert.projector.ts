import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../governance-events/governance-event.processor';
import { DomainEventTypes } from '../../governance-events/types/events';

@Injectable()
export class DashboardAlertProjector {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: GovernanceEventProcessor,
  ) {}

  @OnEvent(DomainEventTypes.TASK_OVERDUE)
  async handleTaskOverdue(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardAlertProjector.name,
      async () => {
        const payload = event.payload as any;
        await this.createAlert(
          payload.companyId,
          'TASK_OVERDUE',
          'WARNING',
          'Task Overdue',
          `Task "${payload.taskTitle ?? 'Unknown'}" is overdue`,
          event.id,
          event.correlationId,
          payload.entityId,
          'Task',
        );
      },
    );
  }

  @OnEvent(DomainEventTypes.TASK_PROOF_REJECTED)
  async handleTaskProofRejected(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardAlertProjector.name,
      async () => {
        const payload = event.payload as any;
        await this.createAlert(
          payload.companyId,
          'TASK_PROOF_REJECTED',
          'WARNING',
          'Task Proof Rejected',
          `Proof for task was rejected`,
          event.id,
          event.correlationId,
          payload.entityId,
          'Task',
        );
      },
    );
  }

  @OnEvent(DomainEventTypes.PAYROLL_HOLD_RECOMMENDED)
  async handlePayrollHoldRecommended(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardAlertProjector.name,
      async () => {
        const payload = event.payload as any;
        await this.createAlert(
          payload.companyId,
          'PAYROLL_HOLD_RECOMMENDED',
          'INFO',
          'Payroll Hold Recommended',
          `A payroll hold has been recommended for review`,
          event.id,
          event.correlationId,
          payload.entityId,
          'PayrollHold',
        );
      },
    );
  }

  @OnEvent(DomainEventTypes.WARNING_CREATED)
  async handleWarningCreated(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardAlertProjector.name,
      async () => {
        const payload = event.payload as any;
        await this.createAlert(
          payload.companyId,
          'WARNING_CREATED',
          'WARNING',
          'Warning Issued',
          `A warning has been issued`,
          event.id,
          event.correlationId,
          payload.entityId,
          'Warning',
        );
      },
    );
  }

  @OnEvent(DomainEventTypes.DISCIPLINARY_REVIEW_TRIGGERED)
  async handleDisciplinaryReviewTriggered(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardAlertProjector.name,
      async () => {
        const payload = event.payload as any;
        await this.createAlert(
          payload.companyId,
          'DISCIPLINARY_REVIEW',
          'CRITICAL',
          'Disciplinary Review Triggered',
          `A disciplinary review has been triggered`,
          event.id,
          event.correlationId,
          payload.entityId,
          'Warning',
        );
      },
    );
  }

  @OnEvent(DomainEventTypes.OWNER_EMERGENCY_HOLD)
  async handleOwnerEmergencyHold(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardAlertProjector.name,
      async () => {
        const payload = event.payload as any;
        await this.createAlert(
          payload.companyId,
          'OWNER_EMERGENCY_HOLD',
          'CRITICAL',
          'Emergency Payroll Hold',
          `An emergency payroll hold has been activated by the owner`,
          event.id,
          event.correlationId,
          payload.entityId,
          'PayrollHold',
        );
      },
    );
  }

  private async createAlert(
    companyId: string,
    alertType: string,
    severity: string,
    title: string,
    message: string,
    eventId: string,
    correlationId: string | null,
    entityId: string | null,
    entityType: string,
  ) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const existing = await (this.prisma as any).dashboardAlert.findFirst({
      where: { companyId, alertType, entityId, status: 'ACTIVE' },
    });

    if (!existing) {
      await (this.prisma as any).dashboardAlert.create({
        data: {
          companyId,
          alertType,
          severity,
          title,
          message,
          entityId,
          entityType,
          status: 'ACTIVE',
          createdById: 'system',
        },
      });
    }

    const criticalAlerts = await (this.prisma as any).dashboardAlert.count({
      where: { companyId, severity: 'CRITICAL', status: 'ACTIVE' },
    });

    await (this.prisma as any).dashboardKpiSnapshot.upsert({
      where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
      create: {
        companyId,
        snapshotDate: today,
        criticalAlerts,
        lastProcessedEventId: eventId,
        lastProcessedCorrelationId: correlationId,
      },
      update: {
        criticalAlerts,
        lastProcessedEventId: eventId,
        lastProcessedCorrelationId: correlationId,
        lastProjectionUpdate: new Date(),
      },
    });
  }
}
