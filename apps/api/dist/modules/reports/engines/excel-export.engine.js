"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelExportEngine = void 0;
const common_1 = require("@nestjs/common");
const exceljs_1 = __importDefault(require("exceljs"));
let ExcelExportEngine = class ExcelExportEngine {
    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    fileExtension = 'xlsx';
    async generate(dataset) {
        const workbook = new exceljs_1.default.Workbook();
        workbook.creator = 'ASHA Builders ERP';
        workbook.created = new Date();
        const sheetName = dataset.sheetName ||
            dataset.title.slice(0, 31).replace(/[\\/*?:[\]]/g, '');
        const sheet = workbook.addWorksheet(sheetName);
        sheet.columns = dataset.headers.map((h) => ({
            header: h,
            key: h,
            width: Math.max(h.length + 2, 15),
        }));
        for (const row of dataset.rows) {
            const record = {};
            dataset.headers.forEach((h, i) => {
                record[h] = row[i];
            });
            sheet.addRow(record);
        }
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2E4057' },
        };
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
};
exports.ExcelExportEngine = ExcelExportEngine;
exports.ExcelExportEngine = ExcelExportEngine = __decorate([
    (0, common_1.Injectable)()
], ExcelExportEngine);
//# sourceMappingURL=excel-export.engine.js.map