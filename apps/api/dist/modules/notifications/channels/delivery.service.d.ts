import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { EmailService } from './email.service';
import { PushService } from './push.service';
export declare class NotificationDeliveryService {
    private prisma;
    private emailService;
    private pushService;
    private eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService, pushService: PushService, eventEmitter: EventEmitter2);
    deliver(payload: {
        userId: string;
        companyId: string;
        title: string;
        message: string;
        type: string;
        link?: string;
    }): Promise<void>;
    private typeToPrefKey;
}
