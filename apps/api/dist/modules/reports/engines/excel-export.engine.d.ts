import { ExportEngine, ExportDataset } from './export-types';
export declare class ExcelExportEngine implements ExportEngine {
    readonly mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    readonly fileExtension = "xlsx";
    generate(dataset: ExportDataset): Promise<Buffer>;
}
