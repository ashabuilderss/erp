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
exports.LeaveRequestsController = void 0;
const common_1 = require("@nestjs/common");
const leave_requests_service_1 = require("./leave-requests.service");
const create_leave_request_dto_1 = require("./dto/create-leave-request.dto");
const update_leave_request_dto_1 = require("./dto/update-leave-request.dto");
const approve_leave_request_dto_1 = require("./dto/approve-leave-request.dto");
const query_leave_request_dto_1 = require("./dto/query-leave-request.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const permissions_1 = require("../../../common/auth/permissions");
const client_1 = require("@prisma/client");
const cache_decorators_1 = require("../../../common/decorators/cache.decorators");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const idempotency_decorator_1 = require("../../../common/decorators/idempotency.decorator");
const role_scope_util_1 = require("../../../common/utils/role-scope.util");
let LeaveRequestsController = class LeaveRequestsController {
    leaveRequestsService;
    constructor(leaveRequestsService) {
        this.leaveRequestsService = leaveRequestsService;
    }
    async getMyLeaveRequests(query, employeeId, companyId) {
        return this.leaveRequestsService.findAll(query, companyId, employeeId);
    }
    async createMyLeaveRequest(dto, employeeId, companyId) {
        return this.leaveRequestsService.createMyLeaveRequest(dto, employeeId, companyId);
    }
    async create(dto, companyId, employeeId, role) {
        return this.leaveRequestsService.create(dto, companyId, (0, role_scope_util_1.getScopedEmployeeId)(role, employeeId));
    }
    async findAll(query, companyId, employeeId, role) {
        return this.leaveRequestsService.findAll(query, companyId, (0, role_scope_util_1.getScopedEmployeeId)(role, employeeId));
    }
    async getPendingCount(companyId, employeeId, role) {
        return this.leaveRequestsService.getPendingCount(companyId, (0, role_scope_util_1.getScopedEmployeeId)(role, employeeId));
    }
    async findOne(id, companyId, employeeId, role) {
        const owningEmployeeId = (0, role_scope_util_1.getScopedEmployeeId)(role, employeeId);
        return this.leaveRequestsService.findOne(id, companyId, owningEmployeeId);
    }
    async update(id, dto, companyId, employeeId, role) {
        return this.leaveRequestsService.update(id, dto, companyId, (0, role_scope_util_1.getScopedEmployeeId)(role, employeeId));
    }
    async approve(id, dto, userId, companyId, userRole) {
        return this.leaveRequestsService.approve(id, dto, userId, companyId, userRole);
    }
    async remove(id, companyId) {
        return this.leaveRequestsService.remove(id, companyId);
    }
};
exports.LeaveRequestsController = LeaveRequestsController;
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_leave_request_dto_1.QueryLeaveRequestDto, Object, String]),
    __metadata("design:returntype", Promise)
], LeaveRequestsController.prototype, "getMyLeaveRequests", null);
__decorate([
    (0, common_1.Post)('me'),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_leave_request_dto_1.CreateLeaveRequestDto, Object, String]),
    __metadata("design:returntype", Promise)
], LeaveRequestsController.prototype, "createMyLeaveRequest", null);
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_leave_request_dto_1.CreateLeaveRequestDto, String, Object, String]),
    __metadata("design:returntype", Promise)
], LeaveRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_leave_request_dto_1.QueryLeaveRequestDto, String, Object, String]),
    __metadata("design:returntype", Promise)
], LeaveRequestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('pending-count'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], LeaveRequestsController.prototype, "getPendingCount", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String]),
    __metadata("design:returntype", Promise)
], LeaveRequestsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(3, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_leave_request_dto_1.UpdateLeaveRequestDto, String, Object, String]),
    __metadata("design:returntype", Promise)
], LeaveRequestsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_APPROVE),
    (0, cache_decorators_1.CacheInvalidateExtra)(['leave-requests', 'leave-allocations']),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(4, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approve_leave_request_dto_1.ApproveLeaveRequestDto, String, String, String]),
    __metadata("design:returntype", Promise)
], LeaveRequestsController.prototype, "approve", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_APPROVE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LeaveRequestsController.prototype, "remove", null);
exports.LeaveRequestsController = LeaveRequestsController = __decorate([
    (0, common_1.Controller)('leave-requests'),
    __metadata("design:paramtypes", [leave_requests_service_1.LeaveRequestsService])
], LeaveRequestsController);
//# sourceMappingURL=leave-requests.controller.js.map