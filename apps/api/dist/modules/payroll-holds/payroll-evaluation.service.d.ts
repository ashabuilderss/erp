import { PrismaService } from '../../config/prisma.service';
export interface PayrollHoldEvaluationResult {
    hasHold: boolean;
    salaryOverride?: number;
    salaryDeduction?: number;
    incentivesBlocked: boolean;
    paymentDeferred: boolean;
}
export declare class PayrollEvaluationService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    evaluateHold(employeeId: string): Promise<PayrollHoldEvaluationResult>;
    safeEvaluateHold(employeeId: string): Promise<PayrollHoldEvaluationResult>;
}
