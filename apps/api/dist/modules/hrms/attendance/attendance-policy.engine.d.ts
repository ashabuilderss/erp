import { AnomalyType } from '@prisma/client';
export interface AttendancePolicyShiftInput {
    startTime: string;
    endTime: string;
    gracePeriodMinutes: number;
}
export interface AttendancePolicyRuleInput {
    halfDayThresholdMinutes: number;
    fullDayMinutes: number;
    overtimeAfterMinutes: number;
    lateAfterMinutes: number;
}
export interface AttendancePolicyEvaluationInput {
    workMinutes: number;
    breakMinutes: number;
    firstPunchAt: Date | null;
    lastPunchAt: Date | null;
    approvedLeaveMinutes: number;
    shift: AttendancePolicyShiftInput;
    policy: AttendancePolicyRuleInput;
    device: {
        required: boolean;
        isTrusted: boolean;
    };
    geofence: {
        required: boolean;
        distanceMeters?: number;
        radiusMeters?: number;
    };
    isHoliday?: boolean;
    isWeeklyOff?: boolean;
    timeZone?: string;
}
export interface AttendancePolicyEvaluationResult {
    isLate: boolean;
    lateMinutes: number;
    isHalfDay: boolean;
    isAbsent: boolean;
    overtimeMinutes: number;
    payableMinutes: number;
    leaveMinutes: number;
    anomalies: AnomalyType[];
}
export declare class AttendancePolicyEngine {
    evaluateDay(input: AttendancePolicyEvaluationInput): AttendancePolicyEvaluationResult;
    private calculateLateMinutes;
    private parseClockTime;
    private minutesSinceMidnight;
}
