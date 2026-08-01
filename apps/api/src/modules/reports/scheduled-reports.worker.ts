import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SheetSyncService } from './google-sheets/sheet-sync.service';

@Injectable()
export class ScheduledReportsWorker {
  private readonly logger = new Logger(ScheduledReportsWorker.name);

  constructor(private readonly sheetSyncService: SheetSyncService) {}

  @Cron('0 18 * * *') // Run daily at 6:00 PM
  async handleScheduledReports() {
    this.logger.log('Running Scheduled Reports Worker (6:00 PM)...');
    try {
      const results = await this.sheetSyncService.syncAllEnabled();
      this.logger.log(`Scheduled Reports Worker finished. Synced ${results.length} reports.`);
    } catch (error) {
      this.logger.error(`Scheduled Reports Worker failed: ${error.message}`);
    }
  }
}
