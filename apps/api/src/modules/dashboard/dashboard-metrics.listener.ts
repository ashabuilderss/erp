import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { DomainEventTypes } from '../governance-events/types/events';
import { RealtimeGateway } from '../../common/realtime/realtime.gateway';

@Injectable()
export class DashboardMetricsListener {
  private readonly logger = new Logger(DashboardMetricsListener.name);

  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  @OnEvent('domain.*')
  async onAnyDomainEvent(event: DomainEvent) {
    const payload = event?.payload as any;
    const companyId = payload?.companyId;
    if (companyId) {
      this.realtimeGateway.broadcastToOwners(companyId, 'dashboard:update', {
        type: event.eventType,
      });
    }
  }

  @OnEvent(DomainEventTypes.ATTENDANCE_PUNCH_RECORDED)
  async onAttendancePunchRecorded(_event: DomainEvent) {}

  @OnEvent(DomainEventTypes.ATTENDANCE_SESSION_CLOSED)
  async onAttendanceSessionClosed(_event: DomainEvent) {}
}
