"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HrmsModule = void 0;
const common_1 = require("@nestjs/common");
const departments_module_1 = require("./departments/departments.module");
const designations_module_1 = require("./designations/designations.module");
const employees_module_1 = require("./employees/employees.module");
const attendance_module_1 = require("./attendance/attendance.module");
const leave_requests_module_1 = require("./leave-requests/leave-requests.module");
const leave_allocations_module_1 = require("./leave-allocations/leave-allocations.module");
const device_registrations_module_1 = require("./device-registrations/device-registrations.module");
const attendance_corrections_module_1 = require("./attendance-corrections/attendance-corrections.module");
const evidence_review_module_1 = require("./attendance-evidence-review/evidence-review.module");
const payroll_module_1 = require("./payroll/payroll.module");
let HrmsModule = class HrmsModule {
};
exports.HrmsModule = HrmsModule;
exports.HrmsModule = HrmsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            departments_module_1.DepartmentsModule,
            designations_module_1.DesignationsModule,
            employees_module_1.EmployeesModule,
            attendance_module_1.AttendanceModule,
            leave_requests_module_1.LeaveRequestsModule,
            leave_allocations_module_1.LeaveAllocationsModule,
            device_registrations_module_1.DeviceRegistrationsModule,
            attendance_corrections_module_1.AttendanceCorrectionsModule,
            evidence_review_module_1.EvidenceReviewModule,
            payroll_module_1.PayrollModule,
        ],
    })
], HrmsModule);
//# sourceMappingURL=hrms.module.js.map