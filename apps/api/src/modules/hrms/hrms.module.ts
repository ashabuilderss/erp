import { Module } from '@nestjs/common';
import { DepartmentsModule } from './departments/departments.module';
import { DesignationsModule } from './designations/designations.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeaveRequestsModule } from './leave-requests/leave-requests.module';
import { LeaveAllocationsModule } from './leave-allocations/leave-allocations.module';
import { DeviceRegistrationsModule } from './device-registrations/device-registrations.module';
import { AttendanceCorrectionsModule } from './attendance-corrections/attendance-corrections.module';
import { EvidenceReviewModule } from './attendance-evidence-review/evidence-review.module';
import { PayrollModule } from './payroll/payroll.module';

@Module({
  imports: [
    DepartmentsModule,
    DesignationsModule,
    EmployeesModule,
    AttendanceModule,
    LeaveRequestsModule,
    LeaveAllocationsModule,
    DeviceRegistrationsModule,
    AttendanceCorrectionsModule,
    EvidenceReviewModule,
    PayrollModule,
  ],
})
export class HrmsModule {}
