export type StatusEnum = Record<string, string[]>;

export interface TransitionRule {
  entityName: string;
  prismaModel: string;
  transitions: StatusEnum;
  ownershipField?: string;
}

export const TRANSITION_RULES: TransitionRule[] = [
  {
    entityName: 'Property',
    prismaModel: 'property',
    ownershipField: 'assignedToEmployeeId',
    transitions: {
      AVAILABLE: ['RESERVED', 'SOLD'],
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
      NEW: ['CONTACTED', 'LOST'],
      CONTACTED: ['INTERESTED', 'LOST', 'NEW'],
      INTERESTED: ['SITE_VISIT_SCHEDULED', 'NEGOTIATION', 'LOST', 'CONTACTED'],
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
    entityName: 'ConstructionSite',
    prismaModel: 'constructionSite',
    transitions: {
      PLANNING: ['IN_PROGRESS'],
      IN_PROGRESS: ['COMPLETED', 'ON_HOLD'],
      COMPLETED: [],
      ON_HOLD: ['IN_PROGRESS'],
    },
  },
];
