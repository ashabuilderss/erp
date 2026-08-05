import { ExportEngine, ExportDataset } from './export-types';
export declare class CsvExportEngine implements ExportEngine {
    readonly mimeType = "text/csv";
    readonly fileExtension = "csv";
    generate(dataset: ExportDataset): Promise<Buffer>;
    private escapeCsv;
    private toCsv;
}
