import { Module } from '@nestjs/common';
import { EscalationRulesController } from './escalation-rules.controller';
import { EscalationRulesService } from './escalation-rules.service';
import { EscalationEventsController } from './escalation-events.controller';
import { EscalationEventsService } from './escalation-events.service';

@Module({
  controllers: [EscalationRulesController, EscalationEventsController],
  providers: [EscalationRulesService, EscalationEventsService],
})
export class EscalationModule {}
