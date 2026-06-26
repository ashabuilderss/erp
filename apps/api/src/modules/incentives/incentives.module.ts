import { Module } from '@nestjs/common';
import { IncentivesService } from './incentives.service';
import { IncentivesController } from './incentives.controller';

@Module({
  controllers: [IncentivesController],
  providers: [IncentivesService],
})
export class IncentivesModule {}
