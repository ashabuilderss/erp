export declare class CreateMeetingDto {
    title: string;
    scheduledAt: string;
    location?: string;
    organizerId?: string;
    attendeeIds?: string[];
}
export declare class UpdateMeetingDto {
    title?: string;
    scheduledAt?: string;
    location?: string;
}
export declare class AddAttendeeDto {
    employeeId: string;
}
export declare class MarkAttendanceDto {
    attended?: boolean;
}
export declare class CreateMinutesDto {
    content: string;
    recordedById?: string;
}
export declare class CreateActionItemDto {
    description: string;
    assigneeId?: string;
    dueDate?: string;
}
export declare class UpdateActionItemDto {
    description?: string;
    assigneeId?: string;
    dueDate?: string;
    taskId?: string;
}
export declare class QueryMeetingDto {
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
}
