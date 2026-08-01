import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { DomainEventTypes } from '../types/events';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventPublisher } from '../governance-event.publisher';
import { WarningsService } from '../../warnings/warnings.service';
import { WarningCategory } from '@prisma/client';

@Injectable()
export class WarningEngineListener {
  private readonly logger = new Logger(WarningEngineListener.name);

  constructor(
    private readonly processor: GovernanceEventProcessor,
    private readonly prisma: PrismaService,
    private readonly publisher: GovernanceEventPublisher,
    private readonly warningsService: WarningsService,
  ) {}

  @OnEvent(DomainEventTypes.TASK_OVERDUE)
  async handleTaskOverdue(event: DomainEvent) {
    await this.processor.process(
      event,
      'WarningEngineListener_handleTaskOverdue',
      async () => {
        this.logger.log(
          `Processing TASK_OVERDUE for Task ID ${event.entityId}`,
        );

        const payload: any = event.payload;

        const severity = payload.escalationLevel >= 4
          ? 'LEVEL_3_FINAL'
          : payload.escalationLevel >= 3
            ? 'LEVEL_2_WRITTEN'
            : 'LEVEL_1_VERBAL';

        await this.warningsService.issueWarning(
          payload.companyId,
          'SYSTEM',
          {
            employeeId: payload.assigneeId,
            severity: severity as any,
            category: WarningCategory.TASK_PERFORMANCE,
            reason: `Task ${payload.taskId} SLA breached (Escalation Level: ${payload.escalationLevel})`,
            isSystemGenerated: true,
          },
        );

        this.logger.log(
          `Issued ${severity} warning for assignee ${payload.assigneeId} (escalation level: ${payload.escalationLevel})`,
        );
      },
    );
  }
}
