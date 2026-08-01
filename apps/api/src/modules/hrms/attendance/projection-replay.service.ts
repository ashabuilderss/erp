import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { DomainEventTypes } from '../../governance-events/types/events';

const ATTENDANCE_BUSINESS_EVENTS = new Set<string>([
  DomainEventTypes.ATTENDANCE_PUNCH_RECORDED,
  DomainEventTypes.ATTENDANCE_SESSION_CLOSED,
  DomainEventTypes.ATTENDANCE_FINALIZATION_BATCH_STARTED,
  DomainEventTypes.ATTENDANCE_FINALIZED,
  DomainEventTypes.ATTENDANCE_FINALIZATION_BATCH_COMPLETED,
  DomainEventTypes.ATTENDANCE_PERIOD_LOCKED,
  DomainEventTypes.ATTENDANCE_CORRECTION_REQUESTED,
  DomainEventTypes.ATTENDANCE_CORRECTION_APPROVED,
  DomainEventTypes.ATTENDANCE_CORRECTION_REJECTED,
  DomainEventTypes.LEAVE_REQUESTED,
  DomainEventTypes.LEAVE_APPROVED,
  DomainEventTypes.LEAVE_REJECTED,
]);

@Injectable()
export class ReplayOrchestrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async replayAttendanceProjections(companyId: string) {
    const events = await this.prisma.domainEvent.findMany({
      where: {
        payload: {
          path: ['companyId'],
          equals: companyId,
        },
      },
      orderBy: { publishedAt: 'asc' },
    });

    const targetEvents = events.filter((e) =>
      ATTENDANCE_BUSINESS_EVENTS.has(e.eventType),
    );

    const targetIds = targetEvents.map((e) => e.id);
    if (targetIds.length > 0) {
      await this.prisma.processedEvent.deleteMany({
        where: { eventId: { in: targetIds } },
      });
    }

    let replayed = 0;
    for (const event of targetEvents) {
      await this.eventEmitter.emitAsync(event.eventType, event);
      replayed++;
    }

    return { replayed };
  }
}

@Injectable()
export class ProjectionHealthMonitor {
  constructor(private readonly prisma: PrismaService) {}

  async getAttendanceProjectionLag(companyId: string) {
    const pendingEvents = await this.prisma.domainEvent.count({
      where: {
        status: { in: ['PENDING', 'FAILED'] as any },
        payload: {
          path: ['companyId'],
          equals: companyId,
        },
        eventType: { in: [...ATTENDANCE_BUSINESS_EVENTS] },
      },
    });

    return {
      companyId,
      pendingBusinessEvents: pendingEvents,
      healthy: pendingEvents === 0,
    };
  }
}
