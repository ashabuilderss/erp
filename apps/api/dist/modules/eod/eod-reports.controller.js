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
exports.EodReportsController = void 0;
const common_1 = require("@nestjs/common");
const eod_reports_service_1 = require("./eod-reports.service");
const create_eod_report_dto_1 = require("./dto/create-eod-report.dto");
const query_eod_report_dto_1 = require("./dto/query-eod-report.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const idempotency_decorator_1 = require("../../common/decorators/idempotency.decorator");
let EodReportsController = class EodReportsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async findAll(query, companyId) {
        return this.service.findAll(companyId, query.date, query.employeeId);
    }
    async findMy(query, employeeId, companyId) {
        return this.service.findByEmployee(employeeId, companyId, query.date);
    }
    async findOne(id, companyId) {
        return this.service.findOne(id, companyId);
    }
    async create(dto, employeeId, companyId) {
        return this.service.create(dto, employeeId, companyId);
    }
    async update(id, dto, companyId) {
        return this.service.update(id, dto, companyId);
    }
    async review(id, dto, currentEmployeeId, companyId) {
        return this.service.review(id, dto, currentEmployeeId, companyId);
    }
};
exports.EodReportsController = EodReportsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EOD_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_eod_report_dto_1.QueryEodReportDto, String]),
    __metadata("design:returntype", Promise)
], EodReportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EOD_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_eod_report_dto_1.QueryEodReportDto, String, String]),
    __metadata("design:returntype", Promise)
], EodReportsController.prototype, "findMy", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EOD_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EodReportsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EOD_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_eod_report_dto_1.CreateEodReportDto, String, String]),
    __metadata("design:returntype", Promise)
], EodReportsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EOD_REVIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_eod_report_dto_1.UpdateEodReportDto, String]),
    __metadata("design:returntype", Promise)
], EodReportsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/review'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EOD_REVIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_eod_report_dto_1.UpdateEodReportDto, String, String]),
    __metadata("design:returntype", Promise)
], EodReportsController.prototype, "review", null);
exports.EodReportsController = EodReportsController = __decorate([
    (0, common_1.Controller)('eod-reports'),
    __metadata("design:paramtypes", [eod_reports_service_1.EodReportsService])
], EodReportsController);
//# sourceMappingURL=eod-reports.controller.js.map