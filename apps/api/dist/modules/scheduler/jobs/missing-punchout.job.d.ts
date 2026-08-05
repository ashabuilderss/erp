import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventPublisher } from '../../governance-events/governance-event.publisher';
export declare class MissingPunchoutJob {
    private prisma;
    private eventPublisher;
    private readonly logger;
    private readonly AUTO_CHECKOUT_HOUR;
    private readonly AUTO_CHECKOUT_MINUTE;
    constructor(prisma: PrismaService, eventPublisher: GovernanceEventPublisher);
    handle(): Promise<void>;
    private processCompany;
}
