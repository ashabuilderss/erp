"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceCorrectionsModule = void 0;
const common_1 = require("@nestjs/common");
const attendance_corrections_service_1 = require("./attendance-corrections.service");
const attendance_corrections_controller_1 = require("./attendance-corrections.controller");
const approvals_module_1 = require("../../approvals/approvals.module");
const attendance_module_1 = require("../attendance/attendance.module");
const employees_module_1 = require("../employees/employees.module");
let AttendanceCorrectionsModule = class AttendanceCorrectionsModule {
};
exports.AttendanceCorrectionsModule = AttendanceCorrectionsModule;
exports.AttendanceCorrectionsModule = AttendanceCorrectionsModule = __decorate([
    (0, common_1.Module)({
        imports: [approvals_module_1.ApprovalsModule, attendance_module_1.AttendanceModule, employees_module_1.EmployeesModule],
        controllers: [attendance_corrections_controller_1.AttendanceCorrectionsController],
        providers: [attendance_corrections_service_1.AttendanceCorrectionsService],
        exports: [attendance_corrections_service_1.AttendanceCorrectionsService],
    })
], AttendanceCorrectionsModule);
//# sourceMappingURL=attendance-corrections.module.js.map