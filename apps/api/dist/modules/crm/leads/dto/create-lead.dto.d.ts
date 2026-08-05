import { LeadSource, LeadStatus } from '@prisma/client';
export declare class CreateLeadDto {
    propertyId?: string;
    customerId?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    source?: LeadSource;
    status?: LeadStatus;
    notes?: string;
    assignedToEmployeeId?: string;
}
