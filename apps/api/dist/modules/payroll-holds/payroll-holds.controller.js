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
exports.PayrollHoldsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const client_1 = require("@prisma/client");
const hold_activation_listener_1 = require("./hold-activation.listener");
const hold_release_service_1 = require("./hold-release.service");
const payroll_holds_dto_1 = require("./dto/payroll-holds.dto");
const prisma_service_1 = require("../../config/prisma.service");
const idempotency_decorator_1 = require("../../common/decorators/idempotency.decorator");
let PayrollHoldsController = class PayrollHoldsController {
    activationListener;
    releaseService;
    prisma;
    constructor(activationListener, releaseService, prisma) {
        this.activationListener = activationListener;
        this.releaseService = releaseService;
        this.prisma = prisma;
    }
    async createEmergencyHold(req, dto) {
        return await this.activationListener.createEmergencyHold(req.user.companyId, req.user.id, dto);
    }
    async requestRelease(id, req, dto) {
        return await this.releaseService.requestRelease(req.user.companyId, id, req.user.id, dto);
    }
    async getHolds(req, employeeId) {
        return await this.prisma.payrollHold.findMany({
            where: {
                companyId: req.user.companyId,
                ...(employeeId ? { employeeId } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getHoldDetails(id, req) {
        return await this.prisma.payrollHold.findFirst({
            where: { id, companyId: req.user.companyId },
            include: { payrollHoldHistories: { orderBy: { createdAt: 'asc' } } },
        });
    }
};
exports.PayrollHoldsController = PayrollHoldsController;
__decorate([
    (0, common_1.Post)('emergency'),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PAYROLL_HOLD_CREATE),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payroll_holds_dto_1.CreateEmergencyHoldDto]),
    __metadata("design:returntype", Promise)
], PayrollHoldsController.prototype, "createEmergencyHold", null);
__decorate([
    (0, common_1.Post)(':id/release-request'),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PAYROLL_HOLD_RELEASE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, payroll_holds_dto_1.ReleaseHoldDto]),
    __metadata("design:returntype", Promise)
], PayrollHoldsController.prototype, "requestRelease", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PAYROLL_READ),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PayrollHoldsController.prototype, "getHolds", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PAYROLL_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayrollHoldsController.prototype, "getHoldDetails", null);
exports.PayrollHoldsController = PayrollHoldsController = __decorate([
    (0, common_1.Controller)('payroll-holds'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    __metadata("design:paramtypes", [hold_activation_listener_1.HoldActivationListener,
        hold_release_service_1.HoldReleaseService,
        prisma_service_1.PrismaService])
], PayrollHoldsController);
//# sourceMappingURL=payroll-holds.controller.js.map