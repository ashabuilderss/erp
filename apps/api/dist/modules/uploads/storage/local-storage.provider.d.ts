import { StorageProvider, UploadResult } from './storage-provider.interface';
export declare class LocalStorageProvider implements StorageProvider {
    upload(file: {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
        size: number;
    }): Promise<UploadResult>;
    delete(key: string): Promise<void>;
    getUrl(key: string): Promise<string>;
}
