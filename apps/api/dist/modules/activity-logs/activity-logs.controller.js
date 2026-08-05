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
exports.ActivityLogsController = void 0;
const common_1 = require("@nestjs/common");
const activity_logs_service_1 = require("./activity-logs.service");
const query_activity_log_dto_1 = require("./dto/query-activity-log.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let ActivityLogsController = class ActivityLogsController {
    activityLogsService;
    constructor(activityLogsService) {
        this.activityLogsService = activityLogsService;
    }
    async findAll(query, companyId) {
        return this.activityLogsService.findAll(query, companyId);
    }
    async export(query, companyId, res) {
        const format = query.format || 'csv';
        const data = await this.activityLogsService.exportAll(query, companyId);
        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="activity-logs.json"');
            return res.json(data);
        }
        const header = 'Time,Action,Entity,Entity ID,Description,Performed By,Actor Email,Actor Role,IP Address,Request ID';
        const rows = data.map((log) => {
            const performedByName = log.employees?.users
                ? `${log.employees.users.firstName} ${log.employees.users.lastName}`
                : log.employees?.employeeCode || '';
            return [
                log.createdAt.toISOString(),
                `"${log.action.replace(/"/g, '""')}"`,
                log.entityType,
                log.entityId,
                `"${(log.description || '').replace(/"/g, '""')}"`,
                `"${performedByName.replace(/"/g, '""')}"`,
                `"${(log.actorEmail || '').replace(/"/g, '""')}"`,
                `"${(log.actorRole || '').replace(/"/g, '""')}"`,
                `"${(log.ipAddress || '').replace(/"/g, '""')}"`,
                `"${(log.requestId || '').replace(/"/g, '""')}"`,
            ].join(',');
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="activity-logs.csv"');
        return res.send([header, ...rows].join('\n'));
    }
};
exports.ActivityLogsController = ActivityLogsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.AUDIT_LOG_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_activity_log_dto_1.QueryActivityLogDto, String]),
    __metadata("design:returntype", Promise)
], ActivityLogsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.AUDIT_LOG_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_activity_log_dto_1.QueryActivityLogDto, String, Object]),
    __metadata("design:returntype", Promise)
], ActivityLogsController.prototype, "export", null);
exports.ActivityLogsController = ActivityLogsController = __decorate([
    (0, common_1.Controller)('activity-logs'),
    __metadata("design:paramtypes", [activity_logs_service_1.ActivityLogsService])
], ActivityLogsController);
//# sourceMappingURL=activity-logs.controller.js.map