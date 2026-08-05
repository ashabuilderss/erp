import { SheetSyncService } from './google-sheets/sheet-sync.service';
export declare class ScheduledReportsWorker {
    private readonly sheetSyncService;
    private readonly logger;
    constructor(sheetSyncService: SheetSyncService);
    handleScheduledReports(): Promise<void>;
}
