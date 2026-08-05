import { PrismaService } from '../../config/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
export declare class EventsReplayController {
    private readonly prisma;
    private readonly eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    replayEvent(id: string, req: AuthenticatedRequest): Promise<{
        success: boolean;
        message: string;
    }>;
    replayHandler(eventId: string, handlerName: string, req: AuthenticatedRequest): Promise<{
        success: boolean;
        message: string;
    }>;
}
