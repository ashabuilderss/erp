import { QuotationStatus } from '@prisma/client';
export declare class QueryQuotationDto {
    page?: number;
    limit?: number;
    status?: QuotationStatus;
    leadId?: string;
    propertyId?: string;
}
