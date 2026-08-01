import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AdvisoryLockService } from '../../../common/services/advisory-lock.service';
import { SheetSyncService } from '../../reports/google-sheets/sheet-sync.service';
import { SyncResult } from '../../reports/google-sheets/sheet-sync.service';

const EXPORT_SYNC_LOCK_KEY = 20260708;

@Injectable()
export class ExportSyncJob {
  private readonly logger = new Logger(ExportSyncJob.name);

  constructor(
    private readonly lockService: AdvisoryLockService,
    private readonly syncService: SheetSyncService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handle() {
    this.logger.log('Checking for enabled export sync configs...');

    await this.lockService.runWithLock(EXPORT_SYNC_LOCK_KEY, async () => {
      const results = await this.syncService.syncAllEnabled();
      const completed = results.filter(
        (r: SyncResult) => r.status === 'COMPLETED',
      );
      const failed = results.filter((r: SyncResult) => r.status === 'FAILED');

      if (completed.length > 0) {
        this.logger.log(`Export sync completed: ${completed.length} configs`);
      }
      if (failed.length > 0) {
        this.logger.warn(`Export sync failed: ${failed.length} configs`);
      }
    });
  }
}
