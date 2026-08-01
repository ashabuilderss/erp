import { CsvExportEngine } from './csv-export.engine';
import { ExportDataset } from './export-types';

describe('CsvExportEngine', () => {
  let engine: CsvExportEngine;

  beforeEach(() => {
    engine = new CsvExportEngine();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('has correct mimeType and fileExtension', () => {
    expect(engine.mimeType).toBe('text/csv');
    expect(engine.fileExtension).toBe('csv');
  });

  describe('generate', () => {
    it('produces CSV with header row and data rows', async () => {
      const dataset: ExportDataset = {
        title: 'Test',
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', 30, 'Mumbai'],
          ['Bob', 25, 'Delhi'],
        ],
      };

      const buffer = await engine.generate(dataset);
      const csv = buffer.toString('utf-8');
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Name,Age,City');
      expect(lines[1]).toBe('Alice,30,Mumbai');
      expect(lines[2]).toBe('Bob,25,Delhi');
    });

    it('escapes values containing commas', async () => {
      const dataset: ExportDataset = {
        title: 'Test',
        headers: ['Address'],
        rows: [['Mumbai, Maharashtra']],
      };

      const buffer = await engine.generate(dataset);
      const csv = buffer.toString('utf-8');

      expect(csv).toContain('"Mumbai, Maharashtra"');
    });

    it('escapes values containing double quotes', async () => {
      const dataset: ExportDataset = {
        title: 'Test',
        headers: ['Note'],
        rows: [['She said "hello"']],
      };

      const buffer = await engine.generate(dataset);
      const csv = buffer.toString('utf-8');

      expect(csv).toContain('"She said ""hello"""');
    });

    it('escapes values containing newlines', async () => {
      const dataset: ExportDataset = {
        title: 'Test',
        headers: ['Description'],
        rows: [['Line1\nLine2']],
      };

      const buffer = await engine.generate(dataset);
      const csv = buffer.toString('utf-8');

      expect(csv).toContain('"Line1\nLine2"');
    });

    it('returns empty string for null/undefined values', async () => {
      const dataset: ExportDataset = {
        title: 'Test',
        headers: ['A', 'B'],
        rows: [[null, undefined]],
      };

      const buffer = await engine.generate(dataset);
      const csv = buffer.toString('utf-8');
      const lines = csv.split('\n');

      expect(lines[1]).toBe(',');
    });

    it('handles empty rows', async () => {
      const dataset: ExportDataset = {
        title: 'Test',
        headers: ['Col1'],
        rows: [],
      };

      const buffer = await engine.generate(dataset);
      const csv = buffer.toString('utf-8');

      expect(csv).toBe('Col1');
    });

    it('handles boolean values', async () => {
      const dataset: ExportDataset = {
        title: 'Test',
        headers: ['Active'],
        rows: [[true], [false]],
      };

      const buffer = await engine.generate(dataset);
      const csv = buffer.toString('utf-8');

      expect(csv).toContain('true');
      expect(csv).toContain('false');
    });
  });
});
