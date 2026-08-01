import { BadRequestException } from '@nestjs/common';
import { ExportFormat, ReportExportStatus } from '@prisma/client';
import { ExportOrchestrationService } from './export-orchestration.service';
import { ExportDataset } from './engines/export-types';

describe('ExportOrchestrationService', () => {
  const companyId = 'comp-1';
  const userId = 'usr-1';

  const mockPrisma = () => ({
    reportExport: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  });

  const mockCsvEngine = () => ({
    generate: jest.fn().mockResolvedValue(Buffer.from('csv-data')),
    mimeType: 'text/csv',
    fileExtension: 'csv',
  });

  const mockExcelEngine = () => ({
    generate: jest.fn().mockResolvedValue(Buffer.from('xlsx-data')),
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileExtension: 'xlsx',
  });

  const mockPdfEngine = () => ({
    generate: jest.fn().mockResolvedValue(Buffer.from('pdf-data')),
    mimeType: 'application/pdf',
    fileExtension: 'pdf',
  });

  const mockPolicyEngine = () => ({
    evaluateAndLog: jest.fn(),
  });

  const mockAuditService = () => ({
    logExport: jest.fn().mockResolvedValue('export-log-1'),
    logDownload: jest.fn(),
  });

  const buildService = (overrides?: {
    prisma?: ReturnType<typeof mockPrisma>;
    csvEngine?: ReturnType<typeof mockCsvEngine>;
    excelEngine?: ReturnType<typeof mockExcelEngine>;
    pdfEngine?: ReturnType<typeof mockPdfEngine>;
    policyEngine?: ReturnType<typeof mockPolicyEngine>;
    auditService?: ReturnType<typeof mockAuditService>;
  }) => {
    const prisma = overrides?.prisma ?? mockPrisma();
    const csvEngine = overrides?.csvEngine ?? mockCsvEngine();
    const excelEngine = overrides?.excelEngine ?? mockExcelEngine();
    const pdfEngine = overrides?.pdfEngine ?? mockPdfEngine();
    const policyEngine = overrides?.policyEngine ?? mockPolicyEngine();
    const auditService = overrides?.auditService ?? mockAuditService();
    const service = new ExportOrchestrationService(
      prisma as never,
      csvEngine as never,
      excelEngine as never,
      pdfEngine as never,
      policyEngine as never,
      auditService,
    );
    return {
      service,
      prisma,
      csvEngine,
      excelEngine,
      pdfEngine,
      policyEngine,
      auditService,
    };
  };

  const sampleDataset: ExportDataset = {
    title: 'Test Export',
    headers: ['Name', 'Value'],
    rows: [['Row1', 100]],
  };

  describe('createExport', () => {
    it('throws BadRequestException for unsupported format', async () => {
      const { service } = buildService();

      await expect(
        service.createExport({
          companyId,
          userId,
          userRole: 'ADMIN',
          reportKey: 'employees',
          format: 'XML' as ExportFormat,
          dataset: sampleDataset,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('generates CSV export successfully', async () => {
      const { service, prisma, csvEngine, policyEngine, auditService } =
        buildService();
      prisma.reportExport.create.mockResolvedValue({
        id: 'exp-1',
        createdAt: new Date(),
      });
      const mockTx = { reportExport: { update: jest.fn() } };
      prisma.$transaction.mockImplementation(async (fn: Function) =>
        fn(mockTx),
      );

      const result = await service.createExport({
        companyId,
        userId,
        userRole: 'ADMIN',
        reportKey: 'employees',
        format: ExportFormat.CSV,
        dataset: sampleDataset,
      });

      expect(result.status).toBe(ReportExportStatus.COMPLETED);
      expect(result).toHaveProperty('bufferBase64');
      expect(csvEngine.generate).toHaveBeenCalledWith(sampleDataset);
      expect(policyEngine.evaluateAndLog).toHaveBeenCalled();
      expect(auditService.logExport).toHaveBeenCalled();
      expect(auditService.logDownload).toHaveBeenCalled();
    });

    it('generates Excel export successfully', async () => {
      const { service, prisma, excelEngine } = buildService();
      prisma.reportExport.create.mockResolvedValue({
        id: 'exp-2',
        createdAt: new Date(),
      });
      prisma.$transaction.mockImplementation(async (fn: Function) =>
        fn({ reportExport: { update: jest.fn() } }),
      );

      const result = await service.createExport({
        companyId,
        userId,
        userRole: 'ADMIN',
        reportKey: 'employees',
        format: ExportFormat.EXCEL,
        dataset: sampleDataset,
      });

      expect(result.status).toBe(ReportExportStatus.COMPLETED);
      expect(excelEngine.generate).toHaveBeenCalled();
    });

    it('generates PDF export successfully', async () => {
      const { service, prisma, pdfEngine } = buildService();
      prisma.reportExport.create.mockResolvedValue({
        id: 'exp-3',
        createdAt: new Date(),
      });
      prisma.$transaction.mockImplementation(async (fn: Function) =>
        fn({ reportExport: { update: jest.fn() } }),
      );

      const result = await service.createExport({
        companyId,
        userId,
        userRole: 'ADMIN',
        reportKey: 'employees',
        format: ExportFormat.PDF,
        dataset: sampleDataset,
      });

      expect(result.status).toBe(ReportExportStatus.COMPLETED);
      expect(pdfEngine.generate).toHaveBeenCalled();
    });

    it('marks export as FAILED on engine error', async () => {
      const { service, prisma, csvEngine } = buildService();
      prisma.reportExport.create.mockResolvedValue({
        id: 'exp-4',
        createdAt: new Date(),
      });
      csvEngine.generate.mockRejectedValue(new Error('Engine crash'));

      await expect(
        service.createExport({
          companyId,
          userId,
          userRole: 'ADMIN',
          reportKey: 'employees',
          format: ExportFormat.CSV,
          dataset: sampleDataset,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.reportExport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ReportExportStatus.FAILED }),
        }),
      );
    });

    it('marks payroll exports as sensitive', async () => {
      const { service, prisma, auditService } = buildService();
      prisma.reportExport.create.mockResolvedValue({
        id: 'exp-5',
        createdAt: new Date(),
      });
      prisma.$transaction.mockImplementation(async (fn: Function) =>
        fn({ reportExport: { update: jest.fn() } }),
      );

      await service.createExport({
        companyId,
        userId,
        userRole: 'ADMIN',
        reportKey: 'payroll',
        format: ExportFormat.CSV,
        dataset: { ...sampleDataset, title: 'Payroll Report' },
      });

      expect(auditService.logExport).toHaveBeenCalledWith(
        expect.objectContaining({
          isSensitive: true,
        }),
      );
    });
  });

  describe('getExportHistory', () => {
    it('returns paginated export history', async () => {
      const { service, prisma } = buildService();
      prisma.reportExport.findMany.mockResolvedValue([]);
      prisma.reportExport.count.mockResolvedValue(0);

      const result = await service.getExportHistory(companyId, 1, 10);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toEqual(
        expect.objectContaining({ total: 0, page: 1, limit: 10 }),
      );
    });
  });
});
