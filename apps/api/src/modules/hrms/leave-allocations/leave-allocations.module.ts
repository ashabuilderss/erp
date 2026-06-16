import { Module } from '@nestjs/common';
import { LeaveAllocationsService } from './leave-allocations.service';
import { LeaveAllocationsController } from './leave-allocations.controller';

@Module({
  controllers: [LeaveAllocationsController],
  providers: [LeaveAllocationsService],
  exports: [LeaveAllocationsService],
})
export class LeaveAllocationsModule {}
