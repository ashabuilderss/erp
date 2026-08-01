import { Module } from '@nestjs/common';
import { AnnouncementController } from './announcement.controller';
import { DocumentController } from './document.controller';
import { AnnouncementService } from './announcement.service';
import { AnnouncementReceiptService } from './announcement-receipt.service';
import { DocumentRegistryService } from './document-registry.service';
import { DocumentAccessService } from './document-access.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [AnnouncementController, DocumentController],
  providers: [
    AnnouncementService,
    AnnouncementReceiptService,
    DocumentRegistryService,
    DocumentAccessService,
  ],
  exports: [
    AnnouncementService,
    AnnouncementReceiptService,
    DocumentRegistryService,
    DocumentAccessService,
  ],
})
export class CommunicationModule {}
