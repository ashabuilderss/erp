import { Injectable } from '@nestjs/common';
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

@Injectable()
export class AttendancePolicyEngine {
  evaluateDay(
    input: AttendancePolicyEvaluationInput,
  ): AttendancePolicyEvaluationResult {
    const leaveMinutes = Math.max(0, input.approvedLeaveMinutes);
    const payableMinutes = Math.min(
      input.policy.fullDayMinutes,
      Math.max(0, input.workMinutes) + leaveMinutes,
    );
    const exemptDay = input.isHoliday === true || input.isWeeklyOff === true;
    const isAbsent = !exemptDay && payableMinutes === 0;
    const lateMinutes = this.calculateLateMinutes(input);
    const isLate = lateMinutes > 0;

    const isHalfDay =
      !isAbsent &&
      !exemptDay &&
      (isLate ||
        (payableMinutes > 0 &&
          payableMinutes < input.policy.halfDayThresholdMinutes));

    const overtimeMinutes = Math.max(
      0,
      input.workMinutes - input.policy.overtimeAfterMinutes,
    );
    const anomalies: AnomalyType[] = [];

    if (input.device.required && !input.device.isTrusted) {
      anomalies.push(AnomalyType.DEVICE_UNTRUSTED);
    }

    if (
      input.geofence.required &&
      input.geofence.distanceMeters !== undefined &&
      input.geofence.radiusMeters !== undefined &&
      input.geofence.distanceMeters > input.geofence.radiusMeters
    ) {
      anomalies.push(AnomalyType.OUTSIDE_GEOFENCE);
    }

    if (isLate && !isAbsent) {
      anomalies.push(AnomalyType.LATE_CHECKIN);
    }

    return {
      isLate,
      lateMinutes,
      isHalfDay,
      isAbsent,
      overtimeMinutes,
      payableMinutes,
      leaveMinutes,
      anomalies,
    };
  }

  private calculateLateMinutes(input: AttendancePolicyEvaluationInput): number {
    if (!input.firstPunchAt) return 0;

    const punchMinutes = this.minutesSinceMidnight(
      input.firstPunchAt,
      input.timeZone,
    );
    const shiftStartMinutes = this.parseClockTime(input.shift.startTime);
    const allowedArrival =
      shiftStartMinutes +
      input.shift.gracePeriodMinutes +
      input.policy.lateAfterMinutes;

    return Math.max(0, punchMinutes - allowedArrival);
  }

  private parseClockTime(value: string): number {
    const [hours, minutes] = value.split(':').map((part) => Number(part));
    return hours * 60 + minutes;
  }

  private minutesSinceMidnight(date: Date, timeZone?: string): number {
    if (!timeZone) {
      return date.getUTCHours() * 60 + date.getUTCMinutes();
    }

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(date);
    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
    const minute = Number(
      parts.find((part) => part.type === 'minute')?.value ?? 0,
    );

    return hour * 60 + minute;
  }
}
