import { Module } from '@nestjs/common';
import { EvidenceReviewService } from './evidence-review.service';
import { EvidenceReviewController } from './evidence-review.controller';
import { AttendanceModule } from '../attendance/attendance.module';
import { GovernanceEventsModule } from '../../governance-events/governance-events.module';
import { StorageModule } from '../../uploads/storage/storage.module';

@Module({
  imports: [AttendanceModule, GovernanceEventsModule, StorageModule],
  controllers: [EvidenceReviewController],
  providers: [EvidenceReviewService],
  exports: [EvidenceReviewService],
})
export class EvidenceReviewModule {}
