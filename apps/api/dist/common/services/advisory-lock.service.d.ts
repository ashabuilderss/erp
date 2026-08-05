import { PrismaService } from '../../config/prisma.service';
export declare class AdvisoryLockService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    tryLock(key: number): Promise<boolean>;
    unlock(key: number): Promise<void>;
    runWithLock<T>(key: number, fn: () => Promise<T>): Promise<T | null>;
}
