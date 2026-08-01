import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './config/prisma.module';
import { RedisModule } from './config/redis.module';
import { LoggerModule } from './common/logger/logger.module';
import { RbacModule } from './common/rbac/rbac.module';
import { CommonServicesModule } from './common/services/common-services.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { CacheControlInterceptor } from './common/interceptors/cache-control.interceptor';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TwoFactorEnforcedGuard } from './common/guards/two-factor-enforced.guard';
import { AuthModule } from './modules/auth/auth.module';
import { CrmModule } from './modules/crm/crm.module';
import { HrmsModule } from './modules/hrms/hrms.module';
import { ConstructionModule } from './modules/construction/construction.module';

import { EmsModule } from './modules/ems/ems.module';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { EventsModule } from './modules/events/events.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { EodModule } from './modules/eod/eod-reports.module';
import { EscalationModule } from './modules/escalation/escalation.module';
import { PermissionGrantsModule } from './modules/permission-grants/permission-grants.module';
import { SecurityEventsModule } from './modules/security-events/security-events.module';
import { CommissionModule } from './modules/commission/commission.module';
import { IncentivesModule } from './modules/incentives/incentives.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { WarningsModule } from './modules/warnings/warnings.module';
import { PayrollHoldsModule } from './modules/payroll-holds/payroll-holds.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { ReportsModule } from './modules/reports/reports.module';
import { GovernanceEventsModule } from './modules/governance-events/governance-events.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditModule } from './modules/audit/audit.module';
import { PerformanceScoreModule } from './modules/performance/performance.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { RealtimeModule } from './common/realtime/realtime.module';
import { AgreementsModule } from './modules/agreements/agreements.module';
import { ProjectProfitabilityModule } from './modules/project-profitability/project-profitability.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { TrainingModule } from './modules/training/training.module';
import { AssetsModule } from './modules/assets/assets.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PortalsModule } from './modules/portals/portals.module';

@Module({
  imports: [
    LoggerModule,
    CommonServicesModule,
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: Number(process.env.THROTTLE_LIMIT ?? 100) },
    ]),
    PrismaModule,
    RedisModule,
    RbacModule,
    AuthModule,
    CrmModule,
    HrmsModule,
    ConstructionModule,

    EmsModule,
    UsersModule,
    NotificationsModule,
    ActivityLogsModule,
    CompaniesModule,
    UploadsModule,
    PermissionGrantsModule,
    AccountsModule,
    EodModule,
    EscalationModule,
    SecurityEventsModule,
    CommissionModule,
    IncentivesModule,
    ScheduleModule.forRoot(),
    ApprovalsModule,
    TasksModule,
    WarningsModule,
    PayrollHoldsModule,
    SchedulerModule,
    ReportsModule,
    EventsModule,
    GovernanceEventsModule,
    DashboardModule,
    AuditModule,
    PerformanceScoreModule,
    CommunicationModule,
    RealtimeModule,
    AgreementsModule,
    ProjectProfitabilityModule,
    RecruitmentModule,
    TrainingModule,
    AssetsModule,
    MeetingsModule,
    InventoryModule,
    PortalsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    // §5.29: enforce 2FA for OWNER / ADMIN / ACCOUNTS on @Require2FA() routes
    {
      provide: APP_GUARD,
      useClass: TwoFactorEnforcedGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheControlInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
