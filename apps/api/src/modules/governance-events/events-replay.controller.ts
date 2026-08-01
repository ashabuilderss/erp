import {
  Controller,
  Post,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, EventStatus } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

@Controller('internal/events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsReplayController {
  private readonly logger = new Logger(EventsReplayController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post(':id/replay')
  @Roles(UserRole.OWNER)
  async replayEvent(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const event = await this.prisma.domainEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (
      event.status !== EventStatus.FAILED &&
      event.status !== EventStatus.DEAD_LETTER
    ) {
      throw new BadRequestException(
        'Only FAILED or DEAD_LETTER events can be replayed',
      );
    }

    // Record replay audit log (we can store this in security events or activity logs)
    await this.prisma.securityEvent.create({
      data: {
        eventType: 'EVENT_REPLAYED',
        severity: 'warning',
        userId: req.user.id,
        companyId: req.user.companyId,
        description: `Event ${id} (${event.correlationId}) replayed by ${req.user.id}`,
      },
    });

    // Requeue event
    await this.prisma.domainEvent.update({
      where: { id },
      data: {
        status: EventStatus.PENDING,
        attemptCount: 0,
        lastError: null,
      },
    });

    return { success: true, message: 'Event successfully requeued' };
  }

  @Post('handlers/:eventId/:handlerName/replay')
  @Roles(UserRole.OWNER)
  async replayHandler(
    @Param('eventId') eventId: string,
    @Param('handlerName') handlerName: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const processedEvent = await this.prisma.processedEvent.findUnique({
      where: { eventId_handlerName: { eventId, handlerName } },
    });

    if (!processedEvent) {
      throw new NotFoundException('Processed event not found');
    }

    if (
      processedEvent.status !== 'FAILED' &&
      processedEvent.status !== 'DEAD_LETTER'
    ) {
      throw new BadRequestException(
        'Only FAILED or DEAD_LETTER handlers can be replayed',
      );
    }

    const domainEvent = await this.prisma.domainEvent.findUnique({
      where: { id: eventId },
    });

    if (!domainEvent) {
      throw new NotFoundException('Original DomainEvent not found');
    }

    // 3. Reset state
    await this.prisma.processedEvent.update({
      where: { eventId_handlerName: { eventId, handlerName } },
      data: {
        status: 'FAILED', // ProcessedEventRetryWorker will pick this up, but we also emit here.
        retryCount: 0,
        lastError: null,
        nextRetryAt: new Date(),
      },
    });

    // 5. Write audit event
    await this.prisma.securityEvent.create({
      data: {
        eventType: 'EVENT_HANDLER_REPLAYED',
        severity: 'warning',
        userId: req.user.id,
        companyId: req.user.companyId,
        description: JSON.stringify({
          eventId,
          handlerName,
          actorId: req.user.id,
          correlationId: domainEvent.correlationId,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    this.logger.log(
      `Handler replay requested: ${handlerName} for event ${eventId} (correlationId: ${domainEvent.correlationId})`,
    );

    // 4. Emit handler execution again (or let the ProcessedEventRetryWorker pick it up, but instruction says "Emit handler execution again")
    // Wait, EventsReplayController doesn't have eventEmitter injected! I should inject it.
    // I will inject EventEmitter2.
    this.eventEmitter.emit(domainEvent.eventType, domainEvent);

    return { success: true, message: 'Handler replay initiated successfully' };
  }
}
