import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../config/prisma.service';
import { EventStatus, ProcessedEventStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProcessingRecoveryWorker {
  private readonly logger = new Logger(ProcessingRecoveryWorker.name);
  private isRunning = false;
  private readonly timeoutMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.timeoutMinutes =
      this.configService.get<number>('EVENT_PROCESSING_TIMEOUT_MINUTES') || 5;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleRecovery() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      await this.recoverDomainEvents();
      await this.recoverProcessedEvents();
    } catch (error) {
      this.logger.error('Error in ProcessingRecoveryWorker', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async recoverDomainEvents() {
    const timeoutThreshold = new Date(
      Date.now() - this.timeoutMinutes * 60 * 1000,
    );

    const stuckEvents = await this.prisma.domainEvent.findMany({
      where: {
        status: EventStatus.PROCESSING,
        publishedAt: { lt: timeoutThreshold },
      },
    });

    for (const event of stuckEvents) {
      // Recovery: PROCESSING -> PENDING, increment attemptCount
      await this.prisma.domainEvent.update({
        where: { id: event.id },
        data: {
          status: EventStatus.PENDING,
          attemptCount: event.attemptCount + 1,
        },
      });

      this.logger.log(
        `Recovered DomainEvent ${event.id} (correlationId: ${event.correlationId}) from stuck PROCESSING state.`,
      );

      const companyId = (event.payload as any)?.companyId;
      if (companyId) {
        await this.prisma.securityEvent.create({
          data: {
            eventType: 'EVENT_PROCESSING_RECOVERED',
            severity: 'warning',
            description: `Recovered DomainEvent ${event.id} from stuck PROCESSING state.`,
            companyId,
          },
        });
      }
    }
  }

  private async recoverProcessedEvents() {
    const timeoutThreshold = new Date(
      Date.now() - this.timeoutMinutes * 60 * 1000,
    );

    const stuckProcessedEvents = await this.prisma.processedEvent.findMany({
      where: {
        status: ProcessedEventStatus.PROCESSING,
        processedAt: { lt: timeoutThreshold },
      },
    });

    for (const processedEvent of stuckProcessedEvents) {
      // Find correlation id for logging
      const domainEvent = await this.prisma.domainEvent.findUnique({
        where: { id: processedEvent.eventId },
      });
      const correlationId = domainEvent?.correlationId || 'unknown';

      // Recovery: PROCESSING -> FAILED, increment retryCount, set nextRetryAt = now()
      await this.prisma.processedEvent.update({
        where: {
          eventId_handlerName: {
            eventId: processedEvent.eventId,
            handlerName: processedEvent.handlerName,
          },
        },
        data: {
          status: ProcessedEventStatus.FAILED,
          retryCount: processedEvent.retryCount + 1,
          nextRetryAt: new Date(),
        },
      });

      this.logger.log(
        `Recovered ProcessedEvent handler ${processedEvent.handlerName} for event ${processedEvent.eventId} (correlationId: ${correlationId}) from stuck PROCESSING state.`,
      );

      const companyId = (domainEvent?.payload as any)?.companyId;
      if (companyId) {
        await this.prisma.securityEvent.create({
          data: {
            eventType: 'EVENT_HANDLER_PROCESSING_RECOVERED',
            severity: 'warning',
            description: `Recovered ProcessedEvent handler ${processedEvent.handlerName} for event ${processedEvent.eventId} from stuck PROCESSING state.`,
            companyId,
          },
        });
      }
    }
  }
}
