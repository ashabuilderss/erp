import { PrismaService } from '../../config/prisma.service';
export declare class WarningAckSlaWorker {
    private readonly prisma;
    private readonly logger;
    private readonly SLA_HOURS;
    constructor(prisma: PrismaService);
    handleAckSlaBreaches(): Promise<void>;
}
