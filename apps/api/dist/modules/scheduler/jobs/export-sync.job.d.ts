import { AdvisoryLockService } from '../../../common/services/advisory-lock.service';
import { SheetSyncService } from '../../reports/google-sheets/sheet-sync.service';
export declare class ExportSyncJob {
    private readonly lockService;
    private readonly syncService;
    private readonly logger;
    constructor(lockService: AdvisoryLockService, syncService: SheetSyncService);
    handle(): Promise<void>;
}
