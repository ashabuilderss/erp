import { FilePolicyService } from './file-policy.service';
import { StorageProvider } from './storage/storage-provider.interface';
export declare class UploadsController {
    private readonly filePolicyService;
    private readonly storage;
    constructor(filePolicyService: FilePolicyService, storage: StorageProvider);
    getPolicy(): {
        maxSizeBytes: number;
        allowedExtensions: string[];
        allowedMimeTypes: string[];
    };
    uploadAvatar(file: Express.Multer.File): Promise<import("./storage/storage-provider.interface").UploadResult>;
    uploadPropertyImages(files: Express.Multer.File[]): Promise<import("./storage/storage-provider.interface").UploadResult[]>;
    uploadAttendanceSelfie(file: Express.Multer.File): Promise<import("./storage/storage-provider.interface").UploadResult>;
    uploadGeneral(file: Express.Multer.File): Promise<import("./storage/storage-provider.interface").UploadResult>;
    deleteFile(key: string): Promise<{
        success: boolean;
    }>;
}
