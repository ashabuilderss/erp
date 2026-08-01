import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { WarningsService } from './warnings.service';
import { DomainEventTypes } from '../governance-events/types/events';
import { WarningSeverity, WarningCategory } from '@prisma/client';

@Injectable()
export class TaskOverdueListener {
  private readonly logger = new Logger(TaskOverdueListener.name);

  constructor(private readonly warningsService: WarningsService) {}

  @OnEvent(DomainEventTypes.TASK_OVERDUE)
  async handleTaskOverdue(event: DomainEvent) {
    this.logger.log(`Processing TASK_OVERDUE for Task ID ${event.entityId}`);
    try {
      const payload: any = event.payload;
      const severity = this.mapEscalationToSeverity(payload.escalationLevel);

      await this.warningsService.issueWarning(
        payload.companyId,
        'SYSTEM',
        {
          employeeId: payload.assigneeId,
          severity,
          category: WarningCategory.TASK_PERFORMANCE,
          reason: `Task ${payload.taskId} SLA breached (Escalation Level: ${payload.escalationLevel})`,
          isSystemGenerated: true,
        }
      );
      this.logger.log(`Issued ${severity} warning for Task ID ${event.entityId} (escalation level ${payload.escalationLevel})`);
    } catch (error) {
      this.logger.error(`Failed to issue warning for TASK_OVERDUE: ${error.message}`);
    }
  }

  private mapEscalationToSeverity(escalationLevel: number): WarningSeverity {
    if (escalationLevel >= 4) return WarningSeverity.LEVEL_3_FINAL;
    if (escalationLevel >= 3) return WarningSeverity.LEVEL_2_WRITTEN;
    return WarningSeverity.LEVEL_1_VERBAL;
  }
}
