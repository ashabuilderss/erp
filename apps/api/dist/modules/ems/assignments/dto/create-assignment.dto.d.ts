export declare enum AssignmentType {
    PROPERTY = "PROPERTY",
    LEAD = "LEAD",
    SITE_VISIT = "SITE_VISIT",
    BOOKING = "BOOKING"
}
export declare class CreateAssignmentDto {
    type: AssignmentType;
    employeeId: string;
    entityId: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
}
