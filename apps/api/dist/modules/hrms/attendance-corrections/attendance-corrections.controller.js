"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceCorrectionsController = void 0;
const common_1 = require("@nestjs/common");
const attendance_corrections_service_1 = require("./attendance-corrections.service");
const create_attendance_correction_dto_1 = require("./dto/create-attendance-correction.dto");
const query_attendance_correction_dto_1 = require("./dto/query-attendance-correction.dto");
const review_attendance_correction_dto_1 = require("./dto/review-attendance-correction.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const permissions_1 = require("../../../common/auth/permissions");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const cache_decorators_1 = require("../../../common/decorators/cache.decorators");
const idempotency_decorator_1 = require("../../../common/decorators/idempotency.decorator");
let AttendanceCorrectionsController = class AttendanceCorrectionsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async create(dto, employeeId, companyId) {
        return this.service.create(dto, employeeId, companyId);
    }
    async findAll(query, companyId) {
        return this.service.findAll(query, companyId);
    }
    async findMyCorrections(employeeId) {
        return this.service.findMyCorrections(employeeId);
    }
    async findOne(id, companyId) {
        return this.service.findOne(id, companyId);
    }
    async approve(id, dto, employeeId, companyId) {
        return this.service.approve(id, employeeId, companyId, dto.notes);
    }
    async reject(id, dto, employeeId, companyId) {
        return this.service.reject(id, employeeId, companyId, dto.notes);
    }
};
exports.AttendanceCorrectionsController = AttendanceCorrectionsController;
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_attendance_correction_dto_1.CreateAttendanceCorrectionDto, Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceCorrectionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_attendance_correction_dto_1.QueryAttendanceCorrectionDto, String]),
    __metadata("design:returntype", Promise)
], AttendanceCorrectionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_READ),
    __param(0, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceCorrectionsController.prototype, "findMyCorrections", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AttendanceCorrectionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_VERIFY),
    (0, cache_decorators_1.CacheInvalidateExtra)(['attendance-corrections', 'attendance']),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_attendance_correction_dto_1.ReviewAttendanceCorrectionDto, Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceCorrectionsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_VERIFY),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_attendance_correction_dto_1.ReviewAttendanceCorrectionDto, Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceCorrectionsController.prototype, "reject", null);
exports.AttendanceCorrectionsController = AttendanceCorrectionsController = __decorate([
    (0, common_1.Controller)('attendance-corrections'),
    __metadata("design:paramtypes", [attendance_corrections_service_1.AttendanceCorrectionsService])
], AttendanceCorrectionsController);
//# sourceMappingURL=attendance-corrections.controller.js.map