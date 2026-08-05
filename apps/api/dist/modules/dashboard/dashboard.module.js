"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const dashboard_controller_1 = require("./dashboard.controller");
const dashboard_service_1 = require("./dashboard.service");
const owner_dashboard_service_1 = require("./owner-dashboard.service");
const dashboard_metrics_listener_1 = require("./dashboard-metrics.listener");
const dashboard_approval_projector_1 = require("./projectors/dashboard-approval.projector");
const dashboard_task_projector_1 = require("./projectors/dashboard-task.projector");
const dashboard_warning_projector_1 = require("./projectors/dashboard-warning.projector");
const dashboard_payroll_hold_projector_1 = require("./projectors/dashboard-payroll-hold.projector");
const dashboard_performance_projector_1 = require("./projectors/dashboard-performance.projector");
const dashboard_crm_projector_1 = require("./projectors/dashboard-crm.projector");
const dashboard_alert_projector_1 = require("./projectors/dashboard-alert.projector");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        controllers: [dashboard_controller_1.DashboardController],
        providers: [
            dashboard_service_1.DashboardService,
            owner_dashboard_service_1.OwnerDashboardService,
            dashboard_metrics_listener_1.DashboardMetricsListener,
            dashboard_approval_projector_1.DashboardApprovalProjector,
            dashboard_task_projector_1.DashboardTaskProjector,
            dashboard_warning_projector_1.DashboardWarningProjector,
            dashboard_payroll_hold_projector_1.DashboardPayrollHoldProjector,
            dashboard_performance_projector_1.DashboardPerformanceProjector,
            dashboard_crm_projector_1.DashboardCrmProjector,
            dashboard_alert_projector_1.DashboardAlertProjector,
        ],
        exports: [dashboard_service_1.DashboardService, owner_dashboard_service_1.OwnerDashboardService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map