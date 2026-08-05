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
exports.ConstructionController = void 0;
const common_1 = require("@nestjs/common");
const construction_service_1 = require("./construction.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const cache_decorators_1 = require("../../common/decorators/cache.decorators");
const dto_1 = require("./dto");
const query_material_inward_dto_1 = require("./dto/query-material-inward.dto");
const query_inventory_dto_1 = require("./dto/query-inventory.dto");
const query_labour_entry_dto_1 = require("./dto/query-labour-entry.dto");
const query_consumption_dto_1 = require("./dto/query-consumption.dto");
let ConstructionController = class ConstructionController {
    service;
    constructor(service) {
        this.service = service;
    }
    async createSite(dto, companyId) {
        return this.service.createSite(dto, companyId);
    }
    async findAllSites(query, companyId) {
        return this.service.findAllSites(query, companyId);
    }
    async findOneSite(id, companyId) {
        return this.service.findOneSite(id, companyId);
    }
    async updateSite(id, dto, companyId) {
        return this.service.updateSite(id, dto, companyId);
    }
    async deleteSite(id, companyId) {
        return this.service.deleteSite(id, companyId);
    }
    async createPhase(siteId, dto, companyId) {
        return this.service.createPhase(siteId, dto, companyId);
    }
    async updatePhase(id, dto, companyId) {
        return this.service.updatePhase(id, dto, companyId);
    }
    async deletePhase(id, companyId) {
        return this.service.deletePhase(id, companyId);
    }
    async createVendor(dto, companyId) {
        return this.service.createVendor(dto, companyId);
    }
    async findAllVendors(query, companyId) {
        return this.service.findAllVendors(query, companyId);
    }
    async findOneVendor(id, companyId) {
        return this.service.findOneVendor(id, companyId);
    }
    async updateVendor(id, dto, companyId) {
        return this.service.updateVendor(id, dto, companyId);
    }
    async deleteVendor(id, companyId) {
        return this.service.deleteVendor(id, companyId);
    }
    async createMaterial(dto, companyId) {
        return this.service.createMaterial(dto, companyId);
    }
    async findAllMaterials(query, companyId) {
        return this.service.findAllMaterials(query, companyId);
    }
    async updateMaterial(id, dto, companyId) {
        return this.service.updateMaterial(id, dto, companyId);
    }
    async deleteMaterial(id, companyId) {
        return this.service.deleteMaterial(id, companyId);
    }
    async createMaterialInward(dto, companyId) {
        return this.service.createMaterialInward(dto, companyId);
    }
    async updateMaterialInward(id, dto, companyId) {
        return this.service.updateMaterialInward(id, dto, companyId);
    }
    async deleteMaterialInward(id, companyId) {
        return this.service.deleteMaterialInward(id, companyId);
    }
    async findAllMaterialInward(query, companyId) {
        return this.service.findAllMaterialInward(query, companyId);
    }
    async findInventory(query, companyId) {
        return this.service.findInventory(query, companyId);
    }
    async createLabourEntry(dto, companyId) {
        return this.service.createLabourEntry(dto, companyId);
    }
    async findAllLabourEntries(query, companyId) {
        return this.service.findAllLabourEntries(query, companyId);
    }
    async deleteLabourEntry(id, companyId) {
        return this.service.deleteLabourEntry(id, companyId);
    }
    async createConsumption(dto, companyId, userId) {
        return this.service.createConsumption(dto, companyId, userId);
    }
    async findAllConsumptions(query, companyId) {
        return this.service.findAllConsumptions(query, companyId);
    }
    async deleteConsumption(id, companyId) {
        return this.service.deleteConsumption(id, companyId);
    }
    async createProgressPhoto(dto, companyId) {
        return this.service.createProgressPhoto(dto, companyId);
    }
    async findSitePhotos(siteId, companyId) {
        return this.service.findSitePhotos(siteId, companyId);
    }
    async deleteProgressPhoto(id, companyId) {
        return this.service.deleteProgressPhoto(id, companyId);
    }
};
exports.ConstructionController = ConstructionController;
__decorate([
    (0, common_1.Post)('construction-sites'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateSiteDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "createSite", null);
__decorate([
    (0, common_1.Get)('construction-sites'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QuerySiteDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "findAllSites", null);
__decorate([
    (0, common_1.Get)('construction-sites/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "findOneSite", null);
__decorate([
    (0, common_1.Patch)('construction-sites/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateSiteDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "updateSite", null);
__decorate([
    (0, common_1.Delete)('construction-sites/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "deleteSite", null);
__decorate([
    (0, common_1.Post)('construction-sites/:siteId/phases'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Param)('siteId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreatePhaseDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "createPhase", null);
__decorate([
    (0, common_1.Patch)('phases/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePhaseDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "updatePhase", null);
__decorate([
    (0, common_1.Delete)('phases/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "deletePhase", null);
__decorate([
    (0, common_1.Post)('vendors'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateVendorDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "createVendor", null);
__decorate([
    (0, common_1.Get)('vendors'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.ACCOUNTS, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryVendorDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "findAllVendors", null);
__decorate([
    (0, common_1.Get)('vendors/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.ACCOUNTS, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "findOneVendor", null);
__decorate([
    (0, common_1.Patch)('vendors/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateVendorDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "updateVendor", null);
__decorate([
    (0, common_1.Delete)('vendors/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "deleteVendor", null);
__decorate([
    (0, common_1.Post)('materials'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateMaterialDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "createMaterial", null);
__decorate([
    (0, common_1.Get)('materials'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryMaterialDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "findAllMaterials", null);
__decorate([
    (0, common_1.Patch)('materials/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateMaterialDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "updateMaterial", null);
__decorate([
    (0, common_1.Delete)('materials/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "deleteMaterial", null);
__decorate([
    (0, common_1.Post)('material-inward'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    (0, cache_decorators_1.CacheInvalidateExtra)(['material-inward', 'inventory']),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateMaterialInwardDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "createMaterialInward", null);
__decorate([
    (0, common_1.Patch)('material-inward/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    (0, cache_decorators_1.CacheInvalidateExtra)(['material-inward', 'inventory']),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateMaterialInwardDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "updateMaterialInward", null);
__decorate([
    (0, common_1.Delete)('material-inward/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    (0, cache_decorators_1.CacheInvalidateExtra)(['material-inward', 'inventory']),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "deleteMaterialInward", null);
__decorate([
    (0, common_1.Get)('material-inward'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_material_inward_dto_1.QueryMaterialInwardDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "findAllMaterialInward", null);
__decorate([
    (0, common_1.Get)('inventory'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_inventory_dto_1.QueryInventoryDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "findInventory", null);
__decorate([
    (0, common_1.Post)('labour-entries'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateLabourEntryDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "createLabourEntry", null);
__decorate([
    (0, common_1.Get)('labour-entries'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_labour_entry_dto_1.QueryLabourEntryDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "findAllLabourEntries", null);
__decorate([
    (0, common_1.Delete)('labour-entries/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "deleteLabourEntry", null);
__decorate([
    (0, common_1.Post)('consumption'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSUMPTION_CREATE),
    (0, cache_decorators_1.CacheInvalidateExtra)(['consumption', 'inventory']),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateConsumptionDto, String, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "createConsumption", null);
__decorate([
    (0, common_1.Get)('consumption'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSUMPTION_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_consumption_dto_1.QueryConsumptionDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "findAllConsumptions", null);
__decorate([
    (0, common_1.Delete)('consumption/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSUMPTION_DELETE),
    (0, cache_decorators_1.CacheInvalidateExtra)(['consumption', 'inventory']),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "deleteConsumption", null);
__decorate([
    (0, common_1.Post)('progress-photos'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateProgressPhotoDto, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "createProgressPhoto", null);
__decorate([
    (0, common_1.Get)('construction-sites/:siteId/photos'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_READ),
    __param(0, (0, common_1.Param)('siteId')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "findSitePhotos", null);
__decorate([
    (0, common_1.Delete)('progress-photos/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.CONSTRUCTION_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConstructionController.prototype, "deleteProgressPhoto", null);
exports.ConstructionController = ConstructionController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [construction_service_1.ConstructionService])
], ConstructionController);
//# sourceMappingURL=construction.controller.js.map