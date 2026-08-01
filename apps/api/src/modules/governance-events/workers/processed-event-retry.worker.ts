import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../config/prisma.service';
import { ProcessedEventStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProcessedEventRetryWorker {
  private readonly logger = new Logger(ProcessedEventRetryWorker.name);
  private isRunning = false;
  private readonly batchSize: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.batchSize =
      this.configService.get<number>('EVENT_RETRY_BATCH_SIZE') || 100;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleRetries() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      await this.processRetries();
    } catch (error) {
      this.logger.error('Error in ProcessedEventRetryWorker', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async processRetries() {
    const now = new Date();

    // Find failed handlers that are due for retry
    const failedEvents = await this.prisma.processedEvent.findMany({
      where: {
        status: ProcessedEventStatus.FAILED,
        retryCount: { lt: 3 },
        nextRetryAt: { lte: now },
      },
      take: this.batchSize,
      orderBy: { nextRetryAt: 'asc' },
    });

    for (const processedEvent of failedEvents) {
      // Atomic claim to prevent double-execution in scaled environments
      const claimed = await this.prisma.processedEvent.updateMany({
        where: {
          eventId: processedEvent.eventId,
          handlerName: processedEvent.handlerName,
          status: ProcessedEventStatus.FAILED,
        },
        data: { status: ProcessedEventStatus.PROCESSING },
      });

      if (claimed.count === 0) {
        // Event was claimed by another worker instance
        continue;
      }

      const domainEvent = await this.prisma.domainEvent.findUnique({
        where: { id: processedEvent.eventId },
      });

      if (!domainEvent) {
        this.logger.warn(
          `Domain event ${processedEvent.eventId} not found. Marking DEAD_LETTER.`,
        );
        await this.markDeadLetter(processedEvent);
        continue;
      }

      this.logger.log(
        `Retrying handler ${processedEvent.handlerName} for event ${processedEvent.eventId} (Attempt ${processedEvent.retryCount + 1})`,
      );

      try {
        await this.eventEmitter.emitAsync(domainEvent.eventType, domainEvent);
        // We do not set SUCCESS here because GovernanceEventProcessor handles SUCCESS transition
      } catch (err: any) {
        this.logger.error(
          `Failed to emit for retry: ${processedEvent.eventId}`,
          err,
        );
        await this.handleFailure(processedEvent, err);
      }
    }
  }

  private async markDeadLetter(processedEvent: any) {
    await this.prisma.processedEvent.update({
      where: {
        eventId_handlerName: {
          eventId: processedEvent.eventId,
          handlerName: processedEvent.handlerName,
        },
      },
      data: { status: ProcessedEventStatus.DEAD_LETTER },
    });
    const domainEvent = await this.prisma.domainEvent.findUnique({
      where: { id: processedEvent.eventId },
    });
    const companyId = (domainEvent?.payload as any)?.companyId;

    if (companyId) {
      // Write audit event
      await this.prisma.securityEvent.create({
        data: {
          eventType: 'EVENT_DEAD_LETTERED',
          severity: 'critical',
          description: `Handler ${processedEvent.handlerName} permanently failed for event ${processedEvent.eventId}`,
          companyId,
        },
      });
    }
  }

  private async handleFailure(processedEvent: any, error: any) {
    const nextRetry = processedEvent.retryCount + 1;
    if (nextRetry >= 3) {
      await this.markDeadLetter(processedEvent);
    } else {
      const backoffSeconds = nextRetry === 1 ? 30 : nextRetry === 2 ? 60 : 120;
      const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);

      await this.prisma.processedEvent.update({
        where: {
          eventId_handlerName: {
            eventId: processedEvent.eventId,
            handlerName: processedEvent.handlerName,
          },
        },
        data: {
          status: ProcessedEventStatus.FAILED,
          retryCount: nextRetry,
          lastError: error.message || String(error),
          nextRetryAt,
        },
      });
    }
  }
}
