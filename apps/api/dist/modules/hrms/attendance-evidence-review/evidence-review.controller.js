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
exports.EvidenceReviewController = void 0;
const common_1 = require("@nestjs/common");
const evidence_review_service_1 = require("./evidence-review.service");
const create_evidence_review_dto_1 = require("./dto/create-evidence-review.dto");
const query_evidence_review_dto_1 = require("./dto/query-evidence-review.dto");
const review_evidence_dto_1 = require("./dto/review-evidence.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const permissions_1 = require("../../../common/auth/permissions");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let EvidenceReviewController = class EvidenceReviewController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto, companyId, reviewerId) {
        return this.service.create(dto, companyId, reviewerId);
    }
    findAll(query, companyId) {
        return this.service.findAll(query, companyId);
    }
    queue(companyId) {
        return this.service.findAll({ status: client_1.EvidenceReviewStatus.PENDING }, companyId);
    }
    findOne(id, companyId) {
        return this.service.findOne(id, companyId);
    }
    view(id, companyId) {
        return this.service.getForView(id, companyId);
    }
    review(id, dto, companyId, reviewerId) {
        return this.service.review(id, dto, companyId, reviewerId);
    }
    remove(id, companyId) {
        return this.service.remove(id, companyId);
    }
};
exports.EvidenceReviewController = EvidenceReviewController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_evidence_review_dto_1.CreateEvidenceReviewDto, String, String]),
    __metadata("design:returntype", void 0)
], EvidenceReviewController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_evidence_review_dto_1.QueryEvidenceReviewDto, String]),
    __metadata("design:returntype", void 0)
], EvidenceReviewController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('queue'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EvidenceReviewController.prototype, "queue", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EvidenceReviewController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/view'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EvidenceReviewController.prototype, "view", null);
__decorate([
    (0, common_1.Patch)(':id/review'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_APPROVE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_evidence_dto_1.ReviewEvidenceDto, String, String]),
    __metadata("design:returntype", void 0)
], EvidenceReviewController.prototype, "review", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ATTENDANCE_VERIFY),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EvidenceReviewController.prototype, "remove", null);
exports.EvidenceReviewController = EvidenceReviewController = __decorate([
    (0, common_1.Controller)('evidence-reviews'),
    __metadata("design:paramtypes", [evidence_review_service_1.EvidenceReviewService])
], EvidenceReviewController);
//# sourceMappingURL=evidence-review.controller.js.map