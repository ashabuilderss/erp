import { SiteVisitStatus } from '@prisma/client';
export declare class CreateSiteVisitDto {
    propertyId: string;
    customerId: string;
    leadId?: string;
    scheduledDate: string;
    status?: SiteVisitStatus;
    notes?: string;
    feedback?: string;
    assignedToEmployeeId: string;
}
