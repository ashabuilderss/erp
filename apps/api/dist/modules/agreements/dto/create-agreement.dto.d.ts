import { AgreementType, AgreementStatus } from '@prisma/client';
export declare class QueryAgreementDto {
    page?: number;
    limit?: number;
    search?: string;
    type?: AgreementType;
    status?: AgreementStatus;
}
export declare class CreateApprovalStepDto {
    approverId: string;
    step: number;
}
export declare class CreateAgreementDto {
    title: string;
    type: AgreementType;
    content?: string;
    attachments?: any;
    approvalSteps?: CreateApprovalStepDto[];
}
export declare class UpdateAgreementDto {
    title?: string;
    type?: AgreementType;
    content?: string;
    attachments?: any;
}
export declare class ApproveStepDto {
    comments?: string;
}
