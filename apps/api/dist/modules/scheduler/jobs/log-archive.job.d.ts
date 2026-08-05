import { PrismaService } from '../../../config/prisma.service';
import { StorageProvider } from '../../uploads/storage/storage-provider.interface';
export declare class LogArchiveJob {
    private prisma;
    private storageProvider;
    private readonly logger;
    constructor(prisma: PrismaService, storageProvider: StorageProvider);
    handle(): Promise<void>;
}
