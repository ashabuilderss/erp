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
exports.AnnouncementController = void 0;
const common_1 = require("@nestjs/common");
const announcement_service_1 = require("./announcement.service");
const announcement_receipt_service_1 = require("./announcement-receipt.service");
const create_announcement_dto_1 = require("./dto/create-announcement.dto");
const query_announcement_dto_1 = require("./dto/query-announcement.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const idempotency_decorator_1 = require("../../common/decorators/idempotency.decorator");
let AnnouncementController = class AnnouncementController {
    announcementService;
    receiptService;
    constructor(announcementService, receiptService) {
        this.announcementService = announcementService;
        this.receiptService = receiptService;
    }
    async create(dto, companyId, userId) {
        const id = await this.announcementService.create({
            companyId,
            title: dto.title,
            body: dto.body,
            priority: dto.priority,
            targetRoles: dto.targetRoles,
            targetEmployees: dto.targetEmployees,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
            createdById: userId,
        });
        return this.announcementService.getAnnouncement(id, companyId);
    }
    async publish(dto, companyId, userId) {
        await this.announcementService.publish({
            companyId,
            announcementId: dto.announcementId,
            userId,
        });
        return { success: true };
    }
    async archive(dto, companyId, userId) {
        await this.announcementService.archive({
            companyId,
            announcementId: dto.announcementId,
            userId,
        });
        return { success: true };
    }
    async markRead(id, companyId, userId) {
        await this.receiptService.markRead({
            companyId,
            announcementId: id,
            userId,
        });
        return { success: true };
    }
    async acknowledge(id, companyId, userId) {
        await this.receiptService.acknowledge({
            companyId,
            announcementId: id,
            userId,
        });
        return { success: true };
    }
    async list(companyId, query) {
        return this.announcementService.listAnnouncements(companyId, {
            page: query.page,
            limit: query.limit,
            status: query.status,
        });
    }
    async myAnnouncements(companyId, userId) {
        const employee = await this.announcementService['prisma'].employee.findFirst({
            where: { userId, companyId },
        });
        if (!employee)
            return [];
        return this.announcementService.getPublishedForEmployee(companyId, employee.id);
    }
    async getOne(id, companyId) {
        return this.announcementService.getAnnouncement(id, companyId);
    }
    async getReceipts(id, companyId) {
        const [receipts, counts] = await Promise.all([
            this.receiptService.getReceipts(id, companyId),
            this.receiptService.getReceiptCounts(id, companyId),
        ]);
        return { receipts, counts };
    }
};
exports.AnnouncementController = AnnouncementController;
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ANNOUNCEMENT_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_announcement_dto_1.CreateAnnouncementDto, String, String]),
    __metadata("design:returntype", Promise)
], AnnouncementController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('publish'),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ANNOUNCEMENT_PUBLISH),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_announcement_dto_1.PublishAnnouncementDto, String, String]),
    __metadata("design:returntype", Promise)
], AnnouncementController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)('archive'),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ANNOUNCEMENT_ARCHIVE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_announcement_dto_1.ArchiveAnnouncementDto, String, String]),
    __metadata("design:returntype", Promise)
], AnnouncementController.prototype, "archive", null);
__decorate([
    (0, common_1.Post)(':id/read'),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE, client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ANNOUNCEMENT_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnnouncementController.prototype, "markRead", null);
__decorate([
    (0, common_1.Post)(':id/acknowledge'),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE, client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ANNOUNCEMENT_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnnouncementController.prototype, "acknowledge", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ANNOUNCEMENT_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_announcement_dto_1.QueryAnnouncementDto]),
    __metadata("design:returntype", Promise)
], AnnouncementController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE, client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.ACCOUNTS, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ANNOUNCEMENT_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnnouncementController.prototype, "myAnnouncements", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ANNOUNCEMENT_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnnouncementController.prototype, "getOne", null);
__decorate([
    (0, common_1.Get)(':id/receipts'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ANNOUNCEMENT_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnnouncementController.prototype, "getReceipts", null);
exports.AnnouncementController = AnnouncementController = __decorate([
    (0, common_1.Controller)('announcements'),
    __metadata("design:paramtypes", [announcement_service_1.AnnouncementService,
        announcement_receipt_service_1.AnnouncementReceiptService])
], AnnouncementController);
//# sourceMappingURL=announcement.controller.js.map