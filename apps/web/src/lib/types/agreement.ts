export type AgreementType = "CIVIL" | "STRUCTURE" | "OPERATIONS";
export type AgreementStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "ARCHIVED";

export interface Agreement {
  id: string;
  companyId: string;
  title: string;
  type: AgreementType;
  status: AgreementStatus;
  content?: string;
  attachments?: unknown;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  approvals?: AgreementApproval[];
  deletedAt?: string;
}

export interface AgreementApproval {
  id: string;
  agreementId: string;
  approverId: string;
  step: number;
  status: string;
  comments?: string;
  createdAt: string;
}

export interface CreateAgreementDto {
  title: string;
  type: AgreementType;
  content?: string;
  attachments?: unknown;
}

export interface UpdateAgreementDto {
  title?: string;
  type?: AgreementType;
  content?: string;
  status?: AgreementStatus;
}

export interface AgreementQuery {
  page?: number;
  limit?: number;
  status?: AgreementStatus;
  type?: AgreementType;
  search?: string;
}
