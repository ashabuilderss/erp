import { AttendancePolicyEngine } from './attendance-policy.engine';

describe('AttendancePolicyEngine', () => {
  const engine = new AttendancePolicyEngine();

  it('evaluates late arrival, half day, overtime, leave, device trust, and geofence rules in one policy result', () => {
    const result = engine.evaluateDay({
      workMinutes: 270,
      breakMinutes: 30,
      firstPunchAt: new Date('2026-07-03T04:50:00.000Z'),
      lastPunchAt: new Date('2026-07-03T13:30:00.000Z'),
      approvedLeaveMinutes: 0,
      shift: {
        startTime: '10:15',
        endTime: '18:00',
        gracePeriodMinutes: 0,
      },
      policy: {
        halfDayThresholdMinutes: 300,
        fullDayMinutes: 465,
        overtimeAfterMinutes: 465,
        lateAfterMinutes: 0,
      },
      device: {
        required: true,
        isTrusted: false,
      },
      geofence: {
        required: true,
        distanceMeters: 121,
        radiusMeters: 100,
      },
      timeZone: 'Asia/Kolkata',
    });

    expect(result.isLate).toBe(true);
    expect(result.lateMinutes).toBe(5);
    expect(result.isHalfDay).toBe(true);
    expect(result.isAbsent).toBe(false);
    expect(result.overtimeMinutes).toBe(0);
    expect(result.payableMinutes).toBe(270);
    expect(result.anomalies).toEqual(
      expect.arrayContaining([
        'DEVICE_UNTRUSTED',
        'OUTSIDE_GEOFENCE',
        'LATE_CHECKIN',
      ]),
    );
  });

  it('does not mark approved leave as absent', () => {
    const result = engine.evaluateDay({
      workMinutes: 0,
      breakMinutes: 0,
      firstPunchAt: null,
      lastPunchAt: null,
      approvedLeaveMinutes: 465,
      shift: {
        startTime: '10:15',
        endTime: '18:00',
        gracePeriodMinutes: 0,
      },
      policy: {
        halfDayThresholdMinutes: 300,
        fullDayMinutes: 465,
        overtimeAfterMinutes: 465,
        lateAfterMinutes: 0,
      },
      device: {
        required: false,
        isTrusted: true,
      },
      geofence: {
        required: false,
      },
    });

    expect(result.isAbsent).toBe(false);
    expect(result.leaveMinutes).toBe(465);
    expect(result.payableMinutes).toBe(465);
  });

  it('forces half-day when employee arrives late even if they work a full day', () => {
    const result = engine.evaluateDay({
      workMinutes: 450,
      breakMinutes: 30,
      firstPunchAt: new Date('2026-07-03T04:50:00.000Z'),
      lastPunchAt: new Date('2026-07-03T13:00:00.000Z'),
      approvedLeaveMinutes: 0,
      shift: {
        startTime: '10:15',
        endTime: '18:00',
        gracePeriodMinutes: 0,
      },
      policy: {
        halfDayThresholdMinutes: 300,
        fullDayMinutes: 465,
        overtimeAfterMinutes: 465,
        lateAfterMinutes: 0,
      },
      device: { required: false, isTrusted: true },
      geofence: { required: false },
      timeZone: 'Asia/Kolkata',
    });

    expect(result.isLate).toBe(true);
    expect(result.isHalfDay).toBe(true);
    expect(result.payableMinutes).toBe(450);
  });

  it('does not force half-day on exempt holidays even if late', () => {
    const result = engine.evaluateDay({
      workMinutes: 200,
      breakMinutes: 0,
      firstPunchAt: new Date('2026-07-03T04:50:00.000Z'),
      lastPunchAt: new Date('2026-07-03T10:00:00.000Z'),
      approvedLeaveMinutes: 0,
      shift: {
        startTime: '10:15',
        endTime: '18:00',
        gracePeriodMinutes: 0,
      },
      policy: {
        halfDayThresholdMinutes: 300,
        fullDayMinutes: 465,
        overtimeAfterMinutes: 465,
        lateAfterMinutes: 0,
      },
      device: { required: false, isTrusted: true },
      geofence: { required: false },
      isHoliday: true,
      timeZone: 'Asia/Kolkata',
    });

    expect(result.isHalfDay).toBe(false);
    expect(result.isAbsent).toBe(false);
  });

  it('does not force half-day on weekly-off days even if late', () => {
    const result = engine.evaluateDay({
      workMinutes: 200,
      breakMinutes: 0,
      firstPunchAt: new Date('2026-07-03T04:50:00.000Z'),
      lastPunchAt: new Date('2026-07-03T10:00:00.000Z'),
      approvedLeaveMinutes: 0,
      shift: {
        startTime: '10:15',
        endTime: '18:00',
        gracePeriodMinutes: 0,
      },
      policy: {
        halfDayThresholdMinutes: 300,
        fullDayMinutes: 465,
        overtimeAfterMinutes: 465,
        lateAfterMinutes: 0,
      },
      device: { required: false, isTrusted: true },
      geofence: { required: false },
      isWeeklyOff: true,
      timeZone: 'Asia/Kolkata',
    });

    expect(result.isHalfDay).toBe(false);
    expect(result.isAbsent).toBe(false);
  });
});
