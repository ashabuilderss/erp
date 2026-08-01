export interface SopDocument {
  id: string;
  companyId: string;
  title: string;
  content?: string;
  fileUrl?: string;
  version: string;
  departmentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  department?: { id: string; name: string };
  acknowledgements?: SopAcknowledgement[];
  trainingRecords?: TrainingRecord[];
  deletedAt?: string;
}

export interface SopAcknowledgement {
  id: string;
  sopDocumentId: string;
  employeeId: string;
  acknowledgedAt: string;
  employees?: { id: string; employeeCode?: string; user?: { firstName: string; lastName: string } };
}

export interface TrainingRecord {
  id: string;
  employeeId: string;
  sopDocumentId: string;
  completedAt: string;
  score?: number;
  employees?: { id: string; employeeCode?: string; user?: { firstName: string; lastName: string } };
  sopDocument?: SopDocument;
}

export interface CreateSopDocumentDto {
  title: string;
  content?: string;
  fileUrl?: string;
  departmentId?: string;
}

export interface CreateTrainingRecordDto {
  employeeId: string;
  sopDocumentId: string;
  score?: number;
}
