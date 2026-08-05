import { EodReportsService } from './eod-reports.service';
import { CreateEodReportDto, UpdateEodReportDto } from './dto/create-eod-report.dto';
import { QueryEodReportDto } from './dto/query-eod-report.dto';
export declare class EodReportsController {
    private readonly service;
    constructor(service: EodReportsService);
    findAll(query: QueryEodReportDto, companyId: string): Promise<({
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
    findMy(query: QueryEodReportDto, employeeId: string, companyId: string): Promise<{
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
    review(id: string, dto: UpdateEodReportDto, currentEmployeeId: string, companyId: string): Promise<{
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
