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
exports.LeaveAllocationsController = void 0;
const common_1 = require("@nestjs/common");
const leave_allocations_service_1 = require("./leave-allocations.service");
const create_leave_allocation_dto_1 = require("./dto/create-leave-allocation.dto");
const update_leave_allocation_dto_1 = require("./dto/update-leave-allocation.dto");
const query_leave_allocation_dto_1 = require("./dto/query-leave-allocation.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const permissions_1 = require("../../../common/auth/permissions");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const idempotency_decorator_1 = require("../../../common/decorators/idempotency.decorator");
let LeaveAllocationsController = class LeaveAllocationsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async create(dto, companyId) {
        return this.service.create(dto, companyId);
    }
    async findAll(query, companyId) {
        return this.service.findAll(query, companyId);
    }
    async myBalance(employeeId, companyId) {
        return this.service.findEmployeeBalance(employeeId, companyId);
    }
    async employeeBalance(employeeId, companyId) {
        return this.service.findEmployeeBalance(employeeId, companyId);
    }
    async findOne(id, companyId) {
        return this.service.findOne(id, companyId);
    }
    async update(id, dto, companyId) {
        return this.service.update(id, dto, companyId);
    }
    async remove(id, companyId) {
        return this.service.remove(id, companyId);
    }
};
exports.LeaveAllocationsController = LeaveAllocationsController;
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_leave_allocation_dto_1.CreateLeaveAllocationDto, String]),
    __metadata("design:returntype", Promise)
], LeaveAllocationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_leave_allocation_dto_1.QueryLeaveAllocationDto, String]),
    __metadata("design:returntype", Promise)
], LeaveAllocationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my-balance'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_READ),
    __param(0, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LeaveAllocationsController.prototype, "myBalance", null);
__decorate([
    (0, common_1.Get)('employee/:employeeId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_READ),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LeaveAllocationsController.prototype, "employeeBalance", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LeaveAllocationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_leave_allocation_dto_1.UpdateLeaveAllocationDto, String]),
    __metadata("design:returntype", Promise)
], LeaveAllocationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAVE_APPROVE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LeaveAllocationsController.prototype, "remove", null);
exports.LeaveAllocationsController = LeaveAllocationsController = __decorate([
    (0, common_1.Controller)('leave-allocations'),
    __metadata("design:paramtypes", [leave_allocations_service_1.LeaveAllocationsService])
], LeaveAllocationsController);
//# sourceMappingURL=leave-allocations.controller.js.map