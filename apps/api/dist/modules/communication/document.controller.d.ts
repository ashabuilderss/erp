import { DocumentRegistryService } from './document-registry.service';
import { DocumentAccessService } from './document-access.service';
import { RegisterDocumentDto, LogDocumentAccessDto } from './dto/document.dto';
import { QueryDocumentDto, QueryAccessLogDto } from './dto/query-document.dto';
export declare class DocumentController {
    private readonly documentRegistryService;
    private readonly accessService;
    constructor(documentRegistryService: DocumentRegistryService, accessService: DocumentAccessService);
    register(dto: RegisterDocumentDto, companyId: string, userId: string): Promise<{
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
    logAccess(dto: LogDocumentAccessDto, companyId: string, userId: string): Promise<{
        id: string;
    }>;
    list(companyId: string, query: QueryDocumentDto): Promise<{
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
    getOne(id: string, companyId: string): Promise<{
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
    getAccessLogs(id: string, companyId: string, query: QueryAccessLogDto): Promise<{
        data: ({
            users: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            companyId: string;
            deletedAt: Date | null;
            action: string;
            userId: string;
            ipAddress: string | null;
            userAgent: string | null;
            documentId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getAccessStats(id: string, companyId: string): Promise<{
        totalAccesses: number;
        uniqueUserCount: number;
    }>;
    delete(id: string, companyId: string, userId: string): Promise<{
        success: boolean;
    }>;
}
