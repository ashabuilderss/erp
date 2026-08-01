export type AssetStatus = "AVAILABLE" | "ASSIGNED" | "IN_REPAIR" | "RETIRED";

export interface Asset {
  id: string;
  companyId: string;
  name: string;
  category?: string;
  serialNumber?: string;
  qrCode?: string;
  status: AssetStatus;
  currentAssigneeId?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  createdAt: string;
  updatedAt: string;
  employees?: { id: string; employeeCode?: string; user?: { firstName: string; lastName: string } };
  assignments?: AssetAssignment[];
  repairs?: AssetRepair[];
  deletedAt?: string;
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  employeeId: string;
  assignedAt: string;
  returnedAt?: string;
  condition?: string;
  employees?: { id: string; employeeCode?: string; user?: { firstName: string; lastName: string } };
}

export interface AssetRepair {
  id: string;
  assetId: string;
  description: string;
  cost?: number;
  startDate: string;
  endDate?: string;
  status: string;
}

export interface CreateAssetDto {
  name: string;
  category?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
}

export interface CreateAssetAssignmentDto {
  employeeId: string;
  condition?: string;
}

export interface CreateAssetRepairDto {
  description: string;
  cost?: number;
}

export interface AssetSummary {
  total: number;
  available: number;
  assigned: number;
  inRepair: number;
  retired: number;
}
