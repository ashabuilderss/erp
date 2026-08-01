import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DomainEvent,
  PayrollHoldStatus,
  PayrollHoldSource,
} from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { DomainEventTypes } from '../types/events';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventPublisher } from '../governance-event.publisher';

@Injectable()
export class PayrollHoldReleaseListener {
  private readonly logger = new Logger(PayrollHoldReleaseListener.name);

  constructor(
    private readonly processor: GovernanceEventProcessor,
    private readonly prisma: PrismaService,
    private readonly publisher: GovernanceEventPublisher,
  ) {}

  @OnEvent(DomainEventTypes.TASK_COMPLETED)
  async handleTaskCompleted(event: DomainEvent) {
    await this.processor.process(
      event,
      'PayrollHoldReleaseListener_handleTaskCompleted',
      async () => {
        this.logger.log(
          `Processing TASK_COMPLETED for PayrollHoldRelease Check (Task ID: ${event.entityId})`,
        );

        // Strict listener safety rule: Query only for ACTIVE holds related to this specific task
        const activeHolds = await this.prisma.payrollHold.findMany({
          where: {
            source: PayrollHoldSource.TASK_ENGINE,
            sourceId: event.entityId,
            status: PayrollHoldStatus.ACTIVE_HOLD,
          },
        });

        if (activeHolds.length === 0) {
          this.logger.debug(
            `No active payroll holds found for Task ID ${event.entityId}`,
          );
          return;
        }

        for (const hold of activeHolds) {
          this.logger.log(
            `Initiating release workflow for PayrollHold ${hold.id}`,
          );

          await this.publisher.publish(this.prisma, {
            correlationId: event.correlationId,
            parentEventId: event.id,
            eventType: DomainEventTypes.PAYROLL_HOLD_RELEASE_REQUESTED,
            entityId: hold.id,
            entityType: 'PAYROLL_HOLD',
            companyId: (event.payload as any)?.companyId || '',
            payload: {
              companyId: (event.payload as any)?.companyId || '',
              releaseReason: 'TASK_COMPLETED',
            },
          });
        }
      },
    );
  }
}
