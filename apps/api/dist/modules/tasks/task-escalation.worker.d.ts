import { PrismaService } from '../../config/prisma.service';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
export declare class TaskEscalationWorker {
    private readonly prisma;
    private readonly eventPublisher;
    private readonly logger;
    constructor(prisma: PrismaService, eventPublisher: GovernanceEventPublisher);
    handleTaskEscalations(): Promise<void>;
    private processAcknowledgmentBreaches;
    private getEscalationDelayHours;
    private processDueDateBreaches;
    private processSlaReminders;
    private processSlaBreaches;
}
