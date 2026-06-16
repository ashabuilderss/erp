import { Module } from '@nestjs/common';
import { DepartmentsModule } from './departments/departments.module';
import { DesignationsModule } from './designations/designations.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeaveRequestsModule } from './leave-requests/leave-requests.module';
import { LeaveAllocationsModule } from './leave-allocations/leave-allocations.module';

@Module({
  imports: [
    DepartmentsModule,
    DesignationsModule,
    EmployeesModule,
    AttendanceModule,
    LeaveRequestsModule,
    LeaveAllocationsModule,
  ],
})
export class HrmsModule {}
