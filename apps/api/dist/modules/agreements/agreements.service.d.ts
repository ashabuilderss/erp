import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import { CreateAgreementDto, UpdateAgreementDto, QueryAgreementDto } from './dto/create-agreement.dto';
import { Prisma } from '@prisma/client';
export declare class AgreementsService {
    private prisma;
    private transitionService;
    constructor(prisma: PrismaService, transitionService: TransitionService);
    findAll(companyId: string, query: QueryAgreementDto): Promise<{
        data: ({
            _count: {
                approvals: number;
            };
            createdBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            type: import(".prisma/client").$Enums.AgreementType;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            createdById: string;
            status: import(".prisma/client").$Enums.AgreementStatus;
            title: string;
            content: string | null;
            attachments: Prisma.JsonValue | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(dto: CreateAgreementDto, createdById: string, companyId: string): Promise<{
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        approvals: ({
            approver: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            comments: string | null;
            step: number;
            id: string;
            companyId: string;
            status: string;
            timestamp: Date;
            agreementId: string;
            approverId: string;
        })[];
    } & {
        type: import(".prisma/client").$Enums.AgreementType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        createdById: string;
        status: import(".prisma/client").$Enums.AgreementStatus;
        title: string;
        content: string | null;
        attachments: Prisma.JsonValue | null;
    }>;
    findOne(id: string, companyId: string): Promise<{
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        approvals: ({
            approver: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            comments: string | null;
            step: number;
            id: string;
            companyId: string;
            status: string;
            timestamp: Date;
            agreementId: string;
            approverId: string;
        })[];
    } & {
        type: import(".prisma/client").$Enums.AgreementType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        createdById: string;
        status: import(".prisma/client").$Enums.AgreementStatus;
        title: string;
        content: string | null;
        attachments: Prisma.JsonValue | null;
    }>;
    update(id: string, dto: UpdateAgreementDto, companyId: string): Promise<{
        type: import(".prisma/client").$Enums.AgreementType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        createdById: string;
        status: import(".prisma/client").$Enums.AgreementStatus;
        title: string;
        content: string | null;
        attachments: Prisma.JsonValue | null;
    }>;
    remove(id: string, companyId: string): Promise<{
        type: import(".prisma/client").$Enums.AgreementType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        createdById: string;
        status: import(".prisma/client").$Enums.AgreementStatus;
        title: string;
        content: string | null;
        attachments: Prisma.JsonValue | null;
    }>;
    submit(id: string, companyId: string): Promise<{
        type: import(".prisma/client").$Enums.AgreementType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        createdById: string;
        status: import(".prisma/client").$Enums.AgreementStatus;
        title: string;
        content: string | null;
        attachments: Prisma.JsonValue | null;
    }>;
    approve(id: string, approverId: string, companyId: string, comments?: string): Promise<({
        approvals: ({
            approver: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            comments: string | null;
            step: number;
            id: string;
            companyId: string;
            status: string;
            timestamp: Date;
            agreementId: string;
            approverId: string;
        })[];
    } & {
        type: import(".prisma/client").$Enums.AgreementType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        createdById: string;
        status: import(".prisma/client").$Enums.AgreementStatus;
        title: string;
        content: string | null;
        attachments: Prisma.JsonValue | null;
    }) | null>;
    archive(id: string, companyId: string): Promise<{
        type: import(".prisma/client").$Enums.AgreementType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        createdById: string;
        status: import(".prisma/client").$Enums.AgreementStatus;
        title: string;
        content: string | null;
        attachments: Prisma.JsonValue | null;
    }>;
}
