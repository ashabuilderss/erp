export declare class CreateQuotationDto {
    referenceNumber: string;
    leadId?: string;
    propertyId?: string;
    customerId?: string;
    totalAmount: number;
    breakdown: Record<string, any>;
    validUntil: string;
    notes?: string;
}
