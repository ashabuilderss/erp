import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { HoldRecommendationService } from './hold-recommendation.service';
import { DomainEventTypes } from '../governance-events/types/events';
import { PayrollHoldType } from '@prisma/client';

@Injectable()
export class WarningThresholdBreachedListener {
  private readonly logger = new Logger(WarningThresholdBreachedListener.name);

  constructor(private readonly recommendationService: HoldRecommendationService) {}

  @OnEvent(DomainEventTypes.WARNING_THRESHOLD_BREACHED)
  async handleWarningThresholdBreached(event: DomainEvent) {
    this.logger.log(`Processing WARNING_THRESHOLD_BREACHED for Employee ID ${event.entityId}`);
    try {
      const payload: any = event.payload;
      
      // Recommend a payroll hold due to warning threshold breach
      await this.recommendationService.createRecommendation(
        payload.companyId,
        null, // System generated
        {
          employeeId: payload.employeeId,
          source: 'WARNING_ENGINE',
          sourceId: payload.warningId,
          holdType: PayrollHoldType.FULL_HOLD,
          reason: payload.reason || 'Disciplinary review threshold breached',
        }
      );
      this.logger.log(`Recommended payroll hold for Employee ID ${event.entityId}`);
    } catch (error) {
      this.logger.error(`Failed to recommend hold for WARNING_THRESHOLD_BREACHED: ${error.message}`);
    }
  }
}
