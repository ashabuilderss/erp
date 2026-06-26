import { Module } from '@nestjs/common';
import { AttendanceCorrectionsService } from './attendance-corrections.service';
import { AttendanceCorrectionsController } from './attendance-corrections.controller';

@Module({
  controllers: [AttendanceCorrectionsController],
  providers: [AttendanceCorrectionsService],
  exports: [AttendanceCorrectionsService],
})
export class AttendanceCorrectionsModule {}
