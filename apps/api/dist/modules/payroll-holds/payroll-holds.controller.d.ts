import { HoldActivationListener } from './hold-activation.listener';
import { HoldReleaseService } from './hold-release.service';
import { CreateEmergencyHoldDto, ReleaseHoldDto } from './dto/payroll-holds.dto';
import { PrismaService } from '../../config/prisma.service';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
export declare class PayrollHoldsController {
    private readonly activationListener;
    private readonly releaseService;
    private readonly prisma;
    constructor(activationListener: HoldActivationListener, releaseService: HoldReleaseService, prisma: PrismaService);
    createEmergencyHold(req: AuthenticatedRequest, dto: CreateEmergencyHoldDto): Promise<{
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
    requestRelease(id: string, req: AuthenticatedRequest, dto: ReleaseHoldDto): Promise<{
        status: string;
    }>;
    getHolds(req: AuthenticatedRequest, employeeId?: string): Promise<{
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
    }[]>;
    getHoldDetails(id: string, req: AuthenticatedRequest): Promise<({
        payrollHoldHistories: {
            comments: string | null;
            id: string;
            createdAt: Date;
            companyId: string;
            actorId: string | null;
            event: string;
            holdId: string;
        }[];
    } & {
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
    }) | null>;
}
