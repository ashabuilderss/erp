import { Module } from '@nestjs/common';
import { AssignmentsModule } from './assignments/assignments.module';
import { PerformanceModule } from './performance/performance.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [AssignmentsModule, PerformanceModule, AnalyticsModule],
})
export class EmsModule {}
