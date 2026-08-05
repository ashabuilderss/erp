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
exports.TrainingController = void 0;
const common_1 = require("@nestjs/common");
const training_service_1 = require("./training.service");
const create_sop_dto_1 = require("./dto/create-sop.dto");
const create_training_record_dto_1 = require("./dto/create-training-record.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let TrainingController = class TrainingController {
    service;
    constructor(service) {
        this.service = service;
    }
    async findAllSops(companyId, query) {
        return this.service.findAllSops(companyId, query);
    }
    async createSop(companyId, dto) {
        return this.service.createSop(companyId, dto);
    }
    async findOneSop(companyId, id) {
        return this.service.findOneSop(companyId, id);
    }
    async updateSop(companyId, id, dto) {
        return this.service.updateSop(companyId, id, dto);
    }
    async removeSop(companyId, id) {
        return this.service.removeSop(companyId, id);
    }
    async acknowledgeSop(companyId, currentEmployeeId, id, dto) {
        const employeeId = dto.employeeId || currentEmployeeId;
        return this.service.acknowledgeSop(companyId, id, employeeId);
    }
    async listAcknowledgements(companyId, id) {
        return this.service.listAcknowledgements(companyId, id);
    }
    async findAllRecords(companyId, query) {
        return this.service.findAllRecords(companyId, query);
    }
    async createRecord(companyId, dto) {
        return this.service.createRecord(companyId, dto);
    }
};
exports.TrainingController = TrainingController;
__decorate([
    (0, common_1.Get)('sops'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TRAINING_READ),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_sop_dto_1.QuerySopDto]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "findAllSops", null);
__decorate([
    (0, common_1.Post)('sops'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TRAINING_CREATE),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_sop_dto_1.CreateSopDto]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "createSop", null);
__decorate([
    (0, common_1.Get)('sops/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TRAINING_READ),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "findOneSop", null);
__decorate([
    (0, common_1.Patch)('sops/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TRAINING_CREATE),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_sop_dto_1.UpdateSopDto]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "updateSop", null);
__decorate([
    (0, common_1.Delete)('sops/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TRAINING_CREATE),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "removeSop", null);
__decorate([
    (0, common_1.Post)('sops/:id/acknowledge'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TRAINING_ACKNOWLEDGE),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('employeeId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, create_sop_dto_1.AcknowledgeSopDto]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "acknowledgeSop", null);
__decorate([
    (0, common_1.Get)('sops/:id/acknowledgements'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TRAINING_READ),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "listAcknowledgements", null);
__decorate([
    (0, common_1.Get)('records'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TRAINING_READ),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_training_record_dto_1.QueryTrainingRecordDto]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "findAllRecords", null);
__decorate([
    (0, common_1.Post)('records'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TRAINING_CREATE),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_training_record_dto_1.CreateTrainingRecordDto]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "createRecord", null);
exports.TrainingController = TrainingController = __decorate([
    (0, common_1.Controller)('training'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [training_service_1.TrainingService])
], TrainingController);
//# sourceMappingURL=training.controller.js.map