import { Module } from '@nestjs/common';
import { AssignmentsModule } from './assignments/assignments.module';
import { PerformanceModule } from './performance/performance.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TaskCommentsModule } from './task-comments/task-comments.module';

@Module({
  imports: [
    AssignmentsModule,
    PerformanceModule,
    AnalyticsModule,
    TaskCommentsModule,
  ],
})
export class EmsModule {}
