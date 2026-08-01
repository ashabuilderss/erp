import { ExportFormat, ReportExportStatus } from '@prisma/client';
import { ExportDataset } from './engines/export-types';

describe('Export E2E - Full Flow', () => {
  const companyId = 'comp-e2e';
  const userId = 'usr-e2e';

  const sampleDataset: ExportDataset = {
    title: 'E2E Test Export',
    headers: ['Name', 'Department', 'Status'],
    rows: [
      ['Alice', 'Engineering', 'ACTIVE'],
      ['Bob', 'Sales', 'ACTIVE'],
      ['Charlie', 'HR', 'INACTIVE'],
    ],
  };

  const buildMocks = () => {
    const prisma = {
      reportExport: {
        create: jest
          .fn()
          .mockResolvedValue({ id: 'exp-e2e', createdAt: new Date() }),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest
        .fn()
        .mockImplementation(async (fn: Function) =>
          fn({ reportExport: { update: jest.fn() } }),
        ),
    };
    const csvEngine = {
      generate: jest.fn().mockImplementation(async (dataset: ExportDataset) => {
        const header = dataset.headers.join(',');
        const lines = dataset.rows.map((r) => r.join(','));
        return Buffer.from([header, ...lines].join('\n'), 'utf-8');
      }),
      mimeType: 'text/csv',
      fileExtension: 'csv',
    };
    const excelEngine = {
      generate: jest.fn().mockResolvedValue(Buffer.from('xlsx-data')),
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileExtension: 'xlsx',
    };
    const pdfEngine = {
      generate: jest.fn().mockResolvedValue(Buffer.from('pdf-data')),
      mimeType: 'application/pdf',
      fileExtension: 'pdf',
    };
    const policyEngine = {
      evaluateAndLog: jest.fn(),
    };
    const auditService = {
      logExport: jest.fn().mockResolvedValue('audit-log-1'),
      logDownload: jest.fn(),
    };
    return {
      prisma,
      csvEngine,
      excelEngine,
      pdfEngine,
      policyEngine,
      auditService,
    };
  };

  describe('CSV export flow', () => {
    it('creates export record, generates CSV, audits, returns result', async () => {
      const mocks = buildMocks();
      const { ExportOrchestrationService } =
        await import('./export-orchestration.service');
      const service = new ExportOrchestrationService(
        mocks.prisma as never,
        mocks.csvEngine as never,
        mocks.excelEngine as never,
        mocks.pdfEngine as never,
        mocks.policyEngine as never,
        mocks.auditService,
      );

      const result = await service.createExport({
        companyId,
        userId,
        userRole: 'HR_MANAGER',
        reportKey: 'employees',
        format: ExportFormat.CSV,
        dataset: sampleDataset,
      });

      expect(result.status).toBe(ReportExportStatus.COMPLETED);
      expect(result.format).toBe(ExportFormat.CSV);
      expect(result.title).toBe('E2E Test Export');
      expect(result.bufferBase64).toBeDefined();
      expect(result.mimeType).toBe('text/csv');
      expect(result.fileExtension).toBe('csv');
      expect(result.summary).toContain('3 rows');

      expect(mocks.prisma.reportExport.create).toHaveBeenCalled();
      expect(mocks.csvEngine.generate).toHaveBeenCalledWith(sampleDataset);
      expect(mocks.policyEngine.evaluateAndLog).toHaveBeenCalled();
      expect(mocks.auditService.logExport).toHaveBeenCalled();
      expect(mocks.auditService.logDownload).toHaveBeenCalled();
    });

    it('returns valid base64 that decodes to CSV content', async () => {
      const mocks = buildMocks();
      const { ExportOrchestrationService } =
        await import('./export-orchestration.service');
      const service = new ExportOrchestrationService(
        mocks.prisma as never,
        mocks.csvEngine as never,
        mocks.excelEngine as never,
        mocks.pdfEngine as never,
        mocks.policyEngine as never,
        mocks.auditService,
      );

      const result = await service.createExport({
        companyId,
        userId,
        userRole: 'HR_MANAGER',
        reportKey: 'employees',
        format: ExportFormat.CSV,
        dataset: sampleDataset,
      });

      const decoded = Buffer.from(result.bufferBase64!, 'base64').toString(
        'utf-8',
      );
      expect(decoded).toContain('Name,Department,Status');
      expect(decoded).toContain('Alice,Engineering,ACTIVE');
      expect(decoded).toContain('Bob,Sales,ACTIVE');
    });
  });

  describe('Excel export flow', () => {
    it('creates export with Excel format', async () => {
      const mocks = buildMocks();
      const { ExportOrchestrationService } =
        await import('./export-orchestration.service');
      const service = new ExportOrchestrationService(
        mocks.prisma as never,
        mocks.csvEngine as never,
        mocks.excelEngine as never,
        mocks.pdfEngine as never,
        mocks.policyEngine as never,
        mocks.auditService,
      );

      const result = await service.createExport({
        companyId,
        userId,
        userRole: 'HR_MANAGER',
        reportKey: 'employees',
        format: ExportFormat.EXCEL,
        dataset: sampleDataset,
      });

      expect(result.status).toBe(ReportExportStatus.COMPLETED);
      expect(result.format).toBe(ExportFormat.EXCEL);
      expect(mocks.excelEngine.generate).toHaveBeenCalled();
    });
  });

  describe('PDF export flow', () => {
    it('creates export with PDF format', async () => {
      const mocks = buildMocks();
      const { ExportOrchestrationService } =
        await import('./export-orchestration.service');
      const service = new ExportOrchestrationService(
        mocks.prisma as never,
        mocks.csvEngine as never,
        mocks.excelEngine as never,
        mocks.pdfEngine as never,
        mocks.policyEngine as never,
        mocks.auditService,
      );

      const result = await service.createExport({
        companyId,
        userId,
        userRole: 'HR_MANAGER',
        reportKey: 'employees',
        format: ExportFormat.PDF,
        dataset: sampleDataset,
      });

      expect(result.status).toBe(ReportExportStatus.COMPLETED);
      expect(result.format).toBe(ExportFormat.PDF);
      expect(mocks.pdfEngine.generate).toHaveBeenCalled();
    });
  });

  describe('Export failure flow', () => {
    it('marks export as FAILED when engine throws', async () => {
      const mocks = buildMocks();
      mocks.csvEngine.generate.mockRejectedValue(new Error('Out of memory'));
      const { ExportOrchestrationService } =
        await import('./export-orchestration.service');
      const service = new ExportOrchestrationService(
        mocks.prisma as never,
        mocks.csvEngine as never,
        mocks.excelEngine as never,
        mocks.pdfEngine as never,
        mocks.policyEngine as never,
        mocks.auditService,
      );

      await expect(
        service.createExport({
          companyId,
          userId,
          userRole: 'HR_MANAGER',
          reportKey: 'employees',
          format: ExportFormat.CSV,
          dataset: sampleDataset,
        }),
      ).rejects.toThrow('Export failed');

      expect(mocks.prisma.reportExport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ReportExportStatus.FAILED,
            errorMessage: 'Out of memory',
          }),
        }),
      );
    });
  });

  describe('Export history flow', () => {
    it('returns paginated export history', async () => {
      const mocks = buildMocks();
      const { ExportOrchestrationService } =
        await import('./export-orchestration.service');
      const service = new ExportOrchestrationService(
        mocks.prisma as never,
        mocks.csvEngine as never,
        mocks.excelEngine as never,
        mocks.pdfEngine as never,
        mocks.policyEngine as never,
        mocks.auditService,
      );

      const result = await service.getExportHistory(companyId, 1, 10);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(mocks.prisma.reportExport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId }),
        }),
      );
    });
  });

  describe('Sensitive report detection', () => {
    it('marks payroll exports as sensitive', async () => {
      const mocks = buildMocks();
      const { ExportOrchestrationService } =
        await import('./export-orchestration.service');
      const service = new ExportOrchestrationService(
        mocks.prisma as never,
        mocks.csvEngine as never,
        mocks.excelEngine as never,
        mocks.pdfEngine as never,
        mocks.policyEngine as never,
        mocks.auditService,
      );

      await service.createExport({
        companyId,
        userId,
        userRole: 'HR_MANAGER',
        reportKey: 'payroll',
        format: ExportFormat.CSV,
        dataset: { ...sampleDataset, title: 'Payroll Report' },
      });

      expect(mocks.auditService.logExport).toHaveBeenCalledWith(
        expect.objectContaining({ isSensitive: true }),
      );
    });

    it('marks commissions exports as sensitive', async () => {
      const mocks = buildMocks();
      const { ExportOrchestrationService } =
        await import('./export-orchestration.service');
      const service = new ExportOrchestrationService(
        mocks.prisma as never,
        mocks.csvEngine as never,
        mocks.excelEngine as never,
        mocks.pdfEngine as never,
        mocks.policyEngine as never,
        mocks.auditService,
      );

      await service.createExport({
        companyId,
        userId,
        userRole: 'HR_MANAGER',
        reportKey: 'commissions',
        format: ExportFormat.CSV,
        dataset: { ...sampleDataset, title: 'Commission Report' },
      });

      expect(mocks.auditService.logExport).toHaveBeenCalledWith(
        expect.objectContaining({ isSensitive: true }),
      );
    });

    it('does not mark non-sensitive exports', async () => {
      const mocks = buildMocks();
      const { ExportOrchestrationService } =
        await import('./export-orchestration.service');
      const service = new ExportOrchestrationService(
        mocks.prisma as never,
        mocks.csvEngine as never,
        mocks.excelEngine as never,
        mocks.pdfEngine as never,
        mocks.policyEngine as never,
        mocks.auditService,
      );

      await service.createExport({
        companyId,
        userId,
        userRole: 'HR_MANAGER',
        reportKey: 'leads',
        format: ExportFormat.CSV,
        dataset: { ...sampleDataset, title: 'Lead Report' },
      });

      expect(mocks.auditService.logExport).toHaveBeenCalledWith(
        expect.objectContaining({ isSensitive: false }),
      );
    });
  });
});
