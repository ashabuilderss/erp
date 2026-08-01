import { Module } from '@nestjs/common';
import { AttendanceCorrectionsService } from './attendance-corrections.service';
import { AttendanceCorrectionsController } from './attendance-corrections.controller';
import { ApprovalsModule } from '../../approvals/approvals.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [ApprovalsModule, AttendanceModule, EmployeesModule],
  controllers: [AttendanceCorrectionsController],
  providers: [AttendanceCorrectionsService],
  exports: [AttendanceCorrectionsService],
})
export class AttendanceCorrectionsModule {}
