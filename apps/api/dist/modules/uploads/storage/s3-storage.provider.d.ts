import { StorageProvider, UploadResult } from './storage-provider.interface';
export declare class S3StorageProvider implements StorageProvider {
    private readonly client;
    private readonly bucket;
    private readonly publicUrl;
    constructor();
    upload(file: {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
        size: number;
    }): Promise<UploadResult>;
    delete(key: string): Promise<void>;
    getUrl(key: string): Promise<string>;
}
