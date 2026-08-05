import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import { Prisma } from '@prisma/client';
import { CreateMeetingDto, UpdateMeetingDto, AddAttendeeDto, CreateMinutesDto, QueryMeetingDto } from './dto/create-meeting.dto';
import { CreateActionItemDto, UpdateActionItemDto } from './dto/create-action-item.dto';
export declare class MeetingsService {
    private readonly prisma;
    private readonly transitionService;
    constructor(prisma: PrismaService, transitionService: TransitionService);
    findAll(companyId: string, query: QueryMeetingDto): Promise<{
        items: ({
            _count: {
                minutes: number;
                attendees: number;
                actionItems: number;
            };
            organizer: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.MeetingStatus;
            title: string;
            location: string | null;
            scheduledAt: Date;
            organizerId: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(companyId: string, dto: CreateMeetingDto, organizerId?: string): Promise<({
        organizer: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.MeetingStatus;
        title: string;
        location: string | null;
        scheduledAt: Date;
        organizerId: string;
    }) | null>;
    findOne(companyId: string, id: string): Promise<{
        minutes: ({
            recordedBy: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            companyId: string;
            recordedById: string;
            content: string;
            meetingId: string;
        })[];
        organizer: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        attendees: ({
            employee: {
                users: {
                    email: string;
                    firstName: string;
                    lastName: string;
                } | null;
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                userId: string | null;
                teamId: string | null;
                departmentId: string;
                status: import(".prisma/client").$Enums.EmployeeStatus;
                employeeCode: string;
                designationId: string;
                phone: string | null;
                dateOfJoining: Date | null;
                salary: Prisma.Decimal | null;
                address: string | null;
                managerId: string | null;
                staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
            };
        } & {
            id: string;
            companyId: string;
            employeeId: string;
            attended: boolean;
            meetingId: string;
        })[];
        actionItems: ({
            assignee: {
                users: {
                    email: string;
                    firstName: string;
                    lastName: string;
                } | null;
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                userId: string | null;
                teamId: string | null;
                departmentId: string;
                status: import(".prisma/client").$Enums.EmployeeStatus;
                employeeCode: string;
                designationId: string;
                phone: string | null;
                dateOfJoining: Date | null;
                salary: Prisma.Decimal | null;
                address: string | null;
                managerId: string | null;
                staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
            };
        } & {
            id: string;
            companyId: string;
            description: string;
            dueDate: Date | null;
            assigneeId: string;
            taskId: string | null;
            meetingId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.MeetingStatus;
        title: string;
        location: string | null;
        scheduledAt: Date;
        organizerId: string;
    }>;
    update(companyId: string, id: string, dto: UpdateMeetingDto): Promise<{
        organizer: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.MeetingStatus;
        title: string;
        location: string | null;
        scheduledAt: Date;
        organizerId: string;
    }>;
    remove(companyId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.MeetingStatus;
        title: string;
        location: string | null;
        scheduledAt: Date;
        organizerId: string;
    }>;
    complete(companyId: string, id: string): Promise<{
        organizer: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.MeetingStatus;
        title: string;
        location: string | null;
        scheduledAt: Date;
        organizerId: string;
    }>;
    cancel(companyId: string, id: string): Promise<{
        organizer: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.MeetingStatus;
        title: string;
        location: string | null;
        scheduledAt: Date;
        organizerId: string;
    }>;
    addAttendee(companyId: string, meetingId: string, dto: AddAttendeeDto): Promise<{
        id: string;
        companyId: string;
        employeeId: string;
        attended: boolean;
        meetingId: string;
    }>;
    removeAttendee(companyId: string, meetingId: string, employeeId: string): Promise<{
        id: string;
        companyId: string;
        employeeId: string;
        attended: boolean;
        meetingId: string;
    }>;
    markAttendance(companyId: string, meetingId: string, employeeId: string, attended: boolean): Promise<{
        employee: {
            users: {
                email: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            userId: string | null;
            teamId: string | null;
            departmentId: string;
            status: import(".prisma/client").$Enums.EmployeeStatus;
            employeeCode: string;
            designationId: string;
            phone: string | null;
            dateOfJoining: Date | null;
            salary: Prisma.Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
    } & {
        id: string;
        companyId: string;
        employeeId: string;
        attended: boolean;
        meetingId: string;
    }>;
    addMinutes(companyId: string, meetingId: string, dto: CreateMinutesDto): Promise<{
        recordedBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        recordedById: string;
        content: string;
        meetingId: string;
    }>;
    listMinutes(companyId: string, meetingId: string): Promise<({
        recordedBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        recordedById: string;
        content: string;
        meetingId: string;
    })[]>;
    createActionItem(companyId: string, meetingId: string, dto: CreateActionItemDto): Promise<{
        assignee: {
            users: {
                email: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            userId: string | null;
            teamId: string | null;
            departmentId: string;
            status: import(".prisma/client").$Enums.EmployeeStatus;
            employeeCode: string;
            designationId: string;
            phone: string | null;
            dateOfJoining: Date | null;
            salary: Prisma.Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
    } & {
        id: string;
        companyId: string;
        description: string;
        dueDate: Date | null;
        assigneeId: string;
        taskId: string | null;
        meetingId: string;
    }>;
    updateActionItem(companyId: string, itemId: string, dto: UpdateActionItemDto): Promise<{
        assignee: {
            users: {
                email: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            userId: string | null;
            teamId: string | null;
            departmentId: string;
            status: import(".prisma/client").$Enums.EmployeeStatus;
            employeeCode: string;
            designationId: string;
            phone: string | null;
            dateOfJoining: Date | null;
            salary: Prisma.Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
    } & {
        id: string;
        companyId: string;
        description: string;
        dueDate: Date | null;
        assigneeId: string;
        taskId: string | null;
        meetingId: string;
    }>;
    listActionItems(companyId: string, meetingId: string): Promise<({
        assignee: {
            users: {
                email: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            userId: string | null;
            teamId: string | null;
            departmentId: string;
            status: import(".prisma/client").$Enums.EmployeeStatus;
            employeeCode: string;
            designationId: string;
            phone: string | null;
            dateOfJoining: Date | null;
            salary: Prisma.Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
    } & {
        id: string;
        companyId: string;
        description: string;
        dueDate: Date | null;
        assigneeId: string;
        taskId: string | null;
        meetingId: string;
    })[]>;
}
