import { PrismaService } from '../../../config/prisma.service';
import { TransitionService } from '../../../common/services/transition.service';
import { GovernanceEventPublisher } from '../../governance-events/governance-event.publisher';
import { AttendancePolicyEngine } from './attendance-policy.engine';
import { AttendanceHistoryService } from './attendance-history.service';
interface FinalizePeriodInput {
    companyId: string;
    attendancePeriodId: string;
    finalizedById: string;
    correctionOverrides?: {
        dayAggregateId: string;
        requestedCheckIn?: string;
        requestedCheckOut?: string;
    }[];
}
interface FinalizePeriodResult {
    batchId: string;
    processedCount: number;
    failedCount: number;
}
interface CreatePeriodInput {
    companyId: string;
    startDate: Date;
    endDate: Date;
    createdById: string;
}
export declare class AttendanceFinalizationService {
    private readonly prisma;
    private readonly eventPublisher;
    private readonly policyEngine;
    private readonly historyService;
    private readonly transitionService;
    constructor(prisma: PrismaService, eventPublisher: GovernanceEventPublisher, policyEngine: AttendancePolicyEngine, historyService: AttendanceHistoryService, transitionService: TransitionService);
    finalizePeriod(input: FinalizePeriodInput): Promise<FinalizePeriodResult>;
    createPeriod(input: CreatePeriodInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.AttendancePeriodStatus;
        startDate: Date;
        endDate: Date;
    }>;
    lockPeriod(companyId: string, periodId: string, lockedById: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.AttendancePeriodStatus;
        startDate: Date;
        endDate: Date;
    }>;
    private parsePolicy;
    private parseHolidayDates;
    private parseWeeklyOffDays;
    finalizePreviousDay(companyId: string): Promise<FinalizePeriodResult | undefined>;
}
export {};
