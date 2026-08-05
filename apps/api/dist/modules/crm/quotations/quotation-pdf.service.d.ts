import { Quotation } from '@prisma/client';
export declare class QuotationPdfService {
    private readonly logger;
    generateWatermarkedPdf(quotation: Quotation & {
        companies: any;
        createdBy: any;
    }, downloadedByEmail: string): Promise<Buffer>;
}
