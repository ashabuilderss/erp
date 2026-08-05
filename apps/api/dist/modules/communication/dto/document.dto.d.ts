export declare class RegisterDocumentDto {
    name: string;
    fileType: string;
    fileSize: number;
    category?: string;
    storageObjectId: string;
    accessLevel?: string;
}
export declare class DeleteDocumentDto {
    documentId: string;
}
export declare class LogDocumentAccessDto {
    documentId: string;
    action: string;
}
