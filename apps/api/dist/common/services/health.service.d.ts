import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';
export declare class HealthService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService);
    check(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        database: {
            status: string;
            latencyMs?: number;
        };
        redis: {
            status: string;
            latencyMs?: number;
        };
        smtp: {
            configured: boolean;
        };
        fcm: {
            configured: boolean;
        };
    }>;
}
