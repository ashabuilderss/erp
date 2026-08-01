import { Module } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';
import { QuotationPdfService } from './quotation-pdf.service';

@Module({
  controllers: [QuotationsController],
  providers: [QuotationsService, QuotationPdfService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
