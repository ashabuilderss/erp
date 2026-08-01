import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, ApprovalStatus } from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { DomainEventTypes } from '../types/events';
import { GovernanceEventPublisher } from '../governance-event.publisher';
import { PrismaService } from '../../../config/prisma.service';
import { ApprovalsSpawningService } from '../../approvals/approvals-spawning.service';

@Injectable()
export class ApprovalEngineListener {
  private readonly logger = new Logger(ApprovalEngineListener.name);

  constructor(
    private readonly processor: GovernanceEventProcessor,
    private readonly publisher: GovernanceEventPublisher,
    private readonly prisma: PrismaService,
    private readonly spawningService: ApprovalsSpawningService,
  ) {}

  @OnEvent(DomainEventTypes.DISCIPLINARY_REVIEW_TRIGGERED)
  async handleDisciplinaryReview(event: DomainEvent) {
    await this.processor.process(
      event,
      'ApprovalEngineListener_handleDisciplinaryReview',
      async () => {
        const payload = (event.payload as any) ?? {};
        const companyId = payload.companyId || event.companyId || '';
        if (!companyId) {
          this.logger.warn(
            `DISCIPLINARY_REVIEW_TRIGGERED missing companyId for event ${event.id}`,
          );
          return;
        }

        const entityId = event.entityId;
        if (!entityId) {
          this.logger.warn(
            `DISCIPLINARY_REVIEW_TRIGGERED missing entityId for event ${event.id}`,
          );
          return;
        }

        this.logger.log(
          `Processing DISCIPLINARY_REVIEW_TRIGGERED for employee ${entityId}`,
        );

        // Deduplication: a pending disciplinary review may already exist for
        // this employee (warnings.service spawns it synchronously).
        const existing = await this.prisma.approvalRequest.findFirst({
          where: {
            companyId,
            entityType: 'DISCIPLINARY_REVIEW',
            entityId,
            status: ApprovalStatus.PENDING,
          },
        });

        if (existing) {
          // The request was spawned synchronously; emit APPROVAL_CREATED so
          // the dashboard projector reflects the pending approval.
          await this.publisher.publish(this.prisma as never, {
            correlationId: event.correlationId,
            parentEventId: event.id,
            eventType: DomainEventTypes.APPROVAL_CREATED,
            entityId: existing.entityId,
            entityType: existing.entityType,
            companyId: existing.companyId,
            payload: {
              companyId: existing.companyId,
              requestId: existing.id,
              entityType: existing.entityType,
              entityId: existing.entityId,
              triggeredBy: event.eventType,
            },
          });
          return;
        }

        const createdById =
          payload.createdById ||
          payload.triggeredBy ||
          (
            await this.prisma.user.findFirst({
              where: { companyId, role: 'OWNER' },
              select: { id: true },
            })
          )?.id;

        if (!createdById) {
          this.logger.warn(
            `Cannot spawn disciplinary review for employee ${entityId}: no creator resolved`,
          );
          return;
        }

        // No pending request yet — spawn one (ApprovalsSpawningService emits
        // APPROVAL_CREATED inside its own transaction).
        await this.spawningService.spawnRequest(
          companyId,
          'DISCIPLINARY_REVIEW',
          entityId,
          createdById,
        );
      },
    );
  }
}
