import { SiteStatus, SitePhaseStatus, LabourType, VendorStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
export declare class CreateSiteDto {
    name: string;
    location: string;
    status?: SiteStatus;
    startDate?: string;
    endDate?: string;
    budget?: number;
    description?: string;
}
export declare class UpdateSiteDto {
    name?: string;
    location?: string;
    status?: SiteStatus;
    startDate?: string;
    endDate?: string;
    budget?: number;
    description?: string;
}
export declare class QuerySiteDto extends BaseQueryDto {
    status?: SiteStatus;
}
export declare class CreatePhaseDto {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: SitePhaseStatus;
    sortOrder?: number;
}
export declare class UpdatePhaseDto {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: SitePhaseStatus;
    sortOrder?: number;
}
export declare class CreateVendorDto {
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    gstin?: string;
    status?: VendorStatus;
}
export declare class UpdateVendorDto {
    name?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    gstin?: string;
    status?: VendorStatus;
}
export declare class QueryVendorDto extends BaseQueryDto {
}
export declare class CreateMaterialDto {
    name: string;
    category: string;
    unit: string;
    unitPrice?: number;
}
export declare class UpdateMaterialDto {
    name?: string;
    category?: string;
    unit?: string;
    unitPrice?: number;
}
export declare class QueryMaterialDto extends BaseQueryDto {
    category?: string;
}
export declare class UpdateMaterialInwardDto {
    quantity?: number;
    unitPrice?: number;
    receivedDate?: string;
    notes?: string;
    invoiceUrl?: string;
}
export declare class CreateMaterialInwardDto {
    vendorId: string;
    siteId: string;
    materialId: string;
    quantity: number;
    unitPrice: number;
    receivedDate: string;
    notes?: string;
    invoiceUrl?: string;
}
export declare class CreateLabourEntryDto {
    siteId: string;
    labourName: string;
    labourType: LabourType;
    date: string;
    hoursWorked?: number;
    wagesAmount: number;
    notes?: string;
}
export declare class CreateConsumptionDto {
    siteId: string;
    phaseId?: string;
    materialId: string;
    quantity: number;
    consumedDate: string;
    notes?: string;
}
export declare class CreateProgressPhotoDto {
    siteId: string;
    photoUrl: string;
    phaseId?: string;
    caption?: string;
    takenAt?: string;
}
