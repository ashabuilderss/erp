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
var WeeklyOffHolidaySyncJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyOffHolidaySyncJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../config/prisma.service");
let WeeklyOffHolidaySyncJob = WeeklyOffHolidaySyncJob_1 = class WeeklyOffHolidaySyncJob {
    prisma;
    logger = new common_1.Logger(WeeklyOffHolidaySyncJob_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle() {
        this.logger.log('Syncing weekly-off and holiday rules...');
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const companies = await this.prisma.company.findMany({
            where: { isActive: true },
            select: { id: true, settings: true },
        });
        for (const company of companies) {
            const settings = company.settings ?? {};
            const weeklyOffDays = settings.weeklyOffDays ?? ['SUNDAY'];
            const dayName = [
                'SUNDAY',
                'MONDAY',
                'TUESDAY',
                'WEDNESDAY',
                'THURSDAY',
                'FRIDAY',
                'SATURDAY',
            ][today.getDay()];
            if (weeklyOffDays.includes(dayName)) {
                const employees = await this.prisma.employee.findMany({
                    where: { companyId: company.id, status: 'ACTIVE' },
                    select: { id: true },
                });
                for (const emp of employees) {
                    await this.prisma.attendanceDayAggregate.upsert({
                        where: {
                            companyId_employeeId_date: {
                                companyId: company.id,
                                employeeId: emp.id,
                                date: today,
                            },
                        },
                        create: {
                            employeeId: emp.id,
                            companyId: company.id,
                            date: today,
                            status: 'COMPLETED',
                            totalWorkMinutes: 540,
                            firstPunchAt: new Date(today.getTime() + 10 * 60 * 60 * 1000),
                            lastPunchAt: new Date(today.getTime() + 19 * 60 * 60 * 1000),
                        },
                        update: {},
                    });
                }
                this.logger.log(`Weekly off (${dayName}) synced for ${employees.length} employees in ${company.id}`);
            }
        }
    }
};
exports.WeeklyOffHolidaySyncJob = WeeklyOffHolidaySyncJob;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WeeklyOffHolidaySyncJob.prototype, "handle", null);
exports.WeeklyOffHolidaySyncJob = WeeklyOffHolidaySyncJob = WeeklyOffHolidaySyncJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WeeklyOffHolidaySyncJob);
//# sourceMappingURL=weekly-off-holiday-sync.job.js.map