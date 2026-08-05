import { PrismaService } from '../../config/prisma.service';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
import { AuditService } from '../audit/audit.service';
export interface RegisterDocumentInput {
    companyId: string;
    name: string;
    fileType: string;
    fileSize: number;
    category?: string;
    storageObjectId: string;
    uploadedById: string;
    accessLevel?: string;
}
export interface DeleteDocumentInput {
    companyId: string;
    documentId: string;
    userId: string;
}
export declare class DocumentRegistryService {
    private readonly prisma;
    private readonly eventPublisher;
    private readonly auditService;
    constructor(prisma: PrismaService, eventPublisher: GovernanceEventPublisher, auditService: AuditService);
    register(input: RegisterDocumentInput): Promise<string>;
    delete(input: DeleteDocumentInput): Promise<void>;
    getDocument(id: string, companyId: string): Promise<{
        users: {
            id: string;
            firstName: string;
            lastName: string;
        };
        storageObjects: {
            id: string;
            bucketName: string;
            objectKey: string;
            checksum: string | null;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: string;
        storageObjectId: string;
        category: import(".prisma/client").$Enums.DocumentCategory;
        uploadedById: string;
        fileSize: number;
        fileType: string;
        accessLevel: string;
    }>;
    listDocuments(companyId: string, options: {
        page?: number;
        limit?: number;
        category?: string;
    }): Promise<{
        data: ({
            users: {
                id: string;
                firstName: string;
                lastName: string;
            };
            storageObjects: {
                id: string;
                bucketName: string;
                objectKey: string;
            };
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            status: string;
            storageObjectId: string;
            category: import(".prisma/client").$Enums.DocumentCategory;
            uploadedById: string;
            fileSize: number;
            fileType: string;
            accessLevel: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
