"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendancePolicyEngine = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let AttendancePolicyEngine = class AttendancePolicyEngine {
    evaluateDay(input) {
        const leaveMinutes = Math.max(0, input.approvedLeaveMinutes);
        const payableMinutes = Math.min(input.policy.fullDayMinutes, Math.max(0, input.workMinutes) + leaveMinutes);
        const exemptDay = input.isHoliday === true || input.isWeeklyOff === true;
        const isAbsent = !exemptDay && payableMinutes === 0;
        const lateMinutes = this.calculateLateMinutes(input);
        const isLate = lateMinutes > 0;
        const isHalfDay = !isAbsent &&
            !exemptDay &&
            (isLate ||
                (payableMinutes > 0 &&
                    payableMinutes < input.policy.halfDayThresholdMinutes));
        const overtimeMinutes = Math.max(0, input.workMinutes - input.policy.overtimeAfterMinutes);
        const anomalies = [];
        if (input.device.required && !input.device.isTrusted) {
            anomalies.push(client_1.AnomalyType.DEVICE_UNTRUSTED);
        }
        if (input.geofence.required &&
            input.geofence.distanceMeters !== undefined &&
            input.geofence.radiusMeters !== undefined &&
            input.geofence.distanceMeters > input.geofence.radiusMeters) {
            anomalies.push(client_1.AnomalyType.OUTSIDE_GEOFENCE);
        }
        if (isLate && !isAbsent) {
            anomalies.push(client_1.AnomalyType.LATE_CHECKIN);
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
    calculateLateMinutes(input) {
        if (!input.firstPunchAt)
            return 0;
        const punchMinutes = this.minutesSinceMidnight(input.firstPunchAt, input.timeZone);
        const shiftStartMinutes = this.parseClockTime(input.shift.startTime);
        const allowedArrival = shiftStartMinutes +
            input.shift.gracePeriodMinutes +
            input.policy.lateAfterMinutes;
        return Math.max(0, punchMinutes - allowedArrival);
    }
    parseClockTime(value) {
        const [hours, minutes] = value.split(':').map((part) => Number(part));
        return hours * 60 + minutes;
    }
    minutesSinceMidnight(date, timeZone) {
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
        const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
        return hour * 60 + minute;
    }
};
exports.AttendancePolicyEngine = AttendancePolicyEngine;
exports.AttendancePolicyEngine = AttendancePolicyEngine = __decorate([
    (0, common_1.Injectable)()
], AttendancePolicyEngine);
//# sourceMappingURL=attendance-policy.engine.js.map