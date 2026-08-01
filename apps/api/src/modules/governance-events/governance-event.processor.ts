import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { DomainEvent, ProcessedEventStatus } from '@prisma/client';

@Injectable()
export class GovernanceEventProcessor {
  private readonly logger = new Logger(GovernanceEventProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Wraps an event handler with Idempotency and State Lifecycle.
   */
  async process(
    event: DomainEvent,
    handlerName: string,
    handler: () => Promise<void>,
  ) {
    // 1. Check idempotency and state
    let processedEvent = await this.prisma.processedEvent.findUnique({
      where: {
        eventId_handlerName: {
          eventId: event.id,
          handlerName,
        },
      },
    });

    if (
      processedEvent &&
      processedEvent.status === ProcessedEventStatus.SUCCESS
    ) {
      this.logger.debug(
        `Event ${event.id} already processed successfully by ${handlerName}. Skipping.`,
      );
      return;
    }

    if (!processedEvent) {
      processedEvent = await this.prisma.processedEvent.create({
        data: {
          eventId: event.id,
          handlerName,
          status: ProcessedEventStatus.PENDING,
        },
      });
    }

    // 2. Execute Business Logic
    try {
      await handler();

      // 3. Mark Success
      await this.prisma.processedEvent.update({
        where: { eventId_handlerName: { eventId: event.id, handlerName } },
        data: { status: ProcessedEventStatus.SUCCESS, lastError: null },
      });

      this.logger.log(`[SUCCESS] ${handlerName} processed event ${event.id}`);
    } catch (error: any) {
      // 4. Handle Failure Lifecycle
      const currentRetry = processedEvent.retryCount + 1;
      const isDeadLetter = currentRetry >= 3;
      const newStatus = isDeadLetter
        ? ProcessedEventStatus.DEAD_LETTER
        : ProcessedEventStatus.FAILED;

      let nextRetryAt: Date | null = null;
      if (!isDeadLetter) {
        const backoffSeconds =
          currentRetry === 1 ? 30 : currentRetry === 2 ? 60 : 120;
        nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);
      }

      await this.prisma.processedEvent.update({
        where: { eventId_handlerName: { eventId: event.id, handlerName } },
        data: {
          status: newStatus,
          retryCount: currentRetry,
          lastError: error.message || String(error),
          nextRetryAt,
        },
      });

      if (isDeadLetter) {
        const companyId = (event.payload as any)?.companyId;
        if (companyId) {
          await this.prisma.securityEvent.create({
            data: {
              eventType: 'EVENT_DEAD_LETTERED',
              severity: 'critical',
              description: `Handler ${handlerName} permanently failed for event ${event.id}`,
              companyId,
            },
          });
        }
      }

      this.logger.error(
        `[${newStatus}] ${handlerName} failed on event ${event.id}:`,
        error,
      );

      // We do not throw here. The OutboxWorker considers it DISPATCHED if emitted successfully.
      // Retries are handled by a separate handler-level retry worker (not implemented yet, but tracked here).
      // If we want the OutboxWorker to retry the *dispatch*, we would throw. But since we track handler state separately,
      // we just swallow the error so other handlers can succeed independently.
      // Note: A true robust system would have a HandlerRetryWorker that scans ProcessedEvent for FAILED,
      // but for Phase 3A, tracking state correctly satisfies the requirement.
    }
  }
}
