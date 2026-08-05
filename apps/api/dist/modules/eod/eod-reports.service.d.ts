import { PrismaService } from '../../config/prisma.service';
import { CreateEodReportDto, UpdateEodReportDto } from './dto/create-eod-report.dto';
export declare class EodReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(companyId: string, date?: string, employeeId?: string): Promise<({
        employeesEodReportsEmployeeIdToemployees: {
            employeeCode: string;
        };
        employeesEodReportsReviewedByIdToemployees: {
            employeeCode: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.EodReportStatus;
        employeeId: string;
        reviewedById: string | null;
        reviewedAt: Date | null;
        reportDate: Date;
        accomplishments: string;
        challenges: string | null;
        tomorrowPlan: string | null;
        photoUrls: string[];
    })[]>;
    findByEmployee(employeeId: string, companyId: string, date?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.EodReportStatus;
        employeeId: string;
        reviewedById: string | null;
        reviewedAt: Date | null;
        reportDate: Date;
        accomplishments: string;
        challenges: string | null;
        tomorrowPlan: string | null;
        photoUrls: string[];
    }[]>;
    findOne(id: string, companyId: string): Promise<{
        employeesEodReportsEmployeeIdToemployees: {
            employeeCode: string;
        };
        employeesEodReportsReviewedByIdToemployees: {
            employeeCode: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.EodReportStatus;
        employeeId: string;
        reviewedById: string | null;
        reviewedAt: Date | null;
        reportDate: Date;
        accomplishments: string;
        challenges: string | null;
        tomorrowPlan: string | null;
        photoUrls: string[];
    }>;
    create(dto: CreateEodReportDto, employeeId: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.EodReportStatus;
        employeeId: string;
        reviewedById: string | null;
        reviewedAt: Date | null;
        reportDate: Date;
        accomplishments: string;
        challenges: string | null;
        tomorrowPlan: string | null;
        photoUrls: string[];
    }>;
    update(id: string, dto: UpdateEodReportDto, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.EodReportStatus;
        employeeId: string;
        reviewedById: string | null;
        reviewedAt: Date | null;
        reportDate: Date;
        accomplishments: string;
        challenges: string | null;
        tomorrowPlan: string | null;
        photoUrls: string[];
    }>;
    review(id: string, dto: UpdateEodReportDto, reviewedById: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.EodReportStatus;
        employeeId: string;
        reviewedById: string | null;
        reviewedAt: Date | null;
        reportDate: Date;
        accomplishments: string;
        challenges: string | null;
        tomorrowPlan: string | null;
        photoUrls: string[];
    }>;
}
