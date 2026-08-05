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
exports.DocumentController = void 0;
const common_1 = require("@nestjs/common");
const document_registry_service_1 = require("./document-registry.service");
const document_access_service_1 = require("./document-access.service");
const document_dto_1 = require("./dto/document.dto");
const query_document_dto_1 = require("./dto/query-document.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const idempotency_decorator_1 = require("../../common/decorators/idempotency.decorator");
let DocumentController = class DocumentController {
    documentRegistryService;
    accessService;
    constructor(documentRegistryService, accessService) {
        this.documentRegistryService = documentRegistryService;
        this.accessService = accessService;
    }
    async register(dto, companyId, userId) {
        const id = await this.documentRegistryService.register({
            companyId,
            name: dto.name,
            fileType: dto.fileType,
            fileSize: dto.fileSize,
            category: dto.category,
            storageObjectId: dto.storageObjectId,
            uploadedById: userId,
            accessLevel: dto.accessLevel,
        });
        return this.documentRegistryService.getDocument(id, companyId);
    }
    async logAccess(dto, companyId, userId) {
        const id = await this.accessService.logAccess({
            companyId,
            documentId: dto.documentId,
            userId,
            action: dto.action,
        });
        return { id };
    }
    async list(companyId, query) {
        return this.documentRegistryService.listDocuments(companyId, {
            page: query.page,
            limit: query.limit,
            category: query.category,
        });
    }
    async getOne(id, companyId) {
        return this.documentRegistryService.getDocument(id, companyId);
    }
    async getAccessLogs(id, companyId, query) {
        return this.accessService.getAccessLogs(id, companyId, {
            page: query.page,
            limit: query.limit,
        });
    }
    async getAccessStats(id, companyId) {
        return this.accessService.getAccessStats(id, companyId);
    }
    async delete(id, companyId, userId) {
        await this.documentRegistryService.delete({
            companyId,
            documentId: id,
            userId,
        });
        return { success: true };
    }
};
exports.DocumentController = DocumentController;
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.DOCUMENT_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [document_dto_1.RegisterDocumentDto, String, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('access'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.DOCUMENT_READ),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [document_dto_1.LogDocumentAccessDto, String, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "logAccess", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.ACCOUNTS, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.DOCUMENT_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_document_dto_1.QueryDocumentDto]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.ACCOUNTS, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.DOCUMENT_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "getOne", null);
__decorate([
    (0, common_1.Get)(':id/access-logs'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.ACCOUNTS, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.DOCUMENT_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, query_document_dto_1.QueryAccessLogDto]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "getAccessLogs", null);
__decorate([
    (0, common_1.Get)(':id/access-stats'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.ACCOUNTS, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.DOCUMENT_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "getAccessStats", null);
__decorate([
    (0, common_1.Post)(':id/delete'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.DOCUMENT_DELETE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "delete", null);
exports.DocumentController = DocumentController = __decorate([
    (0, common_1.Controller)('documents'),
    __metadata("design:paramtypes", [document_registry_service_1.DocumentRegistryService,
        document_access_service_1.DocumentAccessService])
], DocumentController);
//# sourceMappingURL=document.controller.js.map