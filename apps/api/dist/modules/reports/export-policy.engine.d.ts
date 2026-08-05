import { PrismaService } from '../../config/prisma.service';
export interface ExportRequest {
    companyId: string;
    userId: string;
    userRole: string;
    dataset: string;
    format: 'CSV' | 'SHEET' | 'PDF';
    rowCount: number;
}
export declare class ExportPolicyEngine {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    evaluateAndLog(req: ExportRequest): Promise<void>;
}
