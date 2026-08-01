import { Module } from '@nestjs/common';
import { PerformanceEngine } from './performance.engine';
import { PerformanceService } from './performance.service';
import { PerformanceProjector } from './performance.projector';
import { PerformanceScoreController } from './performance.controller';
import { GovernanceEventsModule } from '../governance-events/governance-events.module';

@Module({
  imports: [GovernanceEventsModule],
  controllers: [PerformanceScoreController],
  providers: [PerformanceEngine, PerformanceService, PerformanceProjector],
  exports: [PerformanceService, PerformanceEngine],
})
export class PerformanceScoreModule {}
