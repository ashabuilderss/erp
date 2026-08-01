import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { DeletionLogService } from './deletion-log.service';
import { ExportAuditService } from './export-audit.service';
import { DocumentAccessLogService } from './document-access-log.service';

@Module({
  providers: [
    AuditService,
    DeletionLogService,
    ExportAuditService,
    DocumentAccessLogService,
  ],
  exports: [
    AuditService,
    DeletionLogService,
    ExportAuditService,
    DocumentAccessLogService,
  ],
})
export class AuditModule {}
