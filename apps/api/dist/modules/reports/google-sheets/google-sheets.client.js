"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GoogleSheetsClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSheetsClient = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
let GoogleSheetsClient = GoogleSheetsClient_1 = class GoogleSheetsClient {
    logger = new common_1.Logger(GoogleSheetsClient_1.name);
    client = null;
    getClient() {
        if (this.client)
            return this.client;
        const credentials = this.buildCredentials();
        if (!credentials) {
            throw new Error('Google Service Account credentials not configured');
        }
        const auth = new googleapis_1.google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        this.client = googleapis_1.google.sheets({ version: 'v4', auth });
        return this.client;
    }
    buildCredentials() {
        const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const key = process.env.GOOGLE_PRIVATE_KEY;
        if (!email || !key)
            return null;
        return {
            client_email: email,
            private_key: key.replace(/\\n/g, '\n'),
        };
    }
    async clearSheet(sheetId, range) {
        const client = this.getClient();
        await client.spreadsheets.values.clear({
            spreadsheetId: sheetId,
            range,
        });
        this.logger.log(`Cleared range ${range} in sheet ${sheetId}`);
    }
    async appendRows(sheetId, range, values) {
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
    async getSpreadsheetTitle(sheetId) {
        const client = this.getClient();
        const response = await client.spreadsheets.get({
            spreadsheetId: sheetId,
            fields: 'properties.title',
        });
        return response.data.properties?.title ?? '';
    }
    async sheetExists(sheetId) {
        try {
            const client = this.getClient();
            await client.spreadsheets.get({
                spreadsheetId: sheetId,
                fields: 'spreadsheetId',
            });
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.GoogleSheetsClient = GoogleSheetsClient;
exports.GoogleSheetsClient = GoogleSheetsClient = GoogleSheetsClient_1 = __decorate([
    (0, common_1.Injectable)()
], GoogleSheetsClient);
//# sourceMappingURL=google-sheets.client.js.map