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
exports.BrokersController = void 0;
const common_1 = require("@nestjs/common");
const brokers_service_1 = require("./brokers.service");
const create_broker_dto_1 = require("./dto/create-broker.dto");
const update_broker_dto_1 = require("./dto/update-broker.dto");
const query_broker_dto_1 = require("./dto/query-broker.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const permissions_1 = require("../../../common/auth/permissions");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const idempotency_decorator_1 = require("../../../common/decorators/idempotency.decorator");
let BrokersController = class BrokersController {
    brokersService;
    constructor(brokersService) {
        this.brokersService = brokersService;
    }
    async create(dto, companyId) {
        return this.brokersService.create(dto, companyId);
    }
    async findAll(query, companyId) {
        return this.brokersService.findAll(query, companyId);
    }
    async findOne(id, companyId) {
        return this.brokersService.findOne(id, companyId);
    }
    async update(id, dto, companyId) {
        return this.brokersService.update(id, dto, companyId);
    }
    async remove(id, companyId) {
        return this.brokersService.remove(id, companyId);
    }
};
exports.BrokersController = BrokersController;
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.BROKER_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_broker_dto_1.CreateBrokerDto, String]),
    __metadata("design:returntype", Promise)
], BrokersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.BROKER_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_broker_dto_1.QueryBrokerDto, String]),
    __metadata("design:returntype", Promise)
], BrokersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.BROKER_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BrokersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.BROKER_UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_broker_dto_1.UpdateBrokerDto, String]),
    __metadata("design:returntype", Promise)
], BrokersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.BROKER_DELETE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BrokersController.prototype, "remove", null);
exports.BrokersController = BrokersController = __decorate([
    (0, common_1.Controller)('brokers'),
    __metadata("design:paramtypes", [brokers_service_1.BrokersService])
], BrokersController);
//# sourceMappingURL=brokers.controller.js.map