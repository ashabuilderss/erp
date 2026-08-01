import { Injectable, Logger } from '@nestjs/common';
import { google, sheets_v4 } from 'googleapis';

export interface SheetAppendResult {
  updatedRows: number;
  updatedCells: number;
}

@Injectable()
export class GoogleSheetsClient {
  private readonly logger = new Logger(GoogleSheetsClient.name);
  private client: sheets_v4.Sheets | null = null;

  private getClient(): sheets_v4.Sheets {
    if (this.client) return this.client;

    const credentials = this.buildCredentials();
    if (!credentials) {
      throw new Error('Google Service Account credentials not configured');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.client = google.sheets({ version: 'v4', auth });
    return this.client;
  }

  private buildCredentials() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY;
    if (!email || !key) return null;
    return {
      client_email: email,
      private_key: key.replace(/\\n/g, '\n'),
    };
  }

  async clearSheet(sheetId: string, range: string): Promise<void> {
    const client = this.getClient();
    await client.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range,
    });
    this.logger.log(`Cleared range ${range} in sheet ${sheetId}`);
  }

  async appendRows(
    sheetId: string,
    range: string,
    values: (string | number | boolean | null)[][],
  ): Promise<SheetAppendResult> {
    const client = this.getClient();
    const response = await client.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    const updated = response.data.updates;
    return {
      updatedRows: updated?.updatedRows ?? 0,
      updatedCells: updated?.updatedCells ?? 0,
    };
  }

  async getSpreadsheetTitle(sheetId: string): Promise<string> {
    const client = this.getClient();
    const response = await client.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: 'properties.title',
    });
    return response.data.properties?.title ?? '';
  }

  async sheetExists(sheetId: string): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.spreadsheets.get({
        spreadsheetId: sheetId,
        fields: 'spreadsheetId',
      });
      return true;
    } catch {
      return false;
    }
  }
}
