import { Injectable } from '@nestjs/common';
import { ExportEngine, ExportDataset } from './export-types';

@Injectable()
export class CsvExportEngine implements ExportEngine {
  readonly mimeType = 'text/csv';
  readonly fileExtension = 'csv';

  async generate(dataset: ExportDataset): Promise<Buffer> {
    const csv = this.toCsv(dataset);
    return Buffer.from(csv, 'utf-8');
  }

  private escapeCsv(val: string | number | boolean | null | undefined): string {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private toCsv(dataset: ExportDataset): string {
    const headerLine = dataset.headers.join(',');
    const dataLines = dataset.rows.map((row) =>
      row.map((v) => this.escapeCsv(v)).join(','),
    );
    return [headerLine, ...dataLines].join('\n');
  }
}
