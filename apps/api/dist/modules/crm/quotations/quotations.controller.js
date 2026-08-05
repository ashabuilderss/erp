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
exports.QuotationsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const permissions_1 = require("../../../common/auth/permissions");
const client_1 = require("@prisma/client");
const quotations_service_1 = require("./quotations.service");
const create_quotation_dto_1 = require("./dto/create-quotation.dto");
const query_quotation_dto_1 = require("./dto/query-quotation.dto");
const update_quotation_status_dto_1 = require("./dto/update-quotation-status.dto");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const idempotency_decorator_1 = require("../../../common/decorators/idempotency.decorator");
let QuotationsController = class QuotationsController {
    quotationsService;
    constructor(quotationsService) {
        this.quotationsService = quotationsService;
    }
    async create(companyId, employeeId, dto) {
        return await this.quotationsService.create(companyId, employeeId, dto);
    }
    async findAll(companyId, query) {
        return await this.quotationsService.findAll(companyId, query);
    }
    async findOne(id, companyId, req) {
        return await this.quotationsService.findOne(companyId, id, req.user.id, req.ip, req.headers['user-agent']);
    }
    async updateStatus(id, companyId, dto) {
        return await this.quotationsService.updateStatus(companyId, id, dto);
    }
    async downloadPdf(id, companyId, req, res) {
        const pdfBuffer = await this.quotationsService.downloadPdf(companyId, id, req.user.id, req.user.email, req.ip, req.headers['user-agent']);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="quotation-${id}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
    async getAccessLogs(id, companyId) {
        return await this.quotationsService.getAccessLogs(companyId, id);
    }
};
exports.QuotationsController = QuotationsController;
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.QUOTATION_CREATE),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_quotation_dto_1.CreateQuotationDto]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.QUOTATION_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_quotation_dto_1.QueryQuotationDto]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.QUOTATION_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.QUOTATION_UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_quotation_status_dto_1.UpdateQuotationStatusDto]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.QUOTATION_DOWNLOAD),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Get)(':id/access-logs'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.QUOTATION_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "getAccessLogs", null);
exports.QuotationsController = QuotationsController = __decorate([
    (0, common_1.Controller)('quotations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [quotations_service_1.QuotationsService])
], QuotationsController);
//# sourceMappingURL=quotations.controller.js.map