export interface UploadResult {
    url: string;
    key: string;
    size: number;
    mimetype: string;
}
export interface StorageProvider {
    upload(file: {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
        size: number;
    }): Promise<UploadResult>;
    delete(key: string): Promise<void>;
    getUrl(key: string): Promise<string>;
}
