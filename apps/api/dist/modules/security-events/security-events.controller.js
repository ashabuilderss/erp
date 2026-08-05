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
exports.SecurityEventsController = void 0;
const common_1 = require("@nestjs/common");
const security_events_service_1 = require("./security-events.service");
const query_security_event_dto_1 = require("./dto/query-security-event.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let SecurityEventsController = class SecurityEventsController {
    securityEventsService;
    constructor(securityEventsService) {
        this.securityEventsService = securityEventsService;
    }
    async findAll(query, companyId) {
        return this.securityEventsService.findAll(query, companyId);
    }
    async findLoginHistory(companyId) {
        return this.securityEventsService.findLoginHistory(companyId);
    }
    async findSessions(companyId) {
        return this.securityEventsService.findSessions(companyId);
    }
};
exports.SecurityEventsController = SecurityEventsController;
__decorate([
    (0, common_1.Get)('security-events'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.SECURITY_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_security_event_dto_1.QuerySecurityEventDto, String]),
    __metadata("design:returntype", Promise)
], SecurityEventsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('login-history'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.SECURITY_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SecurityEventsController.prototype, "findLoginHistory", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.SECURITY_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SecurityEventsController.prototype, "findSessions", null);
exports.SecurityEventsController = SecurityEventsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [security_events_service_1.SecurityEventsService])
], SecurityEventsController);
//# sourceMappingURL=security-events.controller.js.map