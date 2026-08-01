import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ExportFormat, ReportExportStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { ExportEngine, ExportDataset } from './engines/export-types';
import { CsvExportEngine } from './engines/csv-export.engine';
import { ExcelExportEngine } from './engines/excel-export.engine';
import { PdfExportEngine } from './engines/pdf-export.engine';
import { ExportPolicyEngine } from './export-policy.engine';
import { ExportAuditService } from '../audit/export-audit.service';
import { ExportResultDto } from './dto/export.dto';

@Injectable()
export class ExportOrchestrationService {
  private readonly logger = new Logger(ExportOrchestrationService.name);

  private readonly engines = new Map<ExportFormat, ExportEngine>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly csvEngine: CsvExportEngine,
    private readonly excelEngine: ExcelExportEngine,
    private readonly pdfEngine: PdfExportEngine,
    private readonly policyEngine: ExportPolicyEngine,
    private readonly auditService: ExportAuditService,
  ) {
    this.engines.set(ExportFormat.CSV, this.csvEngine);
    this.engines.set(ExportFormat.EXCEL, this.excelEngine);
    this.engines.set(ExportFormat.PDF, this.pdfEngine);
  }

  async createExport(params: {
    companyId: string;
    userId: string;
    userRole: string;
    reportKey: string;
    format: ExportFormat;
    dataset: ExportDataset;
  }): Promise<ExportResultDto> {
    const { companyId, userId, userRole, reportKey, format, dataset } = params;

    const engine = this.engines.get(format);
    if (!engine) {
      throw new BadRequestException(`Unsupported export format: ${format}`);
    }

    const exportRec = await this.prisma.reportExport.create({
      data: {
        companyId,
        reportKey,
        title: dataset.title,
        format,
        status: ReportExportStatus.PROCESSING,
        filters: {},
        generatedById: userId,
      },
    });

    try {
      await this.policyEngine.evaluateAndLog({
        companyId,
        userId,
        userRole,
        dataset: reportKey,
        format: format as 'CSV' | 'SHEET' | 'PDF',
        rowCount: dataset.rows.length,
      });

      const buffer = await engine.generate(dataset);

      const fileUrl = `reports/${companyId}/${exportRec.id}.${engine.fileExtension}`;

      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.reportExport.update({
          where: { id: exportRec.id },
          data: {
            status: ReportExportStatus.COMPLETED,
            fileUrl,
            fileSize: buffer.length,
            generatedAt: new Date(),
          },
        });

        const exportLogId = await this.auditService.logExport({
          tx,
          companyId,
          exportType: reportKey,
          format,
          requestedById: userId,
          rowCount: dataset.rows.length,
          isSensitive: ['payroll', 'commissions', 'employees'].includes(
            reportKey,
          ),
        });

        await this.auditService.logDownload({
          tx,
          companyId,
          exportLogId,
          userId,
          fileName: `${reportKey}.${engine.fileExtension}`,
        });
      });

      return {
        id: exportRec.id,
        title: dataset.title,
        format,
        status: ReportExportStatus.COMPLETED,
        fileUrl,
        bufferBase64: buffer.toString('base64'),
        mimeType: engine.mimeType,
        fileExtension: engine.fileExtension,
        summary: `Generated ${format} export for ${dataset.title} with ${dataset.rows.length} rows`,
        createdAt: exportRec.createdAt,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await this.prisma.reportExport.update({
        where: { id: exportRec.id },
        data: {
          status: ReportExportStatus.FAILED,
          errorMessage: message,
          failedAt: new Date(),
        },
      });
      throw new BadRequestException(`Export failed: ${message}`);
    }
  }

  async getExportHistory(companyId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.reportExport.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          reportKey: true,
          title: true,
          format: true,
          status: true,
          fileUrl: true,
          fileSize: true,
          errorMessage: true,
          createdAt: true,
          generatedAt: true,
        },
      }),
      this.prisma.reportExport.count({ where: { companyId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
