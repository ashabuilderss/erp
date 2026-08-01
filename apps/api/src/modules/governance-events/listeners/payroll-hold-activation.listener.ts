import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, PayrollHoldStatus } from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { DomainEventTypes } from '../types/events';
import { GovernanceEventPublisher } from '../governance-event.publisher';
import { PrismaService } from '../../../config/prisma.service';

@Injectable()
export class PayrollHoldActivationListener {
  private readonly logger = new Logger(PayrollHoldActivationListener.name);

  constructor(
    private readonly processor: GovernanceEventProcessor,
    private readonly publisher: GovernanceEventPublisher,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(DomainEventTypes.APPROVAL_APPROVED)
  async handleApprovalApproved(event: DomainEvent) {
    await this.processor.process(
      event,
      'PayrollHoldActivationListener_handleApprovalApproved',
      async () => {
        // STRICT FILTER: Only care about PAYROLL_HOLD entity types
        if (event.entityType !== 'PAYROLL_HOLD') {
          this.logger.debug(
            `Ignored approval for entity type ${event.entityType}. Not a PAYROLL_HOLD.`,
          );
          return;
        }

        this.logger.log(
          `Processing PAYROLL_HOLD activation for entity ${event.entityId}`,
        );

        const holdId = (event.payload as any)?.holdId || event.entityId;
        const companyId = (event.payload as any)?.companyId || '';

        await this.prisma.$transaction(async (tx) => {
          // Actually activate the hold
          await tx.payrollHold.update({
            where: { id: holdId },
            data: { status: PayrollHoldStatus.ACTIVE_HOLD },
          });

          // Record the hold activation in history
          await tx.payrollHoldHistory.create({
            data: {
              holdId,
              companyId,
              event: 'ACTIVATED',
              actorId: (event.payload as any)?.actorId || null,
              comments: 'Approved via governance event',
            },
          });

          await this.publisher.publish(tx, {
            correlationId: event.correlationId,
            parentEventId: event.id,
            eventType: DomainEventTypes.PAYROLL_HOLD_ACTIVATED,
            entityId: holdId,
            entityType: 'PAYROLL_HOLD',
            companyId,
            payload: {
              companyId,
              status: 'ACTIVE',
            },
          });
        });
      },
    );
  }
}
