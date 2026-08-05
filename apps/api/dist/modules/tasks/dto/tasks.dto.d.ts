import { TaskCategory, TaskPriority } from '@prisma/client';
export declare class CreateTaskDto {
    assigneeId: string;
    category: TaskCategory;
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate: string;
    slaHours?: number;
}
export declare class ReassignTaskDto {
    newAssigneeId: string;
    comments?: string;
}
export declare class SubmitProofDto {
    submissionUrl: string;
    comments?: string;
}
export declare class ReviewProofDto {
    comments?: string;
}
export declare class CreateExtensionDto {
    requestedDueDate: string;
    reason: string;
}
