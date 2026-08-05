import { ExportEngine, ExportDataset } from './export-types';
export declare class PdfExportEngine implements ExportEngine {
    readonly mimeType = "application/pdf";
    readonly fileExtension = "pdf";
    generate(dataset: ExportDataset): Promise<Buffer>;
}
