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
exports.PortalsController = void 0;
const common_1 = require("@nestjs/common");
const portals_service_1 = require("./portals.service");
const dto_1 = require("./dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const idempotency_decorator_1 = require("../../common/decorators/idempotency.decorator");
let PortalsController = class PortalsController {
    portalsService;
    constructor(portalsService) {
        this.portalsService = portalsService;
    }
    async createComplaint(dto, companyId) {
        return this.portalsService.createComplaint(dto, companyId);
    }
    async findAllComplaints(query, companyId) {
        return this.portalsService.findAllComplaints(query, companyId);
    }
    async findOneComplaint(id, companyId) {
        return this.portalsService.findOneComplaint(id, companyId);
    }
    async updateComplaint(id, dto, companyId) {
        return this.portalsService.updateComplaint(id, dto, companyId);
    }
    async deleteComplaint(id, companyId) {
        return this.portalsService.deleteComplaint(id, companyId);
    }
    async resolveComplaint(id, dto, companyId) {
        return this.portalsService.resolveComplaint(id, dto.resolution, companyId);
    }
};
exports.PortalsController = PortalsController;
__decorate([
    (0, common_1.Post)('complaints'),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.COMPLAINT_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateComplaintDto, String]),
    __metadata("design:returntype", Promise)
], PortalsController.prototype, "createComplaint", null);
__decorate([
    (0, common_1.Get)('complaints'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.COMPLAINT_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryComplaintDto, String]),
    __metadata("design:returntype", Promise)
], PortalsController.prototype, "findAllComplaints", null);
__decorate([
    (0, common_1.Get)('complaints/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.COMPLAINT_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PortalsController.prototype, "findOneComplaint", null);
__decorate([
    (0, common_1.Patch)('complaints/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.COMPLAINT_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateComplaintDto, String]),
    __metadata("design:returntype", Promise)
], PortalsController.prototype, "updateComplaint", null);
__decorate([
    (0, common_1.Delete)('complaints/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.COMPLAINT_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PortalsController.prototype, "deleteComplaint", null);
__decorate([
    (0, common_1.Post)('complaints/:id/resolve'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.COMPLAINT_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ResolveComplaintDto, String]),
    __metadata("design:returntype", Promise)
], PortalsController.prototype, "resolveComplaint", null);
exports.PortalsController = PortalsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [portals_service_1.PortalsService])
], PortalsController);
//# sourceMappingURL=portals.controller.js.map