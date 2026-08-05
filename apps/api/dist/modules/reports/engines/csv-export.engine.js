"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvExportEngine = void 0;
const common_1 = require("@nestjs/common");
let CsvExportEngine = class CsvExportEngine {
    mimeType = 'text/csv';
    fileExtension = 'csv';
    async generate(dataset) {
        const csv = this.toCsv(dataset);
        return Buffer.from(csv, 'utf-8');
    }
    escapeCsv(val) {
        if (val === null || val === undefined)
            return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }
    toCsv(dataset) {
        const headerLine = dataset.headers.join(',');
        const dataLines = dataset.rows.map((row) => row.map((v) => this.escapeCsv(v)).join(','));
        return [headerLine, ...dataLines].join('\n');
    }
};
exports.CsvExportEngine = CsvExportEngine;
exports.CsvExportEngine = CsvExportEngine = __decorate([
    (0, common_1.Injectable)()
], CsvExportEngine);
//# sourceMappingURL=csv-export.engine.js.map