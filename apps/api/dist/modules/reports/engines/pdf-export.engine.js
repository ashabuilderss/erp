"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfExportEngine = void 0;
const common_1 = require("@nestjs/common");
const fonts = {
    Roboto: {
        normal: 'node_modules/pdfmake/build/vfs_fonts.js',
        bold: 'node_modules/pdfmake/build/vfs_fonts.js',
    },
};
let PdfExportEngine = class PdfExportEngine {
    mimeType = 'application/pdf';
    fileExtension = 'pdf';
    async generate(dataset) {
        const PdfPrinterConstructor = require('pdfmake');
        const printer = new PdfPrinterConstructor(fonts);
        const headerRow = dataset.headers.map((h) => ({
            text: h,
            style: 'tableHeader',
            bold: true,
        }));
        const bodyRows = dataset.rows.map((row) => row.map((cell) => ({ text: String(cell ?? ''), style: 'tableData' })));
        const table = {
            widths: dataset.headers.map(() => '*'),
            headerRows: 1,
            body: [headerRow, ...bodyRows],
        };
        const docDefinition = {
            content: [
                { text: dataset.title, style: 'title' },
                {
                    text: `Generated: ${new Date().toLocaleDateString()}`,
                    style: 'subtitle',
                },
                { text: '', margin: [0, 5, 0, 10] },
                { table },
            ],
            defaultStyle: { fontSize: 9, font: 'Roboto' },
            styles: {
                title: { fontSize: 16, bold: true, margin: [0, 0, 0, 5] },
                subtitle: { fontSize: 10, color: '#666', margin: [0, 0, 0, 10] },
                tableHeader: {
                    fontSize: 9,
                    bold: true,
                    color: '#FFFFFF',
                    fillColor: '#2E4057',
                },
                tableData: { fontSize: 8 },
            },
        };
        return new Promise((resolve, reject) => {
            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            const chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
        });
    }
};
exports.PdfExportEngine = PdfExportEngine;
exports.PdfExportEngine = PdfExportEngine = __decorate([
    (0, common_1.Injectable)()
], PdfExportEngine);
//# sourceMappingURL=pdf-export.engine.js.map