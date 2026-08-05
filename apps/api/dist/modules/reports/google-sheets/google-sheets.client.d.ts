export interface SheetAppendResult {
    updatedRows: number;
    updatedCells: number;
}
export declare class GoogleSheetsClient {
    private readonly logger;
    private client;
    private getClient;
    private buildCredentials;
    clearSheet(sheetId: string, range: string): Promise<void>;
    appendRows(sheetId: string, range: string, values: (string | number | boolean | null)[][]): Promise<SheetAppendResult>;
    getSpreadsheetTitle(sheetId: string): Promise<string>;
    sheetExists(sheetId: string): Promise<boolean>;
}
