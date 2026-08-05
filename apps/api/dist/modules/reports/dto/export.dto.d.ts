import { ExportFormat } from '@prisma/client';
export declare class CreateExportDto {
    reportKey: string;
    format: ExportFormat;
    dateFrom?: string;
    dateTo?: string;
    title?: string;
}
export declare class ExportResultDto {
    id: string;
    title: string;
    format: ExportFormat;
    status: string;
    fileUrl?: string;
    csvData?: string;
    bufferBase64?: string;
    mimeType?: string;
    fileExtension?: string;
    summary: string;
    createdAt: Date;
}
