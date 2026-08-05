"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceModule = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const attendance_controller_1 = require("./attendance.controller");
const attendance_policy_engine_1 = require("./attendance-policy.engine");
const attendance_finalization_service_1 = require("./attendance-finalization.service");
const attendance_history_service_1 = require("./attendance-history.service");
const attendance_summary_projector_1 = require("./projectors/attendance-summary.projector");
const payroll_attendance_snapshot_projector_1 = require("./projectors/payroll-attendance-snapshot.projector");
const dashboard_metrics_projector_1 = require("./projectors/dashboard-metrics.projector");
const projection_replay_service_1 = require("./projection-replay.service");
const employees_module_1 = require("../employees/employees.module");
const leave_requests_module_1 = require("../leave-requests/leave-requests.module");
let AttendanceModule = class AttendanceModule {
};
exports.AttendanceModule = AttendanceModule;
exports.AttendanceModule = AttendanceModule = __decorate([
    (0, common_1.Module)({
        imports: [employees_module_1.EmployeesModule, leave_requests_module_1.LeaveRequestsModule],
        controllers: [attendance_controller_1.AttendanceController],
        providers: [
            attendance_service_1.AttendanceService,
            attendance_policy_engine_1.AttendancePolicyEngine,
            attendance_finalization_service_1.AttendanceFinalizationService,
            attendance_history_service_1.AttendanceHistoryService,
            attendance_summary_projector_1.AttendanceSummaryProjector,
            payroll_attendance_snapshot_projector_1.PayrollAttendanceSnapshotProjector,
            dashboard_metrics_projector_1.DashboardMetricsProjector,
            projection_replay_service_1.ReplayOrchestrationService,
            projection_replay_service_1.ProjectionHealthMonitor,
        ],
        exports: [
            attendance_service_1.AttendanceService,
            attendance_policy_engine_1.AttendancePolicyEngine,
            attendance_finalization_service_1.AttendanceFinalizationService,
            attendance_history_service_1.AttendanceHistoryService,
            projection_replay_service_1.ReplayOrchestrationService,
            projection_replay_service_1.ProjectionHealthMonitor,
        ],
    })
], AttendanceModule);
//# sourceMappingURL=attendance.module.js.map