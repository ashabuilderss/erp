import { PrismaService } from '../../config/prisma.service';
export declare class WarningExpirationWorker {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleWarningExpirations(): Promise<void>;
}
