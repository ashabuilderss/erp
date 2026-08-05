export interface ExportDataset {
    readonly headers: readonly string[];
    readonly rows: readonly (string | number | boolean | null | undefined)[][];
    readonly title: string;
    readonly sheetName?: string;
}
export interface ExportEngine {
    generate(dataset: ExportDataset): Promise<Buffer>;
    readonly mimeType: string;
    readonly fileExtension: string;
}
