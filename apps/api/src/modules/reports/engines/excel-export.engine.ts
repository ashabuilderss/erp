import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { ExportEngine, ExportDataset } from './export-types';

@Injectable()
export class ExcelExportEngine implements ExportEngine {
  readonly mimeType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  readonly fileExtension = 'xlsx';

  async generate(dataset: ExportDataset): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ASHA Builders ERP';
    workbook.created = new Date();

    const sheetName =
      dataset.sheetName ||
      dataset.title.slice(0, 31).replace(/[\\/*?:[\]]/g, '');
    const sheet = workbook.addWorksheet(sheetName);

    sheet.columns = dataset.headers.map((h) => ({
      header: h,
      key: h,
      width: Math.max(h.length + 2, 15),
    }));

    for (const row of dataset.rows) {
      const record: Record<
        string,
        string | number | boolean | null | undefined
      > = {};
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
}
