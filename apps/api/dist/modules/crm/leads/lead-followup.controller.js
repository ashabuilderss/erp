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
exports.LeadFollowUpController = void 0;
const common_1 = require("@nestjs/common");
const lead_followup_service_1 = require("./lead-followup.service");
const create_lead_followup_dto_1 = require("./dto/create-lead-followup.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const permissions_1 = require("../../../common/auth/permissions");
const idempotency_decorator_1 = require("../../../common/decorators/idempotency.decorator");
let LeadFollowUpController = class LeadFollowUpController {
    followUpService;
    constructor(followUpService) {
        this.followUpService = followUpService;
    }
    async create(leadId, companyId, employeeId, dto) {
        return this.followUpService.logFollowUp(leadId, companyId, employeeId, dto);
    }
    async findAll(leadId, companyId) {
        return this.followUpService.getFollowUps(leadId, companyId);
    }
};
exports.LeadFollowUpController = LeadFollowUpController;
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAD_UPDATE),
    __param(0, (0, common_1.Param)('leadId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, create_lead_followup_dto_1.CreateLeadFollowUpDto]),
    __metadata("design:returntype", Promise)
], LeadFollowUpController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAD_READ),
    __param(0, (0, common_1.Param)('leadId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LeadFollowUpController.prototype, "findAll", null);
exports.LeadFollowUpController = LeadFollowUpController = __decorate([
    (0, common_1.Controller)('leads/:leadId/follow-ups'),
    __metadata("design:paramtypes", [lead_followup_service_1.LeadFollowUpService])
], LeadFollowUpController);
//# sourceMappingURL=lead-followup.controller.js.map