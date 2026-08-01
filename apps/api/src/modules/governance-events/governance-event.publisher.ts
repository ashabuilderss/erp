import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { DomainEventTypes, BaseDomainEventPayload } from './types/events';
import { EventStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

interface PublishOptions {
  eventType: DomainEventTypes;
  entityId: string;
  entityType: string;
  companyId: string;
  payload: BaseDomainEventPayload;
  correlationId?: string;
  parentEventId?: string;
  eventVersion?: number;
}

@Injectable()
export class GovernanceEventPublisher {
  private readonly logger = new Logger(GovernanceEventPublisher.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Publishes a Domain Event within an existing transaction (or creates one).
   * It is crucial to pass `tx` to ensure the event is atomically saved with business logic.
   */
  async publish(tx: Prisma.TransactionClient, options: PublishOptions) {
    const correlationId = options.correlationId || randomUUID();

    await tx.domainEvent.create({
      data: {
        eventType: options.eventType,
        entityId: options.entityId,
        entityType: options.entityType,
        companyId: options.companyId,
        payload: options.payload as any,
        correlationId,
        parentEventId: options.parentEventId,
        eventVersion: options.eventVersion || 1,
        status: EventStatus.PENDING,
      },
    });

    this.logger.debug(
      `Stored DomainEvent [${options.eventType}] for entity ${options.entityType}:${options.entityId}`,
    );
  }
}
