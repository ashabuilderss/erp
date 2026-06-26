export type CommissionStatus = "PENDING" | "APPROVED" | "PAID" | "CANCELLED";

export interface PipelineCommission {
  id: string;
  companyId: string;
  leadId: string | null;
  bookingId: string | null;
  employeeId: string;
  amount: number;
  percentage: number | null;
  status: CommissionStatus;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}
