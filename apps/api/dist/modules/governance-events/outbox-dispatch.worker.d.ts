import { PrismaService } from '../../config/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
export declare class OutboxDispatchWorker {
    private readonly prisma;
    private readonly eventEmitter;
    private readonly configService;
    private readonly logger;
    private isRunning;
    private readonly batchSize;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2, configService: ConfigService);
    handleOutbox(): Promise<void>;
    private processPendingEvents;
}
