export declare const NotificationEvents: {
    readonly LeadAssigned: "lead.assigned";
    readonly LeadConverted: "lead.converted";
    readonly LeaveRequested: "leave.requested";
    readonly LeaveApproved: "leave.approved";
    readonly LeaveRejected: "leave.rejected";
    readonly SiteVisitScheduled: "site-visit.scheduled";
    readonly BookingConfirmed: "booking.confirmed";
    readonly EmployeeInvited: "employee.invited";
    readonly NotificationCreated: "notification.created";
};
export interface NotificationEventPayload {
    userId: string;
    companyId: string;
    title: string;
    message: string;
    type: string;
    link?: string;
}
