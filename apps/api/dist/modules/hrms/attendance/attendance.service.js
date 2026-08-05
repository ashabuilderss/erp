"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const realtime_gateway_1 = require("../../../common/realtime/realtime.gateway");
const prisma_service_1 = require("../../../config/prisma.service");
const transition_service_1 = require("../../../common/services/transition.service");
const governance_event_publisher_1 = require("../../governance-events/governance-event.publisher");
const events_1 = require("../../governance-events/types/events");
const redis_service_1 = require("../../../config/redis.service");
const crypto = __importStar(require("crypto"));
const attendance_history_service_1 = require("./attendance-history.service");
const company_time_1 = require("../../../common/utils/company-time");
const employees_service_1 = require("../employees/employees.service");
const leave_requests_service_1 = require("../leave-requests/leave-requests.service");
const EARTH_RADIUS_M = 6_371_000;
function toRad(deg) {
    return (deg * Math.PI) / 180;
}
function haversineDistance(lat1, lng1, lat2, lng2) {
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
let AttendanceService = class AttendanceService {
    prisma;
    eventPublisher;
    historyService;
    redis;
    transitionService;
    employeesService;
    leaveRequestsService;
    realtimeGateway;
    constructor(prisma, eventPublisher, historyService, redis, transitionService, employeesService, leaveRequestsService, realtimeGateway) {
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
        this.historyService = historyService;
        this.redis = redis;
        this.transitionService = transitionService;
        this.employeesService = employeesService;
        this.leaveRequestsService = leaveRequestsService;
        this.realtimeGateway = realtimeGateway;
    }
    pushToCompany(companyId, data) {
        this.realtimeGateway.broadcastToCompany(companyId, 'attendance', data);
    }
    async generateNonce(employeeId, companyId) {
        const rateLimitKey = `attendance:nonce-ratelimit:${companyId}:${employeeId}`;
        const recentCount = await this.redis.get(rateLimitKey);
        if (recentCount && parseInt(recentCount, 10) >= 5) {
            throw new common_1.BadRequestException('Too many nonce requests. Please wait before requesting again.');
        }
        const nonce = crypto.randomBytes(16).toString('hex');
        const key = `attendance:nonce:${companyId}:${employeeId}`;
        await this.redis.set(key, nonce, 60);
        const currentCount = parseInt(recentCount ?? '0', 10) + 1;
        await this.redis.set(rateLimitKey, String(currentCount), 60);
        return { nonce };
    }
    async getMyAttendance(employeeId, companyId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { settings: true },
        });
        const tz = (0, company_time_1.getCompanyTz)(company?.settings);
        const records = await this.prisma.attendanceDayAggregate.findMany({
            where: { employeeId, companyId },
            orderBy: { date: 'desc' },
            take: 60,
            include: {
                attendanceSessions: true,
            },
        });
        return {
            today: (0, company_time_1.getDateStringInTz)(tz),
            records,
        };
    }
    async punch(employeeId, companyId, dto, ipAddress) {
        const timestamp = new Date();
        const employee = await this.employeesService.findByIdWithCompanySettings(employeeId, companyId);
        if (!employee)
            throw new common_1.BadRequestException('Employee not found in this company');
        let locationMismatch = false;
        if (employee.staffType === 'OFFICE') {
            const officeLocations = await this.prisma.officeLocation.findMany({
                where: { companyId, isActive: true },
            });
            if (officeLocations.length > 0 && ipAddress) {
                const allowedIps = officeLocations
                    .map((loc) => loc.ipAddress)
                    .filter((ip) => !!ip);
                if (allowedIps.length > 0 && !allowedIps.includes(ipAddress)) {
                    throw new common_1.BadRequestException('Unauthorized IP address for office staff');
                }
            }
            if (dto.latitude !== undefined &&
                dto.longitude !== undefined &&
                officeLocations.length > 0) {
                const withinAnyOffice = officeLocations.some((loc) => {
                    if (loc.latitude == null || loc.longitude == null || loc.radius == null) {
                        return false;
                    }
                    const distance = haversineDistance(dto.latitude, dto.longitude, Number(loc.latitude), Number(loc.longitude));
                    return distance <= loc.radius;
                });
                if (!withinAnyOffice) {
                    locationMismatch = true;
                }
            }
        }
        const nonceKey = `attendance:nonce:${companyId}:${employeeId}`;
        const storedNonce = await this.redis.get(nonceKey);
        if (!storedNonce || dto.nonce !== storedNonce) {
            throw new common_1.BadRequestException('Invalid or expired nonce');
        }
        await this.redis.del(nonceKey);
        let matchedGeofenceId = null;
        if (employee.staffType === 'FIELD') {
            if (dto.latitude === undefined || dto.longitude === undefined) {
                throw new common_1.BadRequestException('Location coordinates are required for field staff');
            }
            const geofences = await this.prisma.geofenceVersion.findMany({
                where: { companyId },
            });
            if (geofences.length > 0) {
                let isWithinAny = false;
                for (const gf of geofences) {
                    const distance = haversineDistance(dto.latitude, dto.longitude, Number(gf.latitude), Number(gf.longitude));
                    if (distance <= gf.radiusMeters) {
                        isWithinAny = true;
                        matchedGeofenceId = gf.id;
                        break;
                    }
                }
                if (!isWithinAny) {
                    throw new common_1.BadRequestException('Punch location is outside allowed geofences');
                }
            }
        }
        if (!dto.photoUrl) {
            throw new common_1.BadRequestException('Selfie evidence is mandatory');
        }
        const s = employee.companies.settings ?? {};
        const tz = (0, company_time_1.getCompanyTz)(s);
        const today = (0, company_time_1.getTodayInTz)(tz);
        const approvedLeave = await this.leaveRequestsService.findApprovedLeaveForDate(employeeId, companyId, today);
        if (approvedLeave &&
            (dto.punchType === 'IN' || dto.punchType === 'BREAK_END')) {
            throw new common_1.BadRequestException('Cannot punch in: you have an approved leave for today');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const punch = await tx.attendancePunch.create({
                data: {
                    companyId,
                    employeeId,
                    punchType: dto.punchType,
                    timestamp,
                    deviceId: dto.deviceId,
                    locationId: dto.locationId,
                    latitude: dto.latitude,
                    longitude: dto.longitude,
                    payloadHash: dto.payloadHash,
                    locationMismatch,
                },
            });
            if (dto.photoUrl) {
                const storageObj = await tx.storageObject.create({
                    data: {
                        companyId,
                        storageProvider: process.env.S3_ENDPOINT || 'LOCAL',
                        bucketName: process.env.S3_BUCKET || 'uploads',
                        objectKey: dto.photoUrl,
                        objectVersion: '1',
                    },
                });
                const evidence = await tx.attendanceEvidence.create({
                    data: {
                        companyId,
                        punchId: punch.id,
                        type: 'SELFIE',
                        storageObjectId: storageObj.id,
                        geofenceVersionId: matchedGeofenceId,
                        gpsAccuracy: dto.gpsAccuracy,
                        mockLocationDetected: dto.mockLocationDetected ?? false,
                        developerModeActive: dto.developerModeActive ?? false,
                    },
                });
                await tx.attendanceEvidenceReview.create({
                    data: {
                        companyId,
                        evidenceId: evidence.id,
                        punchId: punch.id,
                        reviewedById: '',
                        status: 'PENDING',
                    },
                });
                await this.eventPublisher.publish(tx, {
                    eventType: events_1.DomainEventTypes.ATTENDANCE_EVIDENCE_PENDING,
                    entityId: evidence.id,
                    entityType: 'AttendanceEvidence',
                    companyId,
                    payload: {
                        companyId,
                        employeeId,
                        punchId: punch.id,
                        evidenceId: evidence.id,
                        reviewId: undefined,
                    },
                });
            }
            await this.evaluateSessionGrouping(tx, punch, companyId, employeeId, today);
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.ATTENDANCE_PUNCH_RECORDED,
                entityId: punch.id,
                entityType: 'AttendancePunch',
                companyId,
                payload: {
                    companyId,
                    employeeId,
                    punchId: punch.id,
                },
            });
            return punch;
        });
        this.pushToCompany(companyId, {
            event: 'punch',
            employeeId,
            punch: result,
        });
        return result;
    }
    async evaluateSessionGrouping(tx, punch, companyId, employeeId, today) {
        let aggregate = await tx.attendanceDayAggregate.findUnique({
            where: {
                companyId_employeeId_date: { companyId, employeeId, date: today },
            },
        });
        if (!aggregate) {
            aggregate = await tx.attendanceDayAggregate.create({
                data: {
                    companyId,
                    employeeId,
                    date: today,
                    status: 'UNDER_REVIEW',
                },
            });
            await this.historyService.record({
                tx,
                companyId,
                targetType: 'AttendanceDayAggregate',
                targetId: aggregate.id,
                actorId: employeeId,
                transitionType: 'CREATED',
                newState: 'UNDER_REVIEW',
            });
        }
        if (punch.punchType === 'IN') {
            const shiftSnapshot = await this.createShiftSnapshot(tx, companyId, employeeId);
            const session = await tx.attendanceSession.create({
                data: {
                    companyId,
                    employeeId,
                    dayAggregateId: aggregate.id,
                    shiftAssignmentSnapshotId: shiftSnapshot?.id ?? undefined,
                    sessionStart: punch.timestamp,
                    firstPunchId: punch.id,
                    sessionStatus: 'ACTIVE',
                },
            });
            await this.historyService.record({
                tx,
                companyId,
                targetType: 'AttendanceSession',
                targetId: session.id,
                actorId: employeeId,
                transitionType: 'SESSION_OPENED',
                newState: 'ACTIVE',
            });
            if (!aggregate.firstPunchAt) {
                await tx.attendanceDayAggregate.update({
                    where: { id: aggregate.id },
                    data: { firstPunchAt: punch.timestamp },
                });
            }
        }
        else if (punch.punchType === 'BREAK_START') {
            const activeSession = await tx.attendanceSession.findFirst({
                where: { dayAggregateId: aggregate.id, sessionStatus: 'ACTIVE' },
                orderBy: { sessionStart: 'desc' },
            });
            if (!activeSession) {
                await this.createAnomaly(tx, companyId, employeeId, aggregate.id, 'MISSING_CHECKOUT', 'BREAK_START received with no active session');
                return;
            }
            await tx.attendanceSession.update({
                where: { id: activeSession.id },
                data: { lastPunchId: punch.id },
            });
        }
        else if (punch.punchType === 'BREAK_END') {
            const activeSession = await tx.attendanceSession.findFirst({
                where: { dayAggregateId: aggregate.id, sessionStatus: 'ACTIVE' },
                orderBy: { sessionStart: 'desc' },
            });
            if (!activeSession?.lastPunchId) {
                await this.createAnomaly(tx, companyId, employeeId, aggregate.id, 'MISSING_CHECKOUT', 'BREAK_END received without a matching BREAK_START');
                return;
            }
            const breakStartPunch = await tx.attendancePunch.findUnique({
                where: { id: activeSession.lastPunchId },
            });
            if (!breakStartPunch || breakStartPunch.punchType !== 'BREAK_START') {
                await this.createAnomaly(tx, companyId, employeeId, aggregate.id, 'MISSING_CHECKOUT', 'BREAK_END received without a matching BREAK_START');
                return;
            }
            const breakMinutes = Math.max(0, Math.floor((punch.timestamp.getTime() - breakStartPunch.timestamp.getTime()) /
                60000));
            await tx.attendanceSession.update({
                where: { id: activeSession.id },
                data: {
                    totalBreakMinutes: (activeSession.totalBreakMinutes || 0) + breakMinutes,
                    lastPunchId: punch.id,
                },
            });
        }
        else if (punch.punchType === 'OUT') {
            const activeSession = await tx.attendanceSession.findFirst({
                where: { dayAggregateId: aggregate.id, sessionStatus: 'ACTIVE' },
                orderBy: { sessionStart: 'desc' },
            });
            if (activeSession) {
                const elapsedMinutes = Math.floor((punch.timestamp.getTime() - activeSession.sessionStart.getTime()) /
                    60000);
                const totalWorkedMinutes = Math.max(0, elapsedMinutes - (activeSession.totalBreakMinutes || 0));
                await tx.attendanceSession.update({
                    where: { id: activeSession.id },
                    data: {
                        sessionEnd: punch.timestamp,
                        lastPunchId: punch.id,
                        sessionStatus: 'CLOSED',
                        totalWorkedMinutes,
                    },
                });
                await this.historyService.record({
                    tx,
                    companyId,
                    targetType: 'AttendanceSession',
                    targetId: activeSession.id,
                    actorId: employeeId,
                    transitionType: 'SESSION_CLOSED',
                    previousState: 'ACTIVE',
                    newState: 'CLOSED',
                });
                const allClosedSessions = await tx.attendanceSession.findMany({
                    where: { dayAggregateId: aggregate.id, sessionStatus: 'CLOSED' },
                });
                const totalWork = allClosedSessions.reduce((acc, s) => acc + (s.totalWorkedMinutes || 0), 0);
                const totalBreaks = allClosedSessions.reduce((acc, s) => acc + (s.totalBreakMinutes || 0), 0);
                const remainingActive = await tx.attendanceSession.count({
                    where: { dayAggregateId: aggregate.id, sessionStatus: 'ACTIVE' },
                });
                const newStatus = remainingActive === 0 ? 'COMPLETED' : 'UNDER_REVIEW';
                await tx.attendanceDayAggregate.update({
                    where: { id: aggregate.id },
                    data: {
                        lastPunchAt: punch.timestamp,
                        totalWorkMinutes: totalWork,
                        totalBreakMinutes: totalBreaks,
                        status: newStatus,
                    },
                });
                if (newStatus === 'COMPLETED') {
                    await this.historyService.record({
                        tx,
                        companyId,
                        targetType: 'AttendanceDayAggregate',
                        targetId: aggregate.id,
                        actorId: employeeId,
                        transitionType: 'DAY_COMPLETED',
                        previousState: 'UNDER_REVIEW',
                        newState: 'COMPLETED',
                    });
                }
                await this.eventPublisher.publish(tx, {
                    eventType: events_1.DomainEventTypes.ATTENDANCE_SESSION_CLOSED,
                    entityId: activeSession.id,
                    entityType: 'AttendanceSession',
                    companyId,
                    payload: {
                        companyId,
                        employeeId,
                        sessionId: activeSession.id,
                    },
                });
            }
            else {
                await this.createAnomaly(tx, companyId, employeeId, aggregate.id, 'MISSING_CHECKOUT', 'Punch OUT received with no active session');
            }
        }
    }
    async createShiftSnapshot(tx, companyId, employeeId) {
        const assignment = await tx.employeeShiftAssignment.findFirst({
            where: { companyId, employeeId },
            orderBy: { assignedAt: 'desc' },
            include: { shiftDefinitions: true },
        });
        const shift = assignment?.shiftDefinitions ??
            (await tx.shiftDefinition.findFirst({
                where: { companyId, isActive: true },
                orderBy: { createdAt: 'asc' },
            }));
        if (!shift) {
            return null;
        }
        return tx.shiftAssignmentSnapshot.create({
            data: {
                companyId,
                employeeId,
                shiftDefinitionId: shift.id,
                shiftName: shift.name,
                startTime: shift.startTime,
                endTime: shift.endTime,
                gracePeriodMinutes: shift.gracePeriodMinutes,
            },
        });
    }
    async createAnomaly(tx, companyId, employeeId, aggregateId, anomalyType, remarks) {
        const anomaly = await tx.attendanceAnomaly.create({
            data: {
                companyId,
                employeeId,
                attendanceDayAggregateId: aggregateId,
                anomalyType,
                severity: 'HIGH',
                detectedBy: 'SYSTEM',
                remarks,
            },
        });
        await this.historyService.record({
            tx,
            companyId,
            targetType: 'AttendanceAnomaly',
            targetId: anomaly.id,
            actorId: employeeId,
            transitionType: 'ANOMALY_DETECTED',
            newState: anomalyType,
            reason: remarks,
        });
    }
    async findAll(companyId, query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 10, 100);
        const skip = (page - 1) * limit;
        const where = { companyId };
        if (query.employeeId) {
            where.employeeId = query.employeeId;
        }
        if (query.status) {
            where.status = query.status;
        }
        if (query.dateFrom || query.dateTo) {
            where.date = {};
            if (query.dateFrom)
                where.date.gte = new Date(query.dateFrom);
            if (query.dateTo)
                where.date.lte = new Date(query.dateTo);
        }
        const allowedSortColumns = ['date', 'status', 'createdAt'];
        const sortBy = allowedSortColumns.includes(query.sortBy)
            ? query.sortBy
            : 'date';
        const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
        const [total, records] = await Promise.all([
            this.prisma.attendanceDayAggregate.count({ where }),
            this.prisma.attendanceDayAggregate.findMany({
                where,
                include: { employees: true },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
        ]);
        return { data: records, total, page, limit };
    }
    async getTodayStats(companyId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { settings: true },
        });
        const tz = (0, company_time_1.getCompanyTz)(company?.settings);
        const today = (0, company_time_1.getTodayInTz)(tz);
        const total = await this.employeesService.countActive(companyId);
        const records = await this.prisma.attendanceDayAggregate.findMany({
            where: { companyId, date: today },
        });
        let present = 0;
        for (const r of records) {
            if (r.status === 'UNDER_REVIEW' || r.status === 'COMPLETED')
                present++;
        }
        const todayDate = new Date(today);
        const approvedLeaves = await this.leaveRequestsService.countApprovedLeaves(companyId, todayDate);
        const onLeave = approvedLeaves;
        const absent = Math.max(0, total - present - onLeave);
        return { present, absent, onLeave, total };
    }
    async getLast7Days(companyId) {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dateStart = new Date(dateStr);
            const records = await this.prisma.attendanceDayAggregate.findMany({
                where: { companyId, date: dateStart },
            });
            let present = 0;
            for (const r of records) {
                if (r.status === 'UNDER_REVIEW' || r.status === 'COMPLETED')
                    present++;
            }
            const approvedLeaves = await this.leaveRequestsService.countApprovedLeaves(companyId, dateStart);
            const totalEmployees = await this.employeesService.countActive(companyId);
            const onLeave = approvedLeaves;
            const absent = Math.max(0, totalEmployees - present - onLeave);
            days.push({ date: dateStr, present, absent, onLeave });
        }
        const employees = await this.employeesService.findActiveBasic(companyId);
        return { days, employees };
    }
    async findOne(companyId, id) {
        return this.prisma.attendanceDayAggregate.findFirst({
            where: { id, companyId },
            include: {
                employees: true,
                attendanceSessions: true,
                attendanceAnomalies: true,
            },
        });
    }
    async createManual(companyId, dto) {
        const existing = await this.prisma.attendanceDayAggregate.findFirst({
            where: {
                companyId,
                employeeId: dto.employeeId,
                date: new Date(dto.date),
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Attendance record already exists for this date');
        }
        const record = await this.prisma.attendanceDayAggregate.create({
            data: {
                companyId,
                employeeId: dto.employeeId,
                date: new Date(dto.date),
                status: dto.status,
            },
        });
        if (dto.checkIn) {
            let checkInDate;
            if (dto.checkIn.includes('T')) {
                checkInDate = new Date(dto.checkIn);
            }
            else {
                checkInDate = new Date(dto.date);
                const [hh, mm] = dto.checkIn.split(':').map(Number);
                checkInDate.setHours(hh, mm, 0, 0);
            }
            const inPunch = await this.prisma.attendancePunch.create({
                data: {
                    companyId,
                    employeeId: dto.employeeId,
                    punchType: 'IN',
                    timestamp: checkInDate,
                },
            });
            const shiftSnapshot = await this.createShiftSnapshot(this.prisma, companyId, dto.employeeId);
            let totalWorkedMinutes = 0;
            let sessionStatus = 'ACTIVE';
            let sessionEnd;
            if (dto.checkOut) {
                let checkOutDate;
                if (dto.checkOut.includes('T')) {
                    checkOutDate = new Date(dto.checkOut);
                }
                else {
                    checkOutDate = new Date(dto.date);
                    const [oh, om] = dto.checkOut.split(':').map(Number);
                    checkOutDate.setHours(oh, om, 0, 0);
                }
                sessionEnd = checkOutDate;
                sessionStatus = 'CLOSED';
                totalWorkedMinutes = Math.max(0, Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / 60000));
                const outPunch = await this.prisma.attendancePunch.create({
                    data: {
                        companyId,
                        employeeId: dto.employeeId,
                        punchType: 'OUT',
                        timestamp: checkOutDate,
                    },
                });
                await this.prisma.attendanceSession.create({
                    data: {
                        companyId,
                        employeeId: dto.employeeId,
                        dayAggregateId: record.id,
                        sessionStart: checkInDate,
                        sessionEnd: checkOutDate,
                        firstPunchId: inPunch.id,
                        lastPunchId: outPunch.id,
                        sessionStatus,
                        totalWorkedMinutes,
                        shiftAssignmentSnapshotId: shiftSnapshot?.id ?? undefined,
                    },
                });
                await this.prisma.attendanceDayAggregate.update({
                    where: { id: record.id },
                    data: {
                        firstPunchAt: checkInDate,
                        lastPunchAt: checkOutDate,
                        totalWorkMinutes: totalWorkedMinutes,
                    },
                });
            }
            else {
                await this.prisma.attendanceSession.create({
                    data: {
                        companyId,
                        employeeId: dto.employeeId,
                        dayAggregateId: record.id,
                        sessionStart: checkInDate,
                        firstPunchId: inPunch.id,
                        sessionStatus,
                        shiftAssignmentSnapshotId: shiftSnapshot?.id ?? undefined,
                    },
                });
                await this.prisma.attendanceDayAggregate.update({
                    where: { id: record.id },
                    data: { firstPunchAt: checkInDate },
                });
            }
        }
        return record;
    }
    async update(companyId, id, dto) {
        const record = await this.prisma.attendanceDayAggregate.findFirst({
            where: { id, companyId },
        });
        if (!record) {
            throw new common_1.BadRequestException('Attendance record not found');
        }
        if (dto.status) {
            this.transitionService.validate('DayAggregate', record.status, dto.status);
        }
        return this.prisma.attendanceDayAggregate.update({
            where: { id },
            data: { status: dto.status },
        });
    }
    async remove(companyId, id) {
        const record = await this.prisma.attendanceDayAggregate.findFirst({
            where: { id, companyId },
        });
        if (!record) {
            throw new common_1.BadRequestException('Attendance record not found');
        }
        return this.prisma.attendanceDayAggregate.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async verify(companyId, id) {
        const record = await this.prisma.attendanceDayAggregate.findFirst({
            where: { id, companyId },
        });
        if (!record) {
            throw new common_1.BadRequestException('Attendance record not found');
        }
        this.transitionService.validate('DayAggregate', record.status, 'COMPLETED');
        return this.prisma.attendanceDayAggregate.update({
            where: { id },
            data: { status: 'COMPLETED' },
        });
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_publisher_1.GovernanceEventPublisher,
        attendance_history_service_1.AttendanceHistoryService,
        redis_service_1.RedisService,
        transition_service_1.TransitionService,
        employees_service_1.EmployeesService,
        leave_requests_service_1.LeaveRequestsService,
        realtime_gateway_1.RealtimeGateway])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map