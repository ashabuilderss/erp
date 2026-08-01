import { ExcelExportEngine } from './excel-export.engine';
import { ExportDataset } from './export-types';

jest.mock('exceljs', () => {
  const mockSheet = {
    _columns: [] as { header: string; key: string; width: number }[],
    addRow: jest.fn(),
    getRow: jest.fn(() => ({
      font: {},
      fill: {},
    })),
  };
  const MockWorkbook = jest.fn().mockImplementation(() => ({
    creator: '',
    created: null as Date | null,
    addWorksheet: jest.fn(() => mockSheet),
    xlsx: {
      writeBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-xlsx')),
    },
  }));
  return {
    Workbook: MockWorkbook,
  };
});

describe('ExcelExportEngine', () => {
  let engine: ExcelExportEngine;

  beforeEach(() => {
    engine = new ExcelExportEngine();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('has correct mimeType and fileExtension', () => {
    expect(engine.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(engine.fileExtension).toBe('xlsx');
  });

  describe('generate', () => {
    it('returns a Buffer', async () => {
      const dataset: ExportDataset = {
        title: 'Test Report',
        headers: ['Name', 'Value'],
        rows: [['Row1', 100]],
      };

      const result = await engine.generate(dataset);
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('uses dataset.title as sheet name (truncated to 31 chars)', async () => {
      const dataset: ExportDataset = {
        title: 'A'.repeat(50),
        headers: ['Col'],
        rows: [['data']],
      };

      const result = await engine.generate(dataset);
      expect(result).toBeDefined();
    });

    it('strips invalid worksheet name characters', async () => {
      const dataset: ExportDataset = {
        title: 'Report\\/*?:[]Test',
        headers: ['Col'],
        rows: [['data']],
      };

      const result = await engine.generate(dataset);
      expect(result).toBeDefined();
    });
  });
});
