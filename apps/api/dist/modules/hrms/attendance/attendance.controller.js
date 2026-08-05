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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const permissions_1 = require("../../../common/auth/permissions");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const create_attendance_dto_1 = require("./dto/create-attendance.dto");
const update_attendance_dto_1 = require("./dto/update-attendance.dto");
const query_attendance_dto_1 = require("./dto/query-attendance.dto");
const punch_dto_1 = require("./dto/punch.dto");
const idempotency_decorator_1 = require("../../../common/decorators/idempotency.decorator");
let AttendanceController = class AttendanceController {
    attendanceService;
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    async findAll(companyId, query) {
        return this.attendanceService.findAll(companyId, query);
    }
    async getTodayStats(companyId) {
        return this.attendanceService.getTodayStats(companyId);
    }
    async getLast7Days(companyId) {
        return this.attendanceService.getLast7Days(companyId);
    }
    async getMyAttendance(employeeId, companyId) {
        if (!employeeId) {
            throw new common_1.BadRequestException('No employee record linked to your account');
        }
        return this.attendanceService.getMyAttendance(employeeId, companyId);
    }
    async getNonce(employeeId, companyId) {
        if (!employeeId) {
            throw new common_1.BadRequestException('No employee record linked to your account');
        }
        return this.attendanceService.generateNonce(employeeId, companyId);
    }
    async findOne(companyId, id) {
        return this.attendanceService.findOne(companyId, id);
    }
    async createManual(companyId, dto) {
        return this.attendanceService.createManual(companyId, dto);
    }
    async update(companyId, id, dto) {
        return this.attendanceService.update(companyId, id, dto);
    }
    async remove(companyId, id) {
        return this.attendanceService.remove(companyId, id);
    }
    async checkIn(employeeId, companyId, body, req) {
        if (!employeeId) {
            throw new common_1.BadRequestException('No employee record linked to your account');
        }
        const ipAddress = req.headers['x-forwarded-for']
            ?.split(',')[0]
            ?.trim() ?? req.socket.remoteAddress;
        return this.attendanceService.punch(employeeId, companyId, {
            punchType: 'IN',
            latitude: body.latitude,
            longitude: body.longitude,
            photoUrl: body.checkInPhoto,
            nonce: body.nonce,
        }, ipAddress);
    }
    async checkOut(employeeId, companyId, body, req) {
        if (!employeeId) {
            throw new common_1.BadRequestException('No employee record linked to your account');
        }
        const ipAddress = req.headers['x-forwarded-for']
            ?.split(',')[0]
            ?.trim() ?? req.socket.remoteAddress;
        return this.attendanceService.punch(employeeId, companyId, {
            punchType: 'OUT',
            latitude: body.latitude,
            longitude: body.longitude,
            photoUrl: body.checkOutPhoto,
            nonce: body.nonce,
        }, ipAddress);
    }
    async verify(companyId, id) {
        return this.attendanceService.verify(companyId, id);
    }
    async punch(body, employeeId, companyId, req) {
        if (!employeeId) {
            throw new common_1.BadRequestException('No employee record linked to your account');
        }
        const ipAddress = req.headers['x-forwarded-for']
            ?.split(',')[0]
            ?.trim() ?? req.socket.remoteAddress;
        return this.attendanceService.punch(employeeId, companyId, body, ipAddress);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_attendance_dto_1.QueryAttendanceDto]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('today'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getTodayStats", null);
__decorate([
    (0, common_1.Get)('last-7-days'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getLast7Days", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_READ),
    __param(0, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getMyAttendance", null);
__decorate([
    (0, common_1.Get)('nonce/generate'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_CREATE),
    __param(0, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getNonce", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_CREATE),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_attendance_dto_1.CreateAttendanceDto]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "createManual", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_VERIFY),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_attendance_dto_1.UpdateAttendanceDto]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_VERIFY),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('me/check-in'),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_CREATE),
    __param(0, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, punch_dto_1.CheckInDto, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Post)('me/check-out'),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_CREATE),
    __param(0, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, punch_dto_1.CheckOutDto, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "checkOut", null);
__decorate([
    (0, common_1.Post)(':id/verify'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_VERIFY),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)('punch'),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [punch_dto_1.PunchDto, Object, String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "punch", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)('attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map