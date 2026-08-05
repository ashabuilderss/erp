import { PrismaService } from '../../../config/prisma.service';
import { CreateEvidenceReviewDto } from './dto/create-evidence-review.dto';
import { QueryEvidenceReviewDto } from './dto/query-evidence-review.dto';
import { ReviewEvidenceDto } from './dto/review-evidence.dto';
import { GovernanceEventPublisher } from '../../governance-events/governance-event.publisher';
import { StorageProvider } from '../../uploads/storage/storage-provider.interface';
export declare class EvidenceReviewService {
    private readonly prisma;
    private readonly eventPublisher;
    private readonly storageProvider;
    constructor(prisma: PrismaService, eventPublisher: GovernanceEventPublisher, storageProvider: StorageProvider);
    create(dto: CreateEvidenceReviewDto, companyId: string, reviewedById: string): Promise<{
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
    findAll(dto: QueryEvidenceReviewDto, companyId: string): Promise<{
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
    getForView(id: string, companyId: string): Promise<{
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
