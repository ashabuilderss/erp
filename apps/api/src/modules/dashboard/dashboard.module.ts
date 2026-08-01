import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { OwnerDashboardService } from './owner-dashboard.service';
import { DashboardMetricsListener } from './dashboard-metrics.listener';
import { DashboardApprovalProjector } from './projectors/dashboard-approval.projector';
import { DashboardTaskProjector } from './projectors/dashboard-task.projector';
import { DashboardWarningProjector } from './projectors/dashboard-warning.projector';
import { DashboardPayrollHoldProjector } from './projectors/dashboard-payroll-hold.projector';
import { DashboardPerformanceProjector } from './projectors/dashboard-performance.projector';
import { DashboardCrmProjector } from './projectors/dashboard-crm.projector';
import { DashboardAlertProjector } from './projectors/dashboard-alert.projector';

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    OwnerDashboardService,
    DashboardMetricsListener,
    DashboardApprovalProjector,
    DashboardTaskProjector,
    DashboardWarningProjector,
    DashboardPayrollHoldProjector,
    DashboardPerformanceProjector,
    DashboardCrmProjector,
    DashboardAlertProjector,
  ],
  exports: [DashboardService, OwnerDashboardService],
})
export class DashboardModule {}
