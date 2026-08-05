"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MissingPunchoutJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingPunchoutJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../config/prisma.service");
const governance_event_publisher_1 = require("../../governance-events/governance-event.publisher");
const events_1 = require("../../governance-events/types/events");
const company_time_1 = require("../../../common/utils/company-time");
let MissingPunchoutJob = MissingPunchoutJob_1 = class MissingPunchoutJob {
    prisma;
    eventPublisher;
    logger = new common_1.Logger(MissingPunchoutJob_1.name);
    AUTO_CHECKOUT_HOUR = 18;
    AUTO_CHECKOUT_MINUTE = 0;
    constructor(prisma, eventPublisher) {
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
    }
    async handle() {
        const companies = await this.prisma.company.findMany({
            where: { isActive: true },
            select: { id: true, settings: true },
        });
        for (const company of companies) {
            try {
                await this.processCompany(company.id, company.settings);
            }
            catch (err) {
                this.logger.error(`Error processing company ${company.id}: ${err}`);
            }
        }
    }
    async processCompany(companyId, settingsJson) {
        const settings = settingsJson ?? {};
        const tz = (0, company_time_1.getCompanyTz)(settings);
        const { hours } = (0, company_time_1.getTimeInTz)(tz);
        if (hours < this.AUTO_CHECKOUT_HOUR) {
            return;
        }
        const today = (0, company_time_1.getTodayInTz)(tz);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const records = await this.prisma.attendanceDayAggregate.findMany({
            where: {
                companyId,
                date: { gte: today, lt: tomorrow },
                firstPunchAt: { not: null },
                lastPunchAt: null,
            },
            include: {
                employees: { include: { users: true } },
                attendanceSessions: {
                    where: { sessionStatus: 'ACTIVE' },
                },
            },
        });
        if (records.length === 0)
            return;
        let autoChecked = 0;
        for (const record of records) {
            const defaultCheckOut = new Date(record.date);
            defaultCheckOut.setUTCHours(this.AUTO_CHECKOUT_HOUR, this.AUTO_CHECKOUT_MINUTE, 0, 0);
            await this.prisma.$transaction(async (tx) => {
                for (const session of record.attendanceSessions) {
                    const elapsedMinutes = Math.floor((defaultCheckOut.getTime() - session.sessionStart.getTime()) /
                        60000);
                    const totalWorkedMinutes = Math.max(0, elapsedMinutes - (session.totalBreakMinutes || 0));
                    await tx.attendanceSession.update({
                        where: { id: session.id },
                        data: {
                            sessionEnd: defaultCheckOut,
                            sessionStatus: 'CLOSED',
                            totalWorkedMinutes,
                            lastPunchId: session.lastPunchId,
                        },
                    });
                    await this.eventPublisher.publish(tx, {
                        eventType: events_1.DomainEventTypes.ATTENDANCE_SESSION_CLOSED,
                        entityId: session.id,
                        entityType: 'AttendanceSession',
                        companyId,
                        payload: {
                            companyId,
                            employeeId: record.employeeId,
                            sessionId: session.id,
                        },
                    });
                }
                const allClosedSessions = await tx.attendanceSession.findMany({
                    where: { dayAggregateId: record.id, sessionStatus: 'CLOSED' },
                });
                const totalWork = allClosedSessions.reduce((acc, s) => acc + (s.totalWorkedMinutes || 0), 0);
                const totalBreaks = allClosedSessions.reduce((acc, s) => acc + (s.totalBreakMinutes || 0), 0);
                await tx.attendanceDayAggregate.update({
                    where: { id: record.id },
                    data: {
                        lastPunchAt: defaultCheckOut,
                        totalWorkMinutes: totalWork,
                        totalBreakMinutes: totalBreaks,
                        status: 'COMPLETED',
                    },
                });
            });
            autoChecked++;
            const user = record.employees?.users;
            if (user) {
                this.logger.warn(`Auto-checked out: ${user.firstName} ${user.lastName} (${record.employeeId}) company=${companyId}`);
            }
        }
        if (autoChecked > 0) {
            this.logger.log(`Auto-checked out ${autoChecked} employees in company ${companyId}`);
        }
    }
};
exports.MissingPunchoutJob = MissingPunchoutJob;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MissingPunchoutJob.prototype, "handle", null);
exports.MissingPunchoutJob = MissingPunchoutJob = MissingPunchoutJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_publisher_1.GovernanceEventPublisher])
], MissingPunchoutJob);
//# sourceMappingURL=missing-punchout.job.js.map