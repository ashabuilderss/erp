export declare const MAX_UPLOAD_SIZE_BYTES: number;
export interface FilePolicyInput {
    originalname: string;
    mimetype: string;
    size: number;
}
export interface FilePolicyResult {
    extension: string;
    maxSizeBytes: number;
    allowed: true;
}
export declare class FilePolicyService {
    validate(file: FilePolicyInput, imageOnly?: boolean): FilePolicyResult;
    getPolicy(): {
        maxSizeBytes: number;
        allowedExtensions: string[];
        allowedMimeTypes: string[];
    };
}
