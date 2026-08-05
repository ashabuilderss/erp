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
exports.EscalationRulesController = void 0;
const common_1 = require("@nestjs/common");
const escalation_rules_service_1 = require("./escalation-rules.service");
const create_escalation_rule_dto_1 = require("./dto/create-escalation-rule.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const idempotency_decorator_1 = require("../../common/decorators/idempotency.decorator");
let EscalationRulesController = class EscalationRulesController {
    service;
    constructor(service) {
        this.service = service;
    }
    async findAll(companyId) {
        return this.service.findAll(companyId);
    }
    async create(dto, companyId) {
        return this.service.create(dto, companyId);
    }
    async update(id, dto, companyId) {
        return this.service.update(id, dto, companyId);
    }
    async remove(id, companyId) {
        return this.service.remove(id, companyId);
    }
};
exports.EscalationRulesController = EscalationRulesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ESCALATION_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EscalationRulesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ESCALATION_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_escalation_rule_dto_1.CreateEscalationRuleDto, String]),
    __metadata("design:returntype", Promise)
], EscalationRulesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ESCALATION_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_escalation_rule_dto_1.UpdateEscalationRuleDto, String]),
    __metadata("design:returntype", Promise)
], EscalationRulesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ESCALATION_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EscalationRulesController.prototype, "remove", null);
exports.EscalationRulesController = EscalationRulesController = __decorate([
    (0, common_1.Controller)('escalation-rules'),
    __metadata("design:paramtypes", [escalation_rules_service_1.EscalationRulesService])
], EscalationRulesController);
//# sourceMappingURL=escalation-rules.controller.js.map