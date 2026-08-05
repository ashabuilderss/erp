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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EodReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let EodReportsService = class EodReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(companyId, date, employeeId) {
        return this.prisma.eodReport.findMany({
            where: {
                companyId,
                ...(date && { reportDate: new Date(date) }),
                ...(employeeId && { employeeId }),
            },
            orderBy: { reportDate: 'desc' },
            include: {
                employeesEodReportsEmployeeIdToemployees: {
                    select: { employeeCode: true },
                },
                employeesEodReportsReviewedByIdToemployees: {
                    select: { employeeCode: true },
                },
            },
        });
    }
    async findByEmployee(employeeId, companyId, date) {
        return this.prisma.eodReport.findMany({
            where: {
                employeeId,
                companyId,
                ...(date && { reportDate: new Date(date) }),
            },
            orderBy: { reportDate: 'desc' },
        });
    }
    async findOne(id, companyId) {
        const report = await this.prisma.eodReport.findFirst({
            where: { id, companyId },
            include: {
                employeesEodReportsEmployeeIdToemployees: {
                    select: { employeeCode: true },
                },
                employeesEodReportsReviewedByIdToemployees: {
                    select: { employeeCode: true },
                },
            },
        });
        if (!report)
            throw new common_1.NotFoundException('EOD report not found');
        return report;
    }
    async create(dto, employeeId, companyId) {
        return this.prisma.eodReport.create({
            data: {
                employeeId,
                companyId,
                reportDate: new Date(dto.reportDate),
                accomplishments: dto.accomplishments,
                challenges: dto.challenges,
                tomorrowPlan: dto.tomorrowPlan,
                photoUrls: dto.photoUrls || [],
            },
        });
    }
    async update(id, dto, companyId) {
        const report = await this.prisma.eodReport.findFirst({
            where: { id, companyId },
        });
        if (!report)
            throw new common_1.NotFoundException('EOD report not found');
        return this.prisma.eodReport.update({
            where: { id },
            data: {
                ...(dto.accomplishments !== undefined && {
                    accomplishments: dto.accomplishments,
                }),
                ...(dto.challenges !== undefined && { challenges: dto.challenges }),
                ...(dto.tomorrowPlan !== undefined && {
                    tomorrowPlan: dto.tomorrowPlan,
                }),
                ...(dto.status !== undefined && { status: dto.status }),
            },
        });
    }
    async review(id, dto, reviewedById, companyId) {
        const report = await this.prisma.eodReport.findFirst({
            where: { id, companyId },
        });
        if (!report)
            throw new common_1.NotFoundException('EOD report not found');
        return this.prisma.eodReport.update({
            where: { id },
            data: {
                status: dto.status ?? 'REVIEWED',
                reviewedById,
                reviewedAt: new Date(),
            },
        });
    }
};
exports.EodReportsService = EodReportsService;
exports.EodReportsService = EodReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EodReportsService);
//# sourceMappingURL=eod-reports.service.js.map