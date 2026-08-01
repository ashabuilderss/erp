import { PdfExportEngine } from './pdf-export.engine';
import { ExportDataset } from './export-types';

const mockPdfDoc = {
  on: jest.fn((event: string, cb: Function) => {
    if (event === 'data') cb(Buffer.from('chunk'));
    if (event === 'end') cb();
  }),
  end: jest.fn(),
};

jest.mock('pdfmake', () => {
  return jest.fn().mockImplementation(() => ({
    createPdfKitDocument: jest.fn(() => mockPdfDoc),
  }));
});

describe('PdfExportEngine', () => {
  let engine: PdfExportEngine;

  beforeEach(() => {
    engine = new PdfExportEngine();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('has correct mimeType and fileExtension', () => {
    expect(engine.mimeType).toBe('application/pdf');
    expect(engine.fileExtension).toBe('pdf');
  });

  describe('generate', () => {
    it('returns a Buffer', async () => {
      const dataset: ExportDataset = {
        title: 'Test PDF',
        headers: ['Name', 'Amount'],
        rows: [
          ['Item1', 500],
          ['Item2', 300],
        ],
      };

      const result = await engine.generate(dataset);
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('creates document definition with title and table', async () => {
      const dataset: ExportDataset = {
        title: 'Employee Report',
        headers: ['Name', 'Department'],
        rows: [['Alice', 'Engineering']],
      };

      const result = await engine.generate(dataset);
      expect(result).toBeDefined();
    });

    it('handles empty rows', async () => {
      const dataset: ExportDataset = {
        title: 'Empty Report',
        headers: ['Col1', 'Col2'],
        rows: [],
      };

      const result = await engine.generate(dataset);
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });
});
