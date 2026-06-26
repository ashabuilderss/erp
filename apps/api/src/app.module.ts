import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './config/prisma.module';
import { RedisModule } from './config/redis.module';
import { LoggerModule } from './common/logger/logger.module';
import { CommonServicesModule } from './common/services/common-services.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { CacheControlInterceptor } from './common/interceptors/cache-control.interceptor';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { CrmModule } from './modules/crm/crm.module';
import { HrmsModule } from './modules/hrms/hrms.module';
import { ConstructionModule } from './modules/construction/construction.module';
import { PortalsModule } from './modules/portals/portals.module';
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
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { DealersModule } from './modules/dealers/dealers.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    LoggerModule,
    CommonServicesModule,
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    CrmModule,
    HrmsModule,
    ConstructionModule,
    PortalsModule,
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
    SchedulerModule,
    DealersModule,
    ReportsModule,
    EventsModule,
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
