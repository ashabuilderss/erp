import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AttendancePolicyEngine } from './attendance-policy.engine';
import { AttendanceFinalizationService } from './attendance-finalization.service';
import { AttendanceHistoryService } from './attendance-history.service';
import { AttendanceSummaryProjector } from './projectors/attendance-summary.projector';
import { PayrollAttendanceSnapshotProjector } from './projectors/payroll-attendance-snapshot.projector';
import { DashboardMetricsProjector } from './projectors/dashboard-metrics.projector';
import {
  ProjectionHealthMonitor,
  ReplayOrchestrationService,
} from './projection-replay.service';
import { EmployeesModule } from '../employees/employees.module';
import { LeaveRequestsModule } from '../leave-requests/leave-requests.module';

@Module({
  imports: [EmployeesModule, LeaveRequestsModule],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    AttendancePolicyEngine,
    AttendanceFinalizationService,
    AttendanceHistoryService,
    AttendanceSummaryProjector,
    PayrollAttendanceSnapshotProjector,
    DashboardMetricsProjector,
    ReplayOrchestrationService,
    ProjectionHealthMonitor,
  ],
  exports: [
    AttendanceService,
    AttendancePolicyEngine,
    AttendanceFinalizationService,
    AttendanceHistoryService,
    ReplayOrchestrationService,
    ProjectionHealthMonitor,
  ],
})
export class AttendanceModule {}
