import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../../governance-events/governance-event.processor';
import { EmployeesService } from '../../employees/employees.service';
import { LeaveRequestsService } from '../../leave-requests/leave-requests.service';
export declare class DashboardMetricsProjector {
    private readonly prisma;
    private readonly processor;
    private readonly employeesService;
    private readonly leaveRequestsService;
    constructor(prisma: PrismaService, processor: GovernanceEventProcessor, employeesService: EmployeesService, leaveRequestsService: LeaveRequestsService);
    handleAttendanceFinalized(event: DomainEvent): Promise<void>;
    handleLeaveApproved(event: DomainEvent): Promise<void>;
}
