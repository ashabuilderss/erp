import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../config/prisma.module';
import { MissingPunchoutJob } from './jobs/missing-punchout.job';
import { TaskOverdueJob } from './jobs/task-overdue.job';
import { WeeklyOffHolidaySyncJob } from './jobs/weekly-off-holiday-sync.job';
import { PhotoRetentionJob } from './jobs/photo-retention.job';
import { SelfieCleanupJob } from './jobs/selfie-cleanup.job';
import { LogArchiveJob } from './jobs/log-archive.job';
import { EscalationTriggerJob } from './jobs/escalation-trigger.job';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  providers: [
    MissingPunchoutJob,
    TaskOverdueJob,
    WeeklyOffHolidaySyncJob,
    PhotoRetentionJob,
    SelfieCleanupJob,
    LogArchiveJob,
    EscalationTriggerJob,
  ],
})
export class SchedulerModule {}
