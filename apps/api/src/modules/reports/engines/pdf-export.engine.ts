import { Injectable } from '@nestjs/common';
import type { TDocumentDefinitions, Content, Table } from 'pdfmake/interfaces';
import { ExportEngine, ExportDataset } from './export-types';

const fonts = {
  Roboto: {
    normal: 'node_modules/pdfmake/build/vfs_fonts.js',
    bold: 'node_modules/pdfmake/build/vfs_fonts.js',
  },
};

interface PdfPrinterInstance {
  createPdfKitDocument(doc: TDocumentDefinitions): {
    on(event: string, cb: (...args: unknown[]) => void): void;
    end(): void;
  };
}

@Injectable()
export class PdfExportEngine implements ExportEngine {
  readonly mimeType = 'application/pdf';
  readonly fileExtension = 'pdf';

  async generate(dataset: ExportDataset): Promise<Buffer> {
    const PdfPrinterConstructor: new (
      f: typeof fonts,
    ) => PdfPrinterInstance = require('pdfmake');
    const printer = new PdfPrinterConstructor(fonts);

    const headerRow = dataset.headers.map((h) => ({
      text: h,
      style: 'tableHeader',
      bold: true,
    }));

    const bodyRows: Content[][] = dataset.rows.map((row) =>
      row.map((cell) => ({ text: String(cell ?? ''), style: 'tableData' })),
    );

    const table: Table = {
      widths: dataset.headers.map(() => '*'),
      headerRows: 1,
      body: [headerRow, ...bodyRows],
    };

    const docDefinition: TDocumentDefinitions = {
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

    return new Promise<Buffer>((resolve, reject) => {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }
}
