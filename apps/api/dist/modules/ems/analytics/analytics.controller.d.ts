import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboardStats(companyId: string): Promise<{
        crm: {
            totalProperties: number;
            propertiesByStatus: {
                status: import(".prisma/client").$Enums.PropertyStatus;
                count: number;
            }[];
            totalLeads: number;
            leadsByStatus: {
                status: import(".prisma/client").$Enums.LeadStatus;
                count: number;
            }[];
            totalCustomers: number;
            totalSiteVisits: number;
            siteVisitsByStatus: {
                status: import(".prisma/client").$Enums.SiteVisitStatus;
                count: number;
            }[];
            totalBookings: number;
            bookingsByStatus: {
                status: import(".prisma/client").$Enums.BookingStatus;
                count: number;
            }[];
        };
        hrms: {
            totalEmployees: number;
            activeEmployees: number;
            attendanceRate: number;
            pendingLeaves: number;
            attendanceTrend: {
                present: number;
                absent: number;
                onLeave: number;
                date: string;
            }[];
            departmentDistribution: {
                name: string;
                value: number;
            }[];
        };
        ems: {
            totalAssignments: number;
            assignmentsByType: {
                type: import(".prisma/client").$Enums.AssignmentType;
                count: number;
            }[];
            avgPerformanceScore: number;
            topPerformers: ({
                employees: {
                    users: {
                        role: import(".prisma/client").$Enums.UserRole;
                        id: string;
                        email: string;
                        firstName: string;
                        lastName: string;
                        avatarUrl: string | null;
                        isActive: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        notificationPreferences: import("@prisma/client/runtime/client").JsonValue | null;
                        companyId: string;
                        backupCodes: import("@prisma/client/runtime/client").JsonValue | null;
                        deletedAt: Date | null;
                        hashedPassword: string | null;
                        totpEnabled: boolean;
                        totpSecret: string | null;
                        totpVerifiedAt: Date | null;
                        roleId: string | null;
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
                    salary: import("@prisma/client-runtime-utils").Decimal | null;
                    address: string | null;
                    managerId: string | null;
                    staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                year: number;
                employeeId: string;
                notes: string | null;
                quarter: number;
                score: number;
            })[];
        };
    }>;
    getEmployeeAnalytics(employeeId: string, companyId: string, currentEmployeeId: string | null, role: string): Promise<{
        employee: {
            users: {
                role: import(".prisma/client").$Enums.UserRole;
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                notificationPreferences: import("@prisma/client/runtime/client").JsonValue | null;
                companyId: string;
                backupCodes: import("@prisma/client/runtime/client").JsonValue | null;
                deletedAt: Date | null;
                hashedPassword: string | null;
                totpEnabled: boolean;
                totpSecret: string | null;
                totpVerifiedAt: Date | null;
                roleId: string | null;
            } | null;
            departments: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                description: string | null;
            };
            designations: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                description: string | null;
                departmentId: string;
            };
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
        assignments: {
            type: import(".prisma/client").$Enums.AssignmentType;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            entityId: string;
            employeeId: string;
            notes: string | null;
            startDate: Date | null;
            endDate: Date | null;
        }[];
        performance: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            year: number;
            employeeId: string;
            notes: string | null;
            quarter: number;
            score: number;
        }[];
        attendance: {
            totalDays: number;
            presentDays: number;
            attendanceRate: number;
        };
        leaves: {
            type: import(".prisma/client").$Enums.LeaveType;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.LeaveStatus;
            reason: string | null;
            employeeId: string;
            startDate: Date;
            endDate: Date;
            documentUrl: string | null;
            approvedAt: Date | null;
            approvedById: string | null;
        }[];
        metrics: {
            propertiesAssigned: number;
            leadsAssigned: number;
            siteVisitsCompleted: number;
            bookingsClosed: number;
            attendanceRate: number;
            conversionRate: number;
        };
    }>;
    getMyAnalytics(employeeId: string, companyId: string): Promise<{
        employee: {
            users: {
                role: import(".prisma/client").$Enums.UserRole;
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                notificationPreferences: import("@prisma/client/runtime/client").JsonValue | null;
                companyId: string;
                backupCodes: import("@prisma/client/runtime/client").JsonValue | null;
                deletedAt: Date | null;
                hashedPassword: string | null;
                totpEnabled: boolean;
                totpSecret: string | null;
                totpVerifiedAt: Date | null;
                roleId: string | null;
            } | null;
            departments: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                description: string | null;
            };
            designations: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                description: string | null;
                departmentId: string;
            };
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
        assignments: {
            type: import(".prisma/client").$Enums.AssignmentType;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            entityId: string;
            employeeId: string;
            notes: string | null;
            startDate: Date | null;
            endDate: Date | null;
        }[];
        performance: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            year: number;
            employeeId: string;
            notes: string | null;
            quarter: number;
            score: number;
        }[];
        attendance: {
            totalDays: number;
            presentDays: number;
            attendanceRate: number;
        };
        leaves: {
            type: import(".prisma/client").$Enums.LeaveType;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.LeaveStatus;
            reason: string | null;
            employeeId: string;
            startDate: Date;
            endDate: Date;
            documentUrl: string | null;
            approvedAt: Date | null;
            approvedById: string | null;
        }[];
        metrics: {
            propertiesAssigned: number;
            leadsAssigned: number;
            siteVisitsCompleted: number;
            bookingsClosed: number;
            attendanceRate: number;
            conversionRate: number;
        };
    }>;
    getTeamAnalytics(companyId: string, departmentId?: string): Promise<{
        totalEmployees: number;
        totalAssignments: number;
        avgPerformanceScore: number;
        attendanceRate: number;
        pendingLeaves: number;
        employees: {
            id: string;
            name: string;
            departments: string;
            assignments: number;
            avgScore: number;
        }[];
    }>;
    getConversionFunnel(companyId: string): Promise<{
        leads: number;
        siteVisits: number;
        bookings: number;
        convertedLeads: number;
        leadToVisitRate: number;
        visitToBookingRate: number;
        leadToBookingRate: number;
    }>;
    getBookingsByEmployee(companyId: string): Promise<{
        name: string;
        bookings: number;
        closed: number;
    }[]>;
    getSiteVisitsByEmployee(companyId: string): Promise<{
        name: string;
        scheduled: number;
        completed: number;
    }[]>;
}
