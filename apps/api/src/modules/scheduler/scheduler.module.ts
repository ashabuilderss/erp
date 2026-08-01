import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../config/prisma.module';
import { CommonServicesModule } from '../../common/services/common-services.module';
import { MissingPunchoutJob } from './jobs/missing-punchout.job';
import { TaskOverdueJob } from './jobs/task-overdue.job';
import { WeeklyOffHolidaySyncJob } from './jobs/weekly-off-holiday-sync.job';
import { PhotoRetentionJob } from './jobs/photo-retention.job';
import { LogArchiveJob } from './jobs/log-archive.job';
import { EscalationTriggerJob } from './jobs/escalation-trigger.job';
import { AttendanceSelfieCleanupJob } from './jobs/attendance-selfie-cleanup.job';
import { ExportSyncJob } from './jobs/export-sync.job';
import { ExportRetentionJob } from './jobs/export-retention.job';
import { AttendanceMidnightFinalizationJob } from './jobs/attendance-midnight-finalization.job';
import { AttendanceModule } from '../hrms/attendance/attendance.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    CommonServicesModule,
    AttendanceModule,
    ReportsModule,
  ],
  providers: [
    MissingPunchoutJob,
    TaskOverdueJob,
    WeeklyOffHolidaySyncJob,
    PhotoRetentionJob,
    LogArchiveJob,
    EscalationTriggerJob,
    AttendanceSelfieCleanupJob,
    ExportSyncJob,
    ExportRetentionJob,
    AttendanceMidnightFinalizationJob,
  ],
})
export class SchedulerModule {}
