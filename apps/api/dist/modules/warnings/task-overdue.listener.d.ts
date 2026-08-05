import { DomainEvent } from '@prisma/client';
import { WarningsService } from './warnings.service';
export declare class TaskOverdueListener {
    private readonly warningsService;
    private readonly logger;
    constructor(warningsService: WarningsService);
    handleTaskOverdue(event: DomainEvent): Promise<void>;
    private mapEscalationToSeverity;
}
