import { AgreementsService } from './agreements.service';
import { CreateAgreementDto, UpdateAgreementDto, QueryAgreementDto, ApproveStepDto } from './dto/create-agreement.dto';
export declare class AgreementsController {
    private readonly agreementsService;
    constructor(agreementsService: AgreementsService);
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
            attachments: import("@prisma/client/runtime/client").JsonValue | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(companyId: string, userId: string, dto: CreateAgreementDto): Promise<{
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
        attachments: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    findOne(companyId: string, id: string): Promise<{
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
        attachments: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    update(companyId: string, id: string, dto: UpdateAgreementDto): Promise<{
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
        attachments: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    remove(companyId: string, id: string): Promise<{
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
        attachments: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    submit(companyId: string, id: string): Promise<{
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
        attachments: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    approve(companyId: string, userId: string, id: string, dto: ApproveStepDto): Promise<({
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
        attachments: import("@prisma/client/runtime/client").JsonValue | null;
    }) | null>;
    archive(companyId: string, id: string): Promise<{
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
        attachments: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
}
