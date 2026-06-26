import { Module } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { CommissionController } from './commission.controller';
import { CommissionListener } from './commission-listener';

@Module({
  controllers: [CommissionController],
  providers: [CommissionService, CommissionListener],
})
export class CommissionModule {}
