import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, ApprovalStatus } from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { DomainEventTypes } from '../types/events';
import { PrismaService } from '../../../config/prisma.service';

@Injectable()
export class WarningEngineApprovalListener {
  private readonly logger = new Logger(WarningEngineApprovalListener.name);

  constructor(
    private readonly processor: GovernanceEventProcessor,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(DomainEventTypes.APPROVAL_APPROVED)
  @OnEvent(DomainEventTypes.APPROVAL_REJECTED)
  async handleApprovalOutcome(event: DomainEvent) {
    await this.processor.process(
      event,
      'WarningEngineApprovalListener_handleApprovalOutcome',
      async () => {
        // STRICT FILTER: Only care about WARNING entity types
        if (event.entityType !== 'WARNING') {
          this.logger.debug(
            `Ignored approval for entity type ${event.entityType}. Not a WARNING.`,
          );
          return;
        }

        this.logger.log(
          `Processing WARNING approval outcome [${event.eventType}] for entity ${event.entityId}`,
        );

        // Update the Warning record's status based on the approval outcome
        const newStatus: ApprovalStatus =
          event.eventType === DomainEventTypes.APPROVAL_APPROVED
            ? 'APPROVED'
            : 'REJECTED';

        const warningId = (event.payload as any)?.warningId || event.entityId;

        await this.prisma.warning.update({
          where: { id: warningId },
          data: { status: newStatus },
        });

        this.logger.log(`Warning ${warningId} status updated to ${newStatus}`);
      },
    );
  }
}
