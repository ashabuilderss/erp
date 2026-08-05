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
exports.ApprovalsController = void 0;
const common_1 = require("@nestjs/common");
const approvals_runtime_service_1 = require("./approvals-runtime.service");
const approvals_spawning_service_1 = require("./approvals-spawning.service");
const approvals_dto_1 = require("./dto/approvals.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
let ApprovalsController = class ApprovalsController {
    runtimeService;
    spawningService;
    prisma;
    constructor(runtimeService, spawningService, prisma) {
        this.runtimeService = runtimeService;
        this.spawningService = spawningService;
        this.prisma = prisma;
    }
    async getPendingApprovals(req) {
        const userId = req.user.id;
        const companyId = req.user.companyId;
        const employee = await this.prisma.employee.findFirst({
            where: { userId },
        });
        let delegatorUserIds = [];
        if (employee) {
            const now = new Date();
            const delegations = await this.prisma.delegation.findMany({
                where: {
                    delegateId: employee.id,
                    isActive: true,
                    validFrom: { lte: now },
                    validTo: { gte: now },
                },
                include: { employeesDelegationsDelegatorIdToemployees: true },
            });
            delegatorUserIds = delegations
                .map((d) => d.employeesDelegationsDelegatorIdToemployees.userId)
                .filter((id) => id !== null);
        }
        const targetUserIds = [userId, ...delegatorUserIds];
        return await this.prisma.approvalRequest.findMany({
            where: {
                companyId,
                status: { in: [client_1.ApprovalStatus.PENDING, client_1.ApprovalStatus.ESCALATED] },
                approvalSteps: {
                    some: {
                        status: client_1.ApprovalStatus.PENDING,
                        requiredUserId: { in: targetUserIds },
                    },
                },
            },
            include: {
                approvalSteps: {
                    where: { status: client_1.ApprovalStatus.PENDING },
                },
            },
        });
    }
    async createTemplate(req, dto) {
        return await this.prisma.approvalTemplate.create({
            data: {
                companyId: req.user.companyId,
                entityType: dto.entityType,
                description: dto.description,
                approvalTemplateSteps: {
                    create: dto.steps.map((s, index) => ({
                        companyId: req.user.companyId,
                        sequence: index + 1,
                        requiredRoleId: s.requiredRoleId,
                        requiredUserId: s.requiredUserId,
                        isDirectManager: s.isDirectManager || false,
                        slaHours: s.slaHours || 24,
                    })),
                },
            },
        });
    }
    async approve(id, req, dto) {
        return await this.runtimeService.approveStep(id, req.user.id, dto.comments);
    }
    async reject(id, req, dto) {
        return await this.runtimeService.rejectStep(id, req.user.id, dto.comments);
    }
    async override(id, req, dto) {
        return await this.runtimeService.overrideRequest(id, req.user.id, dto.reason);
    }
};
exports.ApprovalsController = ApprovalsController;
__decorate([
    (0, common_1.Get)('pending'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.APPROVAL_READ),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "getPendingApprovals", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.APPROVAL_MANAGE),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, approvals_dto_1.CreateApprovalTemplateDto]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.APPROVAL_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, approvals_dto_1.ActionApprovalDto]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.APPROVAL_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, approvals_dto_1.ActionApprovalDto]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/override'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.APPROVAL_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, approvals_dto_1.OverrideApprovalDto]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "override", null);
exports.ApprovalsController = ApprovalsController = __decorate([
    (0, common_1.Controller)('approvals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [approvals_runtime_service_1.ApprovalsRuntimeService,
        approvals_spawning_service_1.ApprovalsSpawningService,
        prisma_service_1.PrismaService])
], ApprovalsController);
//# sourceMappingURL=approvals.controller.js.map