import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventStatus, ProcessedEventStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OutboxDispatchWorker {
  private readonly logger = new Logger(OutboxDispatchWorker.name);
  private isRunning = false;
  private readonly batchSize: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.batchSize =
      this.configService.get<number>('EVENT_DISPATCH_BATCH_SIZE') || 100;
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleOutbox() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      await this.processPendingEvents();
    } catch (error) {
      this.logger.error('Error in OutboxDispatchWorker', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async processPendingEvents() {
    // Find up to EVENT_DISPATCH_BATCH_SIZE pending events
    const pendingEvents = await this.prisma.domainEvent.findMany({
      where: { status: EventStatus.PENDING },
      take: this.batchSize,
      orderBy: { publishedAt: 'asc' },
    });

    for (const event of pendingEvents) {
      // Atomic claim to prevent double-dispatch in scaled environments
      const claimed = await this.prisma.domainEvent.updateMany({
        where: { id: event.id, status: EventStatus.PENDING },
        data: { status: EventStatus.PROCESSING },
      });

      if (claimed.count === 0) {
        // Event was claimed by another worker instance
        continue;
      }

      try {
        // Emit locally for handlers to pick up
        // Handlers will track their own success/failure in ProcessedEvent
        await this.eventEmitter.emitAsync(event.eventType, event);

        // Assume dispatch is complete (we don't wait for success of handlers to mark DISPATCHED,
        // because handlers handle their own retries using GovernanceEventProcessor)
        await this.prisma.domainEvent.update({
          where: { id: event.id },
          data: { status: EventStatus.DISPATCHED },
        });
      } catch (err: any) {
        this.logger.error(`Failed to dispatch event ${event.id}:`, err);

        const nextAttempt = event.attemptCount + 1;
        const newStatus =
          nextAttempt >= 3 ? EventStatus.DEAD_LETTER : EventStatus.FAILED;

        await this.prisma.domainEvent.update({
          where: { id: event.id },
          data: {
            status: newStatus,
            attemptCount: nextAttempt,
            lastError: err.message || String(err),
          },
        });
      }
    }
  }
}
