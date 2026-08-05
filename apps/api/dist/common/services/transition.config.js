"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSITION_RULES = void 0;
exports.TRANSITION_RULES = [
    {
        entityName: 'Property',
        prismaModel: 'property',
        ownershipField: 'assignedToEmployeeId',
        transitions: {
            AVAILABLE: ['RESERVED', 'SOLD', 'BOOKED'],
            RESERVED: ['AVAILABLE', 'BOOKED'],
            BOOKED: ['SOLD', 'RESERVED'],
            SOLD: [],
        },
    },
    {
        entityName: 'Lead',
        prismaModel: 'lead',
        ownershipField: 'assignedToEmployeeId',
        transitions: {
            NEW: ['CONTACTED', 'LOST', 'CONVERTED'],
            CONTACTED: ['INTERESTED', 'LOST', 'NEW', 'CONVERTED'],
            INTERESTED: ['SITE_VISIT_SCHEDULED', 'NEGOTIATION', 'LOST', 'CONTACTED', 'CONVERTED'],
            SITE_VISIT_SCHEDULED: ['NEGOTIATION', 'CONVERTED', 'LOST', 'INTERESTED'],
            NEGOTIATION: ['CONVERTED', 'LOST', 'SITE_VISIT_SCHEDULED'],
            CONVERTED: [],
            LOST: ['NEW', 'CONTACTED'],
        },
    },
    {
        entityName: 'SiteVisit',
        prismaModel: 'siteVisit',
        ownershipField: 'assignedToEmployeeId',
        transitions: {
            SCHEDULED: ['COMPLETED', 'CANCELLED', 'RESCHEDULED'],
            COMPLETED: ['SCHEDULED'],
            CANCELLED: ['SCHEDULED'],
            RESCHEDULED: ['COMPLETED', 'CANCELLED', 'SCHEDULED'],
        },
    },
    {
        entityName: 'Booking',
        prismaModel: 'booking',
        ownershipField: 'assignedToEmployeeId',
        transitions: {
            PENDING: ['CONFIRMED', 'CANCELLED'],
            CONFIRMED: ['CANCELLED', 'PENDING'],
            CANCELLED: ['PENDING'],
        },
    },
    {
        entityName: 'Quotation',
        prismaModel: 'quotation',
        transitions: {
            DRAFT: ['SENT', 'REJECTED'],
            SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
            ACCEPTED: [],
            REJECTED: ['DRAFT'],
            EXPIRED: ['DRAFT'],
        },
    },
    {
        entityName: 'Employee',
        prismaModel: 'employee',
        transitions: {
            ACTIVE: ['INACTIVE', 'TERMINATED'],
            INACTIVE: ['ACTIVE', 'TERMINATED'],
            TERMINATED: [],
        },
    },
    {
        entityName: 'LeaveRequest',
        prismaModel: 'leaveRequest',
        transitions: {
            PENDING: ['APPROVED', 'REJECTED'],
            APPROVED: [],
            REJECTED: [],
        },
    },
    {
        entityName: 'AttendanceCorrection',
        prismaModel: 'attendanceCorrection',
        transitions: {
            PENDING: ['APPROVED', 'REJECTED'],
            APPROVED: [],
            REJECTED: [],
        },
    },
    {
        entityName: 'AttendancePeriod',
        prismaModel: 'attendancePeriod',
        transitions: {
            OPEN: ['UNDER_REVIEW', 'CLOSED', 'PAYROLL_LOCKED'],
            UNDER_REVIEW: ['CLOSED', 'PAYROLL_LOCKED'],
            CLOSED: ['PAYROLL_LOCKED'],
            PAYROLL_LOCKED: [],
        },
    },
    {
        entityName: 'DayAggregate',
        prismaModel: 'attendanceDayAggregate',
        transitions: {
            COMPLETED: ['UNDER_REVIEW'],
            UNDER_REVIEW: ['COMPLETED'],
        },
    },
    {
        entityName: 'ExpenseClaim',
        prismaModel: 'expenseClaim',
        transitions: {
            PENDING: ['APPROVED', 'REJECTED'],
            APPROVED: [],
            REJECTED: [],
        },
    },
    {
        entityName: 'EodReport',
        prismaModel: 'eodReport',
        transitions: {
            DRAFT: ['SUBMITTED'],
            SUBMITTED: ['REVIEWED', 'DRAFT'],
            REVIEWED: [],
        },
    },
    {
        entityName: 'Warning',
        prismaModel: 'warning',
        transitions: {
            PENDING: ['APPROVED', 'REJECTED', 'CANCELLED', 'ESCALATED'],
            APPROVED: ['ESCALATED'],
            REJECTED: [],
            CANCELLED: [],
            ESCALATED: ['APPROVED', 'REJECTED'],
        },
    },
    {
        entityName: 'PayrollRun',
        prismaModel: 'payrollRun',
        transitions: {
            DRAFT: ['PROCESSING', 'CANCELLED'],
            PROCESSING: ['COMPLETED', 'CANCELLED'],
            COMPLETED: ['PAID', 'CANCELLED'],
            PAID: [],
            CANCELLED: [],
        },
    },
    {
        entityName: 'PayrollHold',
        prismaModel: 'payrollHold',
        transitions: {
            REQUESTED: ['UNDER_REVIEW', 'ACTIVE_HOLD', 'REJECTED'],
            UNDER_REVIEW: ['ACTIVE_HOLD', 'RELEASE_REQUESTED', 'REJECTED'],
            ACTIVE_HOLD: ['RELEASE_REQUESTED', 'REJECTED'],
            RELEASE_REQUESTED: ['RELEASED', 'ACTIVE_HOLD'],
            RELEASED: [],
            REJECTED: ['ACTIVE_HOLD'],
        },
    },
    {
        entityName: 'Commission',
        prismaModel: 'pipelineCommission',
        transitions: {
            PENDING: ['APPROVED', 'CANCELLED'],
            APPROVED: ['PAID'],
            PAID: [],
            CANCELLED: [],
        },
    },
    {
        entityName: 'ConstructionSite',
        prismaModel: 'constructionSite',
        transitions: {
            PLANNING: ['IN_PROGRESS'],
            IN_PROGRESS: ['COMPLETED', 'ON_HOLD'],
            COMPLETED: [],
            ON_HOLD: ['IN_PROGRESS'],
        },
    },
    {
        entityName: 'Task',
        prismaModel: 'task',
        transitions: {
            PENDING: ['IN_PROGRESS', 'OVERDUE'],
            IN_PROGRESS: ['PENDING_VALIDATION', 'OVERDUE'],
            PENDING_VALIDATION: ['COMPLETED', 'IN_PROGRESS'],
            COMPLETED: [],
            OVERDUE: ['IN_PROGRESS', 'PENDING_VALIDATION'],
        },
    },
    {
        entityName: 'Meeting',
        prismaModel: 'meeting',
        transitions: {
            SCHEDULED: ['COMPLETED', 'CANCELLED'],
            COMPLETED: [],
            CANCELLED: [],
        },
    },
    {
        entityName: 'Asset',
        prismaModel: 'asset',
        transitions: {
            AVAILABLE: ['ASSIGNED', 'IN_REPAIR', 'RETIRED'],
            ASSIGNED: ['AVAILABLE', 'IN_REPAIR', 'RETIRED'],
            IN_REPAIR: ['AVAILABLE', 'RETIRED'],
            RETIRED: [],
        },
    },
    {
        entityName: 'Agreement',
        prismaModel: 'agreement',
        transitions: {
            DRAFT: ['PENDING_APPROVAL'],
            PENDING_APPROVAL: ['APPROVED'],
            APPROVED: ['ARCHIVED'],
            ARCHIVED: [],
        },
    },
    {
        entityName: 'Announcement',
        prismaModel: 'announcement',
        transitions: {
            DRAFT: ['PUBLISHED'],
            PUBLISHED: ['ARCHIVED'],
            ARCHIVED: [],
        },
    },
    {
        entityName: 'JobPosting',
        prismaModel: 'jobPosting',
        transitions: {
            OPEN: ['CLOSED', 'ON_HOLD'],
            CLOSED: ['OPEN'],
            ON_HOLD: ['OPEN', 'CLOSED'],
        },
    },
    {
        entityName: 'Candidate',
        prismaModel: 'candidate',
        transitions: {
            APPLIED: ['SCREENING', 'REJECTED'],
            SCREENING: ['INTERVIEW', 'REJECTED'],
            INTERVIEW: ['OFFERED', 'REJECTED'],
            OFFERED: ['HIRED', 'REJECTED'],
            HIRED: [],
            REJECTED: [],
        },
    },
];
//# sourceMappingURL=transition.config.js.map