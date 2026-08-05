import { PrismaService } from '../../config/prisma.service';
import { ApprovalStatus } from '@prisma/client';
import { CreateEmergencyHoldDto } from './dto/payroll-holds.dto';
export declare class HoldActivationListener {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    processActivationOutcome(approvalId: string, status: ApprovalStatus): Promise<void>;
    createEmergencyHold(companyId: string, ownerUserId: string, dto: CreateEmergencyHoldDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        createdById: string | null;
        status: import(".prisma/client").$Enums.PayrollHoldStatus;
        reason: string;
        approvalId: string | null;
        employeeId: string;
        source: import(".prisma/client").$Enums.PayrollHoldSource;
        amount: import("@prisma/client-runtime-utils").Decimal | null;
        sourceId: string | null;
        holdType: import(".prisma/client").$Enums.PayrollHoldType;
        evidenceUri: string | null;
    }>;
}
