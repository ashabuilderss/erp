import { Module } from '@nestjs/common';
import { EodReportsController } from './eod-reports.controller';
import { EodReportsService } from './eod-reports.service';

@Module({
  controllers: [EodReportsController],
  providers: [EodReportsService],
})
export class EodModule {}
