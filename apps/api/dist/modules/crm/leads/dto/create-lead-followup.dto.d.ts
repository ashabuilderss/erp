export declare class CreateLeadFollowUpDto {
    type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
    outcome?: string;
    nextFollowUpDate?: string;
    notes: string;
}
