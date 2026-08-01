import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../../governance-events/governance-event.processor';
import { DomainEventTypes } from '../../../governance-events/types/events';
import { EmployeesService } from '../../employees/employees.service';
import { LeaveRequestsService } from '../../leave-requests/leave-requests.service';

@Injectable()
export class DashboardMetricsProjector {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: GovernanceEventProcessor,
    private readonly employeesService: EmployeesService,
    private readonly leaveRequestsService: LeaveRequestsService,
  ) {}

  @OnEvent(DomainEventTypes.ATTENDANCE_FINALIZED)
  async handleAttendanceFinalized(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardMetricsProjector.name,
      async () => {
        const payload = event.payload as any;
        const byDate = new Map<
          string,
          {
            snapshotDate: Date;
            presentEmployees: number;
            absentEmployees: number;
            lateEmployees: number;
          }
        >();

        for (const item of payload.finalized ?? []) {
          const snapshotDate = new Date(item.date);
          snapshotDate.setUTCHours(0, 0, 0, 0);
          const key = snapshotDate.toISOString();
          const current = byDate.get(key) ?? {
            snapshotDate,
            presentEmployees: 0,
            absentEmployees: 0,
            lateEmployees: 0,
          };
          current.presentEmployees += item.result.isAbsent ? 0 : 1;
          current.absentEmployees += item.result.isAbsent ? 1 : 0;
          current.lateEmployees += item.result.lateMinutes > 0 ? 1 : 0;
          byDate.set(key, current);
        }

        const totalEmployees = await this.employeesService.countActive(payload.companyId);

        for (const metrics of byDate.values()) {
          await (this.prisma as any).dashboardMetricsSnapshot.upsert({
            where: {
              companyId_snapshotDate: {
                companyId: payload.companyId,
                snapshotDate: metrics.snapshotDate,
              },
            },
            create: {
              companyId: payload.companyId,
              snapshotDate: metrics.snapshotDate,
              totalEmployees,
              presentEmployees: metrics.presentEmployees,
              absentEmployees: metrics.absentEmployees,
              lateEmployees: metrics.lateEmployees,
              lastProcessedEventId: event.id,
              lastProcessedCorrelationId: event.correlationId,
            },
            update: {
              totalEmployees,
              presentEmployees: metrics.presentEmployees,
              absentEmployees: metrics.absentEmployees,
              lateEmployees: metrics.lateEmployees,
              lastProcessedEventId: event.id,
              lastProcessedCorrelationId: event.correlationId,
              lastProjectionUpdate: new Date(),
            },
          });

          await (this.prisma as any).dashboardKpiSnapshot.upsert({
            where: {
              companyId_snapshotDate: {
                companyId: payload.companyId,
                snapshotDate: metrics.snapshotDate,
              },
            },
            create: {
              companyId: payload.companyId,
              snapshotDate: metrics.snapshotDate,
              totalEmployees,
              presentEmployees: metrics.presentEmployees,
              absentEmployees: metrics.absentEmployees,
              lateEmployees: metrics.lateEmployees,
              lastProcessedEventId: event.id,
              lastProcessedCorrelationId: event.correlationId,
            },
            update: {
              totalEmployees,
              presentEmployees: metrics.presentEmployees,
              absentEmployees: metrics.absentEmployees,
              lateEmployees: metrics.lateEmployees,
              lastProcessedEventId: event.id,
              lastProcessedCorrelationId: event.correlationId,
              lastProjectionUpdate: new Date(),
            },
          });
        }
      },
    );
  }

  @OnEvent(DomainEventTypes.LEAVE_APPROVED)
  async handleLeaveApproved(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardMetricsProjector.name,
      async () => {
        const payload = event.payload as any;
        const companyId = payload.companyId;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const onLeaveToday = await this.leaveRequestsService.countApprovedLeaves(companyId, today);

        await (this.prisma as any).dashboardKpiSnapshot.upsert({
          where: {
            companyId_snapshotDate: {
              companyId,
              snapshotDate: today,
            },
          },
          create: {
            companyId,
            snapshotDate: today,
            onLeaveToday,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
          },
          update: {
            onLeaveToday,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
            lastProjectionUpdate: new Date(),
          },
        });
      },
    );
  }
}
