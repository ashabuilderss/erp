import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
export declare class ReplayOrchestrationService {
    private readonly prisma;
    private readonly eventEmitter;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    replayAttendanceProjections(companyId: string): Promise<{
        replayed: number;
    }>;
}
export declare class ProjectionHealthMonitor {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAttendanceProjectionLag(companyId: string): Promise<{
        companyId: string;
        pendingBusinessEvents: number;
        healthy: boolean;
    }>;
}
