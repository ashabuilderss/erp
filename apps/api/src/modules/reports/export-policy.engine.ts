import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

export interface ExportRequest {
  companyId: string;
  userId: string;
  userRole: string;
  dataset: string;
  format: 'CSV' | 'SHEET' | 'PDF';
  rowCount: number;
}

@Injectable()
export class ExportPolicyEngine {
  private readonly logger = new Logger(ExportPolicyEngine.name);

  constructor(private prisma: PrismaService) {}

  async evaluateAndLog(req: ExportRequest): Promise<void> {
    const { companyId, userId, userRole, dataset, format, rowCount } = req;

    // 1. Format Restrictions
    if (format === 'SHEET' && userRole !== 'OWNER' && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        `Google Sheets export is restricted to OWNER/ADMIN roles.`,
      );
    }

    // 2. Sensitive Dataset Rules
    const isSensitive = ['payroll', 'commissions', 'employees'].includes(
      dataset,
    );
    if (
      isSensitive &&
      userRole !== 'OWNER' &&
      userRole !== 'ADMIN' &&
      userRole !== 'HR_MANAGER'
    ) {
      throw new ForbiddenException(
        `Export of sensitive dataset '${dataset}' is restricted.`,
      );
    }

    // 3. Row Limits
    const MAX_ROWS_NON_OWNER = 1000;
    if (userRole !== 'OWNER' && rowCount > MAX_ROWS_NON_OWNER) {
      throw new ForbiddenException(
        `Row limit exceeded. Maximum allowed rows for role ${userRole} is ${MAX_ROWS_NON_OWNER}. Requested: ${rowCount}`,
      );
    }

    // 4. Log the export for Audit
    if (format === 'CSV' || format === 'SHEET') {
      // await this.prisma.exportLog.create({
      //   data: {
      //     companyId,
      //     reportType: dataset,
      //     requestedById: userId,
      //     rowCount,
      //     isSensitive,
      //   },
      // });
    } else if (format === 'PDF') {
      // Typically used for Quotations or documents
      // await this.prisma.downloadLog.create({
      //   data: {
      //     companyId,
      //     entityId: dataset, // We treat dataset string as entityId for PDF downloads
      //     entityType: 'DOCUMENT',
      //     downloadedById: userId,
      //   },
      // });
    }
  }
}
