import { PrismaService } from '../../../config/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class ProcessingRecoveryWorker {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private isRunning;
    private readonly timeoutMinutes;
    constructor(prisma: PrismaService, configService: ConfigService);
    handleRecovery(): Promise<void>;
    private recoverDomainEvents;
    private recoverProcessedEvents;
}
