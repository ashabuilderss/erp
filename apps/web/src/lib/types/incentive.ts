export interface Incentive {
  id: string;
  companyId: string;
  title: string;
  description: string;
  award: string;
  value: number | null;
  opportunityLabel: string | null;
  opportunityType: string | null;
  status: string;
  payoutStatus: string;
  winnerId: string | null;
  winner?: { employeeCode: string } | null;
  createdAt: string;
  updatedAt: string;
}
