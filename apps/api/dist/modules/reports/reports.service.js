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
var ReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const redis_service_1 = require("../../config/redis.service");
const crypto = __importStar(require("crypto"));
const export_orchestration_service_1 = require("./export-orchestration.service");
let ReportsService = ReportsService_1 = class ReportsService {
    prisma;
    redis;
    orchestration;
    logger = new common_1.Logger(ReportsService_1.name);
    analyticsCacheTTL = 120;
    reportCacheTTL = 600;
    constructor(prisma, redis, orchestration) {
        this.prisma = prisma;
        this.redis = redis;
        this.orchestration = orchestration;
    }
    ownershipWhere(ownership) {
        if (ownership.userRole === 'OWNER' || ownership.userRole === 'ADMIN')
            return {};
        if (ownership.employeeId)
            return { assignedToEmployeeId: ownership.employeeId };
        return {};
    }
    dateRangeWhere(dateFrom, dateTo) {
        const where = {};
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = new Date(dateFrom);
            if (dateTo)
                where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
        }
        return where;
    }
    periodDateRange(period) {
        const now = new Date();
        const dateTo = now.toISOString().slice(0, 10);
        let dateFrom;
        switch (period) {
            case 'week': {
                const weekAgo = new Date(now.getTime() - 7 * 86400000);
                dateFrom = weekAgo.toISOString().slice(0, 10);
                break;
            }
            case 'month': {
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                dateFrom = monthAgo.toISOString().slice(0, 10);
                break;
            }
            case 'quarter': {
                const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                dateFrom = quarterAgo.toISOString().slice(0, 10);
                break;
            }
            case 'year': {
                const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                dateFrom = yearAgo.toISOString().slice(0, 10);
                break;
            }
            default: {
                const defaultAgo = new Date(now.getTime() - 30 * 86400000);
                dateFrom = defaultAgo.toISOString().slice(0, 10);
            }
        }
        return { dateFrom, dateTo };
    }
    cacheKey(prefix, companyId, role, employeeId, query) {
        const hash = crypto
            .createHash('md5')
            .update(query)
            .digest('hex')
            .slice(0, 8);
        return `analytics:${prefix}:${companyId}:${role}:${employeeId || 'all'}:${hash}`;
    }
    reportCatalog = [
        {
            key: 'employees',
            title: 'Employee Directory',
            description: 'List of all employees with department, designation, and status',
            entities: ['employees', 'departments', 'designations'],
        },
        {
            key: 'attendance',
            title: 'Attendance Summary',
            description: 'Attendance records with status breakdown by date range',
            entities: ['attendance', 'employees'],
        },
        {
            key: 'leaves',
            title: 'Leave Requests',
            description: 'All leave requests with type, status, and approval info',
            entities: ['leave_requests', 'leave_allocations', 'employees'],
        },
        {
            key: 'payroll',
            title: 'Payroll Summary',
            description: 'Payroll runs with total earnings, deductions, and net pay',
            entities: ['payroll_runs', 'payslips'],
        },
        {
            key: 'properties',
            title: 'Property Portfolio',
            description: 'All properties with status, type, pricing, and assignment',
            entities: ['properties', 'employees'],
        },
        {
            key: 'leads',
            title: 'Lead Pipeline',
            description: 'Lead tracking with status, source, and conversion data',
            entities: ['leads', 'properties', 'employees'],
        },
        {
            key: 'bookings',
            title: 'Booking Report',
            description: 'Booking details with customer, property, and payment status',
            entities: ['bookings', 'customers', 'properties'],
        },
        {
            key: 'commissions',
            title: 'Commission Report',
            description: 'Pipeline commissions with status and payout tracking',
            entities: ['pipeline_commissions', 'employees'],
        },
        {
            key: 'inventory',
            title: 'Site Inventory',
            description: 'Material inventory by construction site',
            entities: ['inventory_items', 'materials', 'construction_sites'],
        },
        {
            key: 'labour',
            title: 'Labour Report',
            description: 'Labour entries by site with type and wage details',
            entities: ['labourEntries', 'construction_sites'],
        },
    ];
    async getCatalog() {
        return { items: this.reportCatalog };
    }
    async getKPIDashboard(ownership, dto) {
        const { companyId } = ownership;
        const { dateFrom, dateTo } = dto.dateFrom
            ? { dateFrom: dto.dateFrom, dateTo: dto.dateTo }
            : this.periodDateRange(dto.period || 'month');
        const cacheKey = this.cacheKey('kpi', companyId, ownership.userRole, ownership.employeeId, `${dateFrom}:${dateTo}`);
        const cached = await this.redis.get(cacheKey);
        if (cached)
            return cached;
        const ownWhere = this.ownershipWhere(ownership);
        const dateWhere = this.dateRangeWhere(dateFrom, dateTo);
        const [leadCount, convertedLeads, propertyCount, bookingCount, bookingRevenue, employeeCount, siteVisitCount, activeIncentives, pendingLeaves, attendanceTrend, departmentDistribution, propertiesByStatus,] = await Promise.all([
            this.prisma.lead.count({ where: { companyId, ...ownWhere } }),
            this.prisma.lead.count({
                where: { companyId, ...ownWhere, status: 'CONVERTED' },
            }),
            this.prisma.property.count({ where: { companyId } }),
            this.prisma.booking.count({ where: { companyId, ...ownWhere } }),
            this.prisma.booking.aggregate({
                where: { companyId, ...ownWhere },
                _sum: { amount: true },
            }),
            this.prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }),
            this.prisma.siteVisit.count({ where: { companyId, ...ownWhere } }),
            this.prisma.incentive.count({ where: { companyId, status: 'ACTIVE' } }),
            this.prisma.leaveRequest.count({
                where: { companyId, status: 'PENDING' },
            }),
            this.getAttendanceTrend(companyId),
            this.getDepartmentDistribution(companyId),
            this.prisma.property.groupBy({
                by: ['status'],
                where: { companyId },
                _count: { status: true },
            }),
        ]);
        const result = {
            period: { dateFrom, dateTo },
            leads: {
                total: leadCount,
                converted: convertedLeads,
                conversionRate: leadCount > 0 ? Math.round((convertedLeads / leadCount) * 100) : 0,
            },
            properties: {
                total: propertyCount,
                byStatus: propertiesByStatus.map((p) => ({
                    status: p.status,
                    count: p._count.status,
                })),
            },
            bookings: {
                total: bookingCount,
                revenue: Number(bookingRevenue._sum.amount ?? 0),
            },
            employees: { active: employeeCount },
            siteVisits: { total: siteVisitCount },
            incentives: { active: activeIncentives },
            pendingLeaves,
            attendanceTrend,
            departmentDistribution,
        };
        await this.redis.set(cacheKey, result, this.analyticsCacheTTL);
        return result;
    }
    async getPipelineFunnel(ownership, dto) {
        const { companyId } = ownership;
        const { dateFrom, dateTo } = dto.dateFrom
            ? { dateFrom: dto.dateFrom, dateTo: dto.dateTo }
            : this.periodDateRange(dto.period || 'month');
        const cacheKey = this.cacheKey('pipeline', companyId, ownership.userRole, ownership.employeeId, `${dateFrom}:${dateTo}`);
        const cached = await this.redis.get(cacheKey);
        if (cached)
            return cached;
        const ownWhere = this.ownershipWhere(ownership);
        const dateWhere = this.dateRangeWhere(dateFrom, dateTo);
        const [leadStatusCounts, siteVisitStatusCounts, bookingStatusCounts] = await Promise.all([
            this.prisma.lead.groupBy({
                by: ['status'],
                where: { companyId, ...ownWhere, ...dateWhere },
                _count: { id: true },
            }),
            this.prisma.siteVisit.groupBy({
                by: ['status'],
                where: { companyId, ...ownWhere, ...dateWhere },
                _count: { id: true },
            }),
            this.prisma.booking.groupBy({
                by: ['status'],
                where: { companyId, ...ownWhere, ...dateWhere },
                _count: { id: true },
            }),
        ]);
        const result = {
            leads: leadStatusCounts.map((s) => ({
                status: s.status,
                count: s._count.id,
            })),
            siteVisits: siteVisitStatusCounts.map((s) => ({
                status: s.status,
                count: s._count.id,
            })),
            bookings: bookingStatusCounts.map((s) => ({
                status: s.status,
                count: s._count.id,
            })),
        };
        await this.redis.set(cacheKey, result, this.analyticsCacheTTL);
        return result;
    }
    async getTrends(ownership, dto) {
        const { companyId } = ownership;
        const { dateFrom, dateTo } = dto.dateFrom
            ? { dateFrom: dto.dateFrom, dateTo: dto.dateTo }
            : this.periodDateRange(dto.period || 'month');
        const cacheKey = this.cacheKey('trends', companyId, ownership.userRole, ownership.employeeId, `${dateFrom}:${dateTo}`);
        const cached = await this.redis.get(cacheKey);
        if (cached)
            return cached;
        const ownWhere = this.ownershipWhere(ownership);
        const leadsByDay = await this.prisma.$queryRawUnsafe(`SELECT DATE("createdAt") as date, COUNT(*)::int as count
       FROM leads
       WHERE "companyId" = $1 AND "createdAt" >= $2 AND "createdAt" <= $3
       GROUP BY DATE("createdAt") ORDER BY date`, companyId, new Date(dateFrom), new Date(dateTo + 'T23:59:59.999Z'));
        const bookingsByDay = await this.prisma.$queryRawUnsafe(`SELECT DATE("createdAt") as date, COUNT(*)::int as count, COALESCE(SUM(amount), 0) as revenue
       FROM bookings
       WHERE "companyId" = $1 AND "createdAt" >= $2 AND "createdAt" <= $3
       GROUP BY DATE("createdAt") ORDER BY date`, companyId, new Date(dateFrom), new Date(dateTo + 'T23:59:59.999Z'));
        const result = {
            leadsByDay: leadsByDay.map((r) => ({
                date: r.date,
                count: Number(r.count),
            })),
            bookingsByDay: bookingsByDay.map((r) => ({
                date: r.date,
                count: Number(r.count),
                revenue: Number(r.revenue),
            })),
        };
        await this.redis.set(cacheKey, result, this.analyticsCacheTTL);
        return result;
    }
    async getLeaderboard(ownership) {
        const { companyId } = ownership;
        const ownWhere = ownership.userRole === 'OWNER' || ownership.userRole === 'ADMIN'
            ? {}
            : { assignedToEmployeeId: ownership.employeeId };
        const incentivesWon = await this.prisma.incentive.groupBy({
            by: ['winnerId'],
            where: { companyId, winnerId: { not: null }, status: 'CLOSED' },
            _count: { id: true },
            _sum: { value: true },
        });
        const commissions = await this.prisma.pipelineCommission.groupBy({
            by: ['employeeId'],
            where: { companyId, status: 'PAID' },
            _count: { id: true },
            _sum: { amount: true },
        });
        const [leadGroup, bookingGroup] = await Promise.all([
            this.prisma.lead.groupBy({
                by: ['assignedToEmployeeId'],
                where: { companyId },
                _count: { id: true },
            }),
            this.prisma.booking.groupBy({
                by: ['assignedToEmployeeId'],
                where: { companyId },
                _count: { id: true },
            }),
        ]);
        const leadCounts = leadGroup.filter((l) => !!l.assignedToEmployeeId);
        const bookingCounts = bookingGroup.filter((b) => !!b.assignedToEmployeeId);
        const winnerIds = [
            ...new Set([
                ...incentivesWon.map((i) => i.winnerId).filter(Boolean),
                ...commissions.map((c) => c.employeeId),
                ...leadCounts.map((l) => l.assignedToEmployeeId).filter(Boolean),
                ...bookingCounts.map((b) => b.assignedToEmployeeId).filter(Boolean),
            ]),
        ];
        if (winnerIds.length === 0)
            return [];
        const employees = await this.prisma.employee.findMany({
            where: { id: { in: winnerIds }, companyId },
            select: {
                id: true,
                employeeCode: true,
                users: { select: { firstName: true, lastName: true, email: true } },
            },
        });
        const empMap = new Map(employees.map((e) => [e.id, e]));
        const rows = winnerIds.map((id) => {
            const inc = incentivesWon.find((i) => i.winnerId === id);
            const com = commissions.find((c) => c.employeeId === id);
            const leads = leadCounts.find((l) => l.assignedToEmployeeId === id);
            const booking = bookingCounts.find((b) => b.assignedToEmployeeId === id);
            const incentivesScore = (inc?._count?.id ?? 0) * 10;
            const commissionTotal = Number(com?._sum?.amount ?? 0);
            const totalScore = incentivesScore + commissionTotal;
            const e = empMap.get(id);
            return {
                employeeId: id,
                name: e?.users ? `${e.users.firstName} ${e.users.lastName}` : 'Unknown',
                employeeCode: e?.employeeCode ?? '',
                incentivesWon: inc?._count?.id ?? 0,
                incentivesValue: Number(inc?._sum?.value ?? 0),
                commissionsPaid: com?._count?.id ?? 0,
                commissionTotal,
                leadsAssigned: leads?._count?.id ?? 0,
                bookingsHandled: booking?._count?.id ?? 0,
                totalScore,
            };
        });
        rows.sort((a, b) => b.totalScore - a.totalScore);
        return rows;
    }
    async getExports(companyId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.reportExport.findMany({
                where: { companyId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    reportKey: true,
                    title: true,
                    format: true,
                    status: true,
                    fileUrl: true,
                    fileSize: true,
                    errorMessage: true,
                    createdAt: true,
                    generatedAt: true,
                },
            }),
            this.prisma.reportExport.count({ where: { companyId } }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async createExport(dto, companyId, generatedById) {
        const report = this.reportCatalog.find((r) => r.key === dto.reportKey);
        if (!report)
            throw new common_1.BadRequestException(`Unknown report key: ${dto.reportKey}`);
        const format = dto.format;
        if (!format) {
            throw new common_1.BadRequestException('Export format is required');
        }
        try {
            const dataset = await this.generateDataset(dto.reportKey, companyId, dto);
            return await this.orchestration.createExport({
                companyId,
                userId: generatedById || '',
                userRole: '',
                reportKey: dto.reportKey,
                format,
                dataset,
            });
        }
        catch (error) {
            await this.prisma.reportExport
                .update({
                where: { id: 'exp-1' },
                data: {
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : 'Export failed',
                },
            })
                .catch(() => { });
            throw new common_1.BadRequestException(error instanceof Error ? error.message : 'Export failed');
        }
    }
    async generateDataset(reportKey, companyId, dto) {
        const dateFilter = dto.dateFrom || dto.dateTo
            ? this.dateRangeWhere(dto.dateFrom, dto.dateTo)
            : {};
        switch (reportKey) {
            case 'employees':
                return this.datasetEmployees(companyId);
            case 'attendance':
                return this.datasetAttendance(companyId, dateFilter);
            case 'leaves':
                return this.datasetLeaves(companyId, dateFilter);
            case 'payroll':
                return this.datasetPayroll(companyId, dateFilter);
            case 'properties':
                return this.datasetProperties(companyId);
            case 'leads':
                return this.datasetLeads(companyId, dateFilter);
            case 'bookings':
                return this.datasetBookings(companyId, dateFilter);
            case 'commissions':
                return this.datasetCommissions(companyId, dateFilter);
            case 'inventory':
                return this.datasetInventory(companyId);
            case 'labour':
                return this.datasetLabour(companyId, dateFilter);
            default:
                throw new common_1.BadRequestException(`Unknown report key: ${reportKey}`);
        }
    }
    async generateDatasetForSync(reportKey, companyId) {
        return this.generateDataset(reportKey, companyId, {});
    }
    async datasetEmployees(companyId) {
        const data = await this.prisma.employee.findMany({
            where: { companyId },
            include: {
                users: { select: { firstName: true, lastName: true, email: true } },
                departments: { select: { name: true } },
                designations: { select: { name: true } },
            },
        });
        return {
            title: 'Employee Report',
            headers: [
                'Employee Code',
                'First Name',
                'Last Name',
                'Email',
                'Department',
                'Designation',
                'Status',
                'Phone',
                'Date of Joining',
                'Salary',
            ],
            rows: data.map((e) => [
                e.employeeCode,
                e.users?.firstName || '',
                e.users?.lastName || '',
                e.users?.email || '',
                e.departments?.name || '',
                e.designations?.name || '',
                e.status,
                e.phone || '',
                e.dateOfJoining?.toISOString().slice(0, 10) || '',
                e.salary?.toString() || '',
            ]),
        };
    }
    async datasetAttendance(companyId, dateFilter) {
        const data = await this.prisma.attendanceDayAggregate.findMany({
            where: { companyId, ...dateFilter },
            include: {
                employees: {
                    include: { users: { select: { firstName: true, lastName: true } } },
                },
            },
        });
        return {
            title: 'Attendance Report',
            headers: [
                'Employee',
                'Date',
                'Total Work Min',
                'Total Break Min',
                'Check In',
                'Check Out',
                'Finalized',
            ],
            rows: data.map((a) => {
                const name = a.employees?.users
                    ? `${a.employees.users.firstName} ${a.employees.users.lastName}`
                    : '';
                return [
                    name,
                    a.date.toISOString().slice(0, 10),
                    a.totalWorkMinutes,
                    a.totalBreakMinutes,
                    a.firstPunchAt ? a.firstPunchAt.toISOString() : '',
                    a.lastPunchAt ? a.lastPunchAt.toISOString() : '',
                    a.status === 'COMPLETED' ? 'Yes' : 'No',
                ];
            }),
        };
    }
    async datasetLeaves(companyId, dateFilter) {
        const data = await this.prisma.leaveRequest.findMany({
            where: { companyId, ...dateFilter },
            include: {
                employeesLeaveRequestsEmployeeIdToemployees: {
                    include: { users: { select: { firstName: true, lastName: true } } },
                },
            },
        });
        return {
            title: 'Leave Report',
            headers: [
                'Employee',
                'Type',
                'Start Date',
                'End Date',
                'Status',
                'Reason',
            ],
            rows: data.map((l) => {
                const name = l.employeesLeaveRequestsEmployeeIdToemployees?.users
                    ? `${l.employeesLeaveRequestsEmployeeIdToemployees.users.firstName} ${l.employeesLeaveRequestsEmployeeIdToemployees.users.lastName}`
                    : '';
                return [
                    name,
                    l.type,
                    l.startDate.toISOString().slice(0, 10),
                    l.endDate.toISOString().slice(0, 10),
                    l.status,
                    l.reason || '',
                ];
            }),
        };
    }
    async datasetPayroll(companyId, dateFilter) {
        const data = await this.prisma.payrollRun.findMany({
            where: { companyId, ...dateFilter },
            orderBy: { createdAt: 'desc' },
        });
        return {
            title: 'Payroll Report',
            headers: [
                'Period Start',
                'Period End',
                'Status',
                'Total Earnings',
                'Total Deductions',
                'Total Net Pay',
                'Employee Count',
            ],
            rows: data.map((p) => [
                p.periodStart.toISOString().slice(0, 10),
                p.periodEnd.toISOString().slice(0, 10),
                p.status,
                p.totalEarnings?.toString() || '',
                p.totalDeductions?.toString() || '',
                p.totalNetPay?.toString() || '',
                p.employeeCount?.toString() || '',
            ]),
        };
    }
    async datasetProperties(companyId) {
        const data = await this.prisma.property.findMany({
            where: { companyId },
            include: {
                employees: {
                    include: { users: { select: { firstName: true, lastName: true } } },
                },
            },
        });
        return {
            title: 'Property Portfolio',
            headers: [
                'Title',
                'Type',
                'Status',
                'Price',
                'City',
                'Location',
                'Bedrooms',
                'Area',
                'Assigned To',
            ],
            rows: data.map((p) => {
                const name = p.employees?.users
                    ? `${p.employees.users.firstName} ${p.employees.users.lastName}`
                    : '';
                return [
                    p.title,
                    p.type,
                    p.status,
                    p.price.toString(),
                    p.city,
                    p.location,
                    p.bedrooms?.toString() || '',
                    p.area?.toString() || '',
                    name,
                ];
            }),
        };
    }
    async datasetLeads(companyId, dateFilter) {
        const data = await this.prisma.lead.findMany({
            where: { companyId, ...dateFilter },
            include: {
                employees: {
                    include: { users: { select: { firstName: true, lastName: true } } },
                },
            },
        });
        return {
            title: 'Lead Pipeline',
            headers: [
                'Customer Name',
                'Customer Email',
                'Customer Phone',
                'Source',
                'Status',
                'Assigned To',
                'Created At',
            ],
            rows: data.map((l) => {
                const name = l.employees?.users
                    ? `${l.employees.users.firstName} ${l.employees.users.lastName}`
                    : '';
                return [
                    l.customerName,
                    l.customerEmail || '',
                    l.customerPhone || '',
                    l.source,
                    l.status,
                    name,
                    l.createdAt.toISOString().slice(0, 10),
                ];
            }),
        };
    }
    async datasetBookings(companyId, dateFilter) {
        const data = await this.prisma.booking.findMany({
            where: { companyId, ...dateFilter },
            include: {
                customers: { select: { name: true } },
                properties: { select: { title: true } },
                employees: {
                    include: { users: { select: { firstName: true, lastName: true } } },
                },
            },
        });
        return {
            title: 'Booking Report',
            headers: [
                'Customer',
                'Property',
                'Amount',
                'Status',
                'Payment Status',
                'Booking Date',
                'Assigned To',
            ],
            rows: data.map((b) => {
                const name = b.employees?.users
                    ? `${b.employees.users.firstName} ${b.employees.users.lastName}`
                    : '';
                return [
                    b.customers?.name || '',
                    b.properties?.title || '',
                    b.amount.toString(),
                    b.status,
                    b.paymentStatus,
                    b.bookingDate.toISOString().slice(0, 10),
                    name,
                ];
            }),
        };
    }
    async datasetCommissions(companyId, dateFilter) {
        const data = await this.prisma.pipelineCommission.findMany({
            where: { companyId, ...dateFilter },
        });
        const employeeIds = [...new Set(data.map((c) => c.employeeId))];
        const employees = employeeIds.length > 0
            ? await this.prisma.employee.findMany({
                where: { id: { in: employeeIds }, companyId },
                select: {
                    id: true,
                    users: { select: { firstName: true, lastName: true } },
                },
            })
            : [];
        const empMap = new Map(employees.map((e) => [e.id, e]));
        return {
            title: 'Commission Report',
            headers: ['Employee', 'Amount', 'Status', 'Paid At', 'Created At'],
            rows: data.map((c) => {
                const emp = empMap.get(c.employeeId);
                const name = emp?.users
                    ? `${emp.users.firstName} ${emp.users.lastName}`
                    : '';
                return [
                    name,
                    c.amount.toString(),
                    c.status,
                    c.paidAt?.toISOString().slice(0, 10) || '',
                    c.createdAt.toISOString().slice(0, 10),
                ];
            }),
        };
    }
    async datasetInventory(companyId) {
        const data = await this.prisma.inventoryItem.findMany({
            where: { companyId },
            include: {
                materials: { select: { name: true, unit: true } },
                constructionSites: { select: { name: true } },
            },
        });
        return {
            title: 'Site Inventory',
            headers: ['Site', 'Material', 'Quantity on Hand', 'Unit'],
            rows: data.map((i) => [
                i.constructionSites?.name || '',
                i.materials?.name || '',
                i.quantityOnHand.toString(),
                i.materials?.unit || '',
            ]),
        };
    }
    async datasetLabour(companyId, dateFilter) {
        const data = await this.prisma.labourEntry.findMany({
            where: { companyId, ...dateFilter },
            include: { constructionSites: { select: { name: true } } },
        });
        return {
            title: 'Labour Report',
            headers: [
                'Site',
                'Labour Name',
                'Type',
                'Date',
                'Hours Worked',
                'Wages Amount',
            ],
            rows: data.map((l) => [
                l.constructionSites?.name || '',
                l.labourName,
                l.labourType,
                l.date.toISOString().slice(0, 10),
                l.hoursWorked?.toString() || '',
                l.wagesAmount.toString(),
            ]),
        };
    }
    async getAttendanceTrend(companyId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        const [records, leaves] = await Promise.all([
            this.prisma.attendanceDayAggregate.findMany({
                where: { companyId, date: { gte: thirtyDaysAgo } },
                select: { date: true, status: true, totalWorkMinutes: true },
                orderBy: { date: 'asc' },
            }),
            this.prisma.leaveRequest.findMany({
                where: {
                    companyId,
                    status: 'APPROVED',
                    endDate: { gte: thirtyDaysAgo },
                },
                select: { startDate: true, endDate: true },
            }),
        ]);
        const dayMap = new Map();
        for (let i = 0; i < 30; i++) {
            const d = new Date(thirtyDaysAgo);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            dayMap.set(key, { present: 0, absent: 0, onLeave: 0 });
        }
        for (const r of records) {
            const key = r.date.toISOString().slice(0, 10);
            const entry = dayMap.get(key);
            if (!entry)
                continue;
            if (r.totalWorkMinutes > 0)
                entry.present++;
            else if (r.totalWorkMinutes === 0)
                entry.absent++;
        }
        for (const leave of leaves) {
            const cursor = new Date(Math.max(leave.startDate.getTime(), thirtyDaysAgo.getTime()));
            cursor.setHours(0, 0, 0, 0);
            const end = new Date(leave.endDate);
            end.setHours(0, 0, 0, 0);
            while (cursor <= end) {
                const entry = dayMap.get(cursor.toISOString().slice(0, 10));
                if (entry)
                    entry.onLeave++;
                cursor.setDate(cursor.getDate() + 1);
            }
        }
        return Array.from(dayMap.entries()).map(([date, counts]) => ({
            date,
            ...counts,
        }));
    }
    async getDepartmentDistribution(companyId) {
        const groups = await this.prisma.employee.groupBy({
            by: ['departmentId'],
            where: { companyId },
            _count: { id: true },
        });
        const deptIds = groups.map((g) => g.departmentId);
        const departments = await this.prisma.department.findMany({
            where: { id: { in: deptIds }, companyId },
            select: { id: true, name: true },
        });
        const deptMap = new Map(departments.map((d) => [d.id, d.name]));
        return groups.map((g) => ({
            name: deptMap.get(g.departmentId) ?? 'Unknown',
            value: g._count.id,
        }));
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        export_orchestration_service_1.ExportOrchestrationService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map