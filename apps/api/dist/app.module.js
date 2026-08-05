"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./config/prisma.module");
const redis_module_1 = require("./config/redis.module");
const logger_module_1 = require("./common/logger/logger.module");
const rbac_module_1 = require("./common/rbac/rbac.module");
const common_services_module_1 = require("./common/services/common-services.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const audit_log_interceptor_1 = require("./common/interceptors/audit-log.interceptor");
const cache_control_interceptor_1 = require("./common/interceptors/cache-control.interceptor");
const cache_interceptor_1 = require("./common/interceptors/cache.interceptor");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const roles_guard_1 = require("./common/guards/roles.guard");
const permissions_guard_1 = require("./common/guards/permissions.guard");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const two_factor_enforced_guard_1 = require("./common/guards/two-factor-enforced.guard");
const auth_module_1 = require("./modules/auth/auth.module");
const crm_module_1 = require("./modules/crm/crm.module");
const hrms_module_1 = require("./modules/hrms/hrms.module");
const construction_module_1 = require("./modules/construction/construction.module");
const ems_module_1 = require("./modules/ems/ems.module");
const users_module_1 = require("./modules/users/users.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const activity_logs_module_1 = require("./modules/activity-logs/activity-logs.module");
const companies_module_1 = require("./modules/companies/companies.module");
const events_module_1 = require("./modules/events/events.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
const accounts_module_1 = require("./modules/accounts/accounts.module");
const eod_reports_module_1 = require("./modules/eod/eod-reports.module");
const escalation_module_1 = require("./modules/escalation/escalation.module");
const permission_grants_module_1 = require("./modules/permission-grants/permission-grants.module");
const security_events_module_1 = require("./modules/security-events/security-events.module");
const commission_module_1 = require("./modules/commission/commission.module");
const incentives_module_1 = require("./modules/incentives/incentives.module");
const schedule_1 = require("@nestjs/schedule");
const approvals_module_1 = require("./modules/approvals/approvals.module");
const tasks_module_1 = require("./modules/tasks/tasks.module");
const warnings_module_1 = require("./modules/warnings/warnings.module");
const payroll_holds_module_1 = require("./modules/payroll-holds/payroll-holds.module");
const scheduler_module_1 = require("./modules/scheduler/scheduler.module");
const reports_module_1 = require("./modules/reports/reports.module");
const governance_events_module_1 = require("./modules/governance-events/governance-events.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const audit_module_1 = require("./modules/audit/audit.module");
const performance_module_1 = require("./modules/performance/performance.module");
const communication_module_1 = require("./modules/communication/communication.module");
const realtime_module_1 = require("./common/realtime/realtime.module");
const agreements_module_1 = require("./modules/agreements/agreements.module");
const project_profitability_module_1 = require("./modules/project-profitability/project-profitability.module");
const recruitment_module_1 = require("./modules/recruitment/recruitment.module");
const training_module_1 = require("./modules/training/training.module");
const assets_module_1 = require("./modules/assets/assets.module");
const meetings_module_1 = require("./modules/meetings/meetings.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const portals_module_1 = require("./modules/portals/portals.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            logger_module_1.LoggerModule,
            common_services_module_1.CommonServicesModule,
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            event_emitter_1.EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),
            throttler_1.ThrottlerModule.forRoot([
                { ttl: 60000, limit: Number(process.env.THROTTLE_LIMIT ?? 100) },
            ]),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            rbac_module_1.RbacModule,
            auth_module_1.AuthModule,
            crm_module_1.CrmModule,
            hrms_module_1.HrmsModule,
            construction_module_1.ConstructionModule,
            ems_module_1.EmsModule,
            users_module_1.UsersModule,
            notifications_module_1.NotificationsModule,
            activity_logs_module_1.ActivityLogsModule,
            companies_module_1.CompaniesModule,
            uploads_module_1.UploadsModule,
            permission_grants_module_1.PermissionGrantsModule,
            accounts_module_1.AccountsModule,
            eod_reports_module_1.EodModule,
            escalation_module_1.EscalationModule,
            security_events_module_1.SecurityEventsModule,
            commission_module_1.CommissionModule,
            incentives_module_1.IncentivesModule,
            schedule_1.ScheduleModule.forRoot(),
            approvals_module_1.ApprovalsModule,
            tasks_module_1.TasksModule,
            warnings_module_1.WarningsModule,
            payroll_holds_module_1.PayrollHoldsModule,
            scheduler_module_1.SchedulerModule,
            reports_module_1.ReportsModule,
            events_module_1.EventsModule,
            governance_events_module_1.GovernanceEventsModule,
            dashboard_module_1.DashboardModule,
            audit_module_1.AuditModule,
            performance_module_1.PerformanceScoreModule,
            communication_module_1.CommunicationModule,
            realtime_module_1.RealtimeModule,
            agreements_module_1.AgreementsModule,
            project_profitability_module_1.ProjectProfitabilityModule,
            recruitment_module_1.RecruitmentModule,
            training_module_1.TrainingModule,
            assets_module_1.AssetsModule,
            meetings_module_1.MeetingsModule,
            inventory_module_1.InventoryModule,
            portals_module_1.PortalsModule,
        ],
        providers: [
            {
                provide: core_1.APP_FILTER,
                useClass: http_exception_filter_1.AllExceptionsFilter,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: permissions_guard_1.PermissionsGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: two_factor_enforced_guard_1.TwoFactorEnforcedGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: audit_log_interceptor_1.AuditLogInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: cache_interceptor_1.CacheInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: cache_control_interceptor_1.CacheControlInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: logging_interceptor_1.LoggingInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map