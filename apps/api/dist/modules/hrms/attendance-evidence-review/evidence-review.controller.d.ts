import { EvidenceReviewService } from './evidence-review.service';
import { CreateEvidenceReviewDto } from './dto/create-evidence-review.dto';
import { QueryEvidenceReviewDto } from './dto/query-evidence-review.dto';
import { ReviewEvidenceDto } from './dto/review-evidence.dto';
export declare class EvidenceReviewController {
    private readonly service;
    constructor(service: EvidenceReviewService);
    create(dto: CreateEvidenceReviewDto, companyId: string, reviewerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.EvidenceReviewStatus;
        remarks: string | null;
        punchId: string | null;
        evidenceId: string;
        reviewedById: string;
        reviewedAt: Date | null;
    }>;
    findAll(query: QueryEvidenceReviewDto, companyId: string): Promise<{
        items: {
            punch: {
                id: string;
                createdAt: Date;
                companyId: string;
                deletedAt: Date | null;
                timestamp: Date;
                employeeId: string;
                punchType: import(".prisma/client").$Enums.PunchType;
                deviceId: string | null;
                locationId: string | null;
                latitude: import("@prisma/client-runtime-utils").Decimal | null;
                longitude: import("@prisma/client-runtime-utils").Decimal | null;
                clientGeneratedUuid: string | null;
                payloadHash: string | null;
                locationMismatch: boolean;
            } | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.EvidenceReviewStatus;
            remarks: string | null;
            punchId: string | null;
            evidenceId: string;
            reviewedById: string;
            reviewedAt: Date | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    queue(companyId: string): Promise<{
        items: {
            punch: {
                id: string;
                createdAt: Date;
                companyId: string;
                deletedAt: Date | null;
                timestamp: Date;
                employeeId: string;
                punchType: import(".prisma/client").$Enums.PunchType;
                deviceId: string | null;
                locationId: string | null;
                latitude: import("@prisma/client-runtime-utils").Decimal | null;
                longitude: import("@prisma/client-runtime-utils").Decimal | null;
                clientGeneratedUuid: string | null;
                payloadHash: string | null;
                locationMismatch: boolean;
            } | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.EvidenceReviewStatus;
            remarks: string | null;
            punchId: string | null;
            evidenceId: string;
            reviewedById: string;
            reviewedAt: Date | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.EvidenceReviewStatus;
        remarks: string | null;
        punchId: string | null;
        evidenceId: string;
        reviewedById: string;
        reviewedAt: Date | null;
    }>;
    view(id: string, companyId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.EvidenceReviewStatus;
        reviewedById: string;
        reviewedAt: Date | null;
        remarks: string | null;
        createdAt: Date;
        companyId: string;
        evidence: {
            id: string | undefined;
            type: import(".prisma/client").$Enums.EvidenceType | undefined;
            punchId: string | null | undefined;
            gpsAccuracy: import("@prisma/client-runtime-utils").Decimal | null | undefined;
            mockLocationDetected: boolean | undefined;
            developerModeActive: boolean | undefined;
        };
        punch: {
            id: string;
            punchType: import(".prisma/client").$Enums.PunchType;
            timestamp: Date;
            latitude: import("@prisma/client-runtime-utils").Decimal | null;
            longitude: import("@prisma/client-runtime-utils").Decimal | null;
            deviceId: string | null;
            locationId: string | null;
        } | null;
        selfieUrl: string | null;
    }>;
    review(id: string, dto: ReviewEvidenceDto, companyId: string, reviewerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.EvidenceReviewStatus;
        remarks: string | null;
        punchId: string | null;
        evidenceId: string;
        reviewedById: string;
        reviewedAt: Date | null;
    }>;
    remove(id: string, companyId: string): Promise<{
        deleted: boolean;
    }>;
}
