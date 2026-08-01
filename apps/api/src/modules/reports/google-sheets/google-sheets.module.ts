import { Module } from '@nestjs/common';
import { GoogleSheetsClient } from './google-sheets.client';
import { SheetSyncService } from './sheet-sync.service';

@Module({
  providers: [GoogleSheetsClient, SheetSyncService],
  exports: [GoogleSheetsClient, SheetSyncService],
})
export class GoogleSheetsModule {}
