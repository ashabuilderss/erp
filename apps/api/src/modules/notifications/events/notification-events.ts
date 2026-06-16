export const NotificationEvents = {
  LeadAssigned: 'lead.assigned',
  LeadConverted: 'lead.converted',
  LeaveRequested: 'leave.requested',
  LeaveApproved: 'leave.approved',
  LeaveRejected: 'leave.rejected',
  SiteVisitScheduled: 'site-visit.scheduled',
  BookingConfirmed: 'booking.confirmed',
  EmployeeInvited: 'employee.invited',
  NotificationCreated: 'notification.created',
} as const;

export interface NotificationEventPayload {
  userId: string;
  companyId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}
