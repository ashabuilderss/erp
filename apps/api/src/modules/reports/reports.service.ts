import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';
import { CreateReportExportDto, QueryAnalyticsDto } from './dto';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';

interface OwnershipFilter {
  userRole: string;
  employeeId: string | null;
  companyId: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly analyticsCacheTTL = 120; // 2 min for live KPIs
  private readonly reportCacheTTL = 600; // 10 min for reports

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private ownershipWhere(ownership: OwnershipFilter): Record<string, any> {
    if (ownership.userRole === 'OWNER' || ownership.userRole === 'ADMIN') return {};
    if (ownership.employeeId) return { assignedToEmployeeId: ownership.employeeId };
    return {};
  }

  private dateRangeWhere(dateFrom?: string, dateTo?: string): Record<string, any> {
    const where: Record<string, any> = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }
    return where;
  }

  private periodDateRange(period: string): { dateFrom: string; dateTo: string } {
    const now = new Date();
    const dateTo = now.toISOString().slice(0, 10);
    let dateFrom: string;
    switch (period) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        dateFrom = weekAgo.toISOString().slice(0, 10);
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        dateFrom = monthAgo.toISOString().slice(0, 10);
        break;
      case 'quarter':
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        dateFrom = quarterAgo.toISOString().slice(0, 10);
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        dateFrom = yearAgo.toISOString().slice(0, 10);
        break;
      default:
        const defaultAgo = new Date(now.getTime() - 30 * 86400000);
        dateFrom = defaultAgo.toISOString().slice(0, 10);
    }
    return { dateFrom, dateTo };
  }

  private cacheKey(prefix: string, companyId: string, role: string, employeeId: string | null, query: string): string {
    const hash = crypto.createHash('md5').update(query).digest('hex').slice(0, 8);
    return `analytics:${prefix}:${companyId}:${role}:${employeeId || 'all'}:${hash}`;
  }

  // ─── Catalog ───────────────────────────────────────────────────────────

  readonly reportCatalog = [
    { key: 'employees', title: 'Employee Directory', description: 'List of all employees with department, designation, and status', entities: ['employees', 'departments', 'designations'] },
    { key: 'attendance', title: 'Attendance Summary', description: 'Attendance records with status breakdown by date range', entities: ['attendance', 'employees'] },
    { key: 'leaves', title: 'Leave Requests', description: 'All leave requests with type, status, and approval info', entities: ['leave_requests', 'leave_allocations', 'employees'] },
    { key: 'payroll', title: 'Payroll Summary', description: 'Payroll runs with total earnings, deductions, and net pay', entities: ['payroll_runs', 'payslips'] },
    { key: 'properties', title: 'Property Portfolio', description: 'All properties with status, type, pricing, and assignment', entities: ['properties', 'employees'] },
    { key: 'leads', title: 'Lead Pipeline', description: 'Lead tracking with status, source, and conversion data', entities: ['leads', 'properties', 'employees'] },
    { key: 'bookings', title: 'Booking Report', description: 'Booking details with customer, property, and payment status', entities: ['bookings', 'customers', 'properties'] },
    { key: 'commissions', title: 'Commission Report', description: 'Pipeline commissions with status and payout tracking', entities: ['pipeline_commissions', 'employees'] },
    { key: 'inventory', title: 'Site Inventory', description: 'Material inventory by construction site', entities: ['inventory_items', 'materials', 'construction_sites'] },
    { key: 'labour', title: 'Labour Report', description: 'Labour entries by site with type and wage details', entities: ['labour_entries', 'construction_sites'] },
  ];

  async getCatalog() {
    return { items: this.reportCatalog };
  }

  // ─── KPI Dashboard ─────────────────────────────────────────────────────

  async getKPIDashboard(ownership: OwnershipFilter, dto: QueryAnalyticsDto) {
    const { companyId } = ownership;
    const { dateFrom, dateTo } = dto.dateFrom ? { dateFrom: dto.dateFrom, dateTo: dto.dateTo } : this.periodDateRange(dto.period || 'month');

    const cacheKey = this.cacheKey('kpi', companyId, ownership.userRole, ownership.employeeId, `${dateFrom}:${dateTo}`);
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const ownWhere = this.ownershipWhere(ownership);
    const dateWhere = this.dateRangeWhere(dateFrom, dateTo);

    const [leadCount, convertedLeads, propertyCount, bookingCount, bookingRevenue, employeeCount, siteVisitCount, activeIncentives, pendingLeaves, attendanceTrend, departmentDistribution, propertiesByStatus] = await Promise.all([
      this.prisma.lead.count({ where: { companyId, ...ownWhere } }),
      this.prisma.lead.count({ where: { companyId, ...ownWhere, status: 'CONVERTED' } }),
      this.prisma.property.count({ where: { companyId } }),
      this.prisma.booking.count({ where: { companyId, ...ownWhere } }),
      this.prisma.booking.aggregate({ where: { companyId, ...ownWhere }, _sum: { amount: true } }),
      this.prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }),
      this.prisma.siteVisit.count({ where: { companyId, ...ownWhere } }),
      this.prisma.incentive.count({ where: { companyId, status: 'ACTIVE' } }),
      this.prisma.leaveRequest.count({ where: { companyId, status: 'PENDING' } }),
      this.getAttendanceTrend(companyId),
      this.getDepartmentDistribution(companyId),
      this.prisma.property.groupBy({ by: ['status'], where: { companyId }, _count: { status: true } }),
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
        byStatus: propertiesByStatus.map((p) => ({ status: p.status, count: p._count.status })),
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

  // ─── Pipeline Funnel ───────────────────────────────────────────────────

  async getPipelineFunnel(ownership: OwnershipFilter, dto: QueryAnalyticsDto) {
    const { companyId } = ownership;
    const { dateFrom, dateTo } = dto.dateFrom ? { dateFrom: dto.dateFrom, dateTo: dto.dateTo } : this.periodDateRange(dto.period || 'month');

    const cacheKey = this.cacheKey('pipeline', companyId, ownership.userRole, ownership.employeeId, `${dateFrom}:${dateTo}`);
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const ownWhere = this.ownershipWhere(ownership);
    const dateWhere = this.dateRangeWhere(dateFrom, dateTo);

    const [leadStatusCounts, siteVisitStatusCounts, bookingStatusCounts] = await Promise.all([
      this.prisma.lead.groupBy({ by: ['status'], where: { companyId, ...ownWhere, ...dateWhere }, _count: { id: true } }),
      this.prisma.siteVisit.groupBy({ by: ['status'], where: { companyId, ...ownWhere, ...dateWhere }, _count: { id: true } }),
      this.prisma.booking.groupBy({ by: ['status'], where: { companyId, ...ownWhere, ...dateWhere }, _count: { id: true } }),
    ]);

    const result = {
      leads: leadStatusCounts.map((s) => ({ status: s.status, count: s._count.id })),
      siteVisits: siteVisitStatusCounts.map((s) => ({ status: s.status, count: s._count.id })),
      bookings: bookingStatusCounts.map((s) => ({ status: s.status, count: s._count.id })),
    };

    await this.redis.set(cacheKey, result, this.analyticsCacheTTL);
    return result;
  }

  // ─── Trends ────────────────────────────────────────────────────────────

  async getTrends(ownership: OwnershipFilter, dto: QueryAnalyticsDto) {
    const { companyId } = ownership;
    const { dateFrom, dateTo } = dto.dateFrom ? { dateFrom: dto.dateFrom, dateTo: dto.dateTo } : this.periodDateRange(dto.period || 'month');

    const cacheKey = this.cacheKey('trends', companyId, ownership.userRole, ownership.employeeId, `${dateFrom}:${dateTo}`);
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const ownWhere = this.ownershipWhere(ownership);

    const leadsByDay = await this.prisma.$queryRawUnsafe<Array<{ date: string; count: bigint }>>(
      `SELECT DATE("createdAt") as date, COUNT(*)::int as count
       FROM leads
       WHERE "companyId" = $1 AND "createdAt" >= $2 AND "createdAt" <= $3
       GROUP BY DATE("createdAt") ORDER BY date`,
      companyId, new Date(dateFrom), new Date(dateTo + 'T23:59:59.999Z'),
    );

    const bookingsByDay = await this.prisma.$queryRawUnsafe<Array<{ date: string; count: bigint; revenue: string }>>(
      `SELECT DATE("createdAt") as date, COUNT(*)::int as count, COALESCE(SUM(amount), 0) as revenue
       FROM bookings
       WHERE "companyId" = $1 AND "createdAt" >= $2 AND "createdAt" <= $3
       GROUP BY DATE("createdAt") ORDER BY date`,
      companyId, new Date(dateFrom), new Date(dateTo + 'T23:59:59.999Z'),
    );

    const result = {
      leadsByDay: leadsByDay.map((r) => ({ date: r.date, count: Number(r.count) })),
      bookingsByDay: bookingsByDay.map((r) => ({ date: r.date, count: Number(r.count), revenue: Number(r.revenue) })),
    };

    await this.redis.set(cacheKey, result, this.analyticsCacheTTL);
    return result;
  }

  // ─── Leaderboard (fixed duplicate issue) ─────────────────────────────

  async getLeaderboard(ownership: OwnershipFilter) {
    const { companyId } = ownership;

    const ownWhere = ownership.userRole === 'OWNER' || ownership.userRole === 'ADMIN'
      ? {} : { assignedToEmployeeId: ownership.employeeId };

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

    const leadCounts = leadGroup.filter((l): l is (typeof l & { assignedToEmployeeId: string }) => !!l.assignedToEmployeeId);
    const bookingCounts = bookingGroup.filter((b): b is (typeof b & { assignedToEmployeeId: string }) => !!b.assignedToEmployeeId);

    const winnerIds = [...new Set([
      ...incentivesWon.map((i) => i.winnerId).filter(Boolean),
      ...commissions.map((c) => c.employeeId),
      ...leadCounts.map((l) => l.assignedToEmployeeId).filter(Boolean),
      ...bookingCounts.map((b) => b.assignedToEmployeeId).filter(Boolean),
    ])] as string[];

    if (winnerIds.length === 0) return [];

    const employees = await this.prisma.employee.findMany({
      where: { id: { in: winnerIds }, companyId },
      select: {
        id: true, employeeCode: true,
        user: { select: { firstName: true, lastName: true, email: true } },
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
      const emp = empMap.get(id);
      return {
        employeeId: id,
        employeeName: emp?.user ? `${emp.user.firstName} ${emp.user.lastName}` : 'Unknown',
        employeeCode: emp?.employeeCode ?? '',
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

  // ─── Report Exports (real) ─────────────────────────────────────────────

  async getExports(companyId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.reportExport.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true, reportKey: true, title: true, format: true,
          status: true, fileUrl: true, fileSize: true, errorMessage: true,
          createdAt: true, generatedAt: true,
        },
      }),
      this.prisma.reportExport.count({ where: { companyId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createExport(dto: CreateReportExportDto, companyId: string, generatedById: string | null) {
    const report = this.reportCatalog.find((r) => r.key === dto.reportKey);
    if (!report) throw new BadRequestException(`Unknown report key: ${dto.reportKey}`);

    const exportRec = await this.prisma.reportExport.create({
      data: {
        companyId,
        reportKey: dto.reportKey,
        title: report.title,
        format: dto.format || 'CSV',
        status: 'PROCESSING',
        filters: dto.filters || {},
        generatedById,
      },
    });

    try {
      const csvData = await this.generateReportData(dto.reportKey, companyId, dto);
      const fileUrl = `reports/${companyId}/${exportRec.id}.csv`;

      await this.prisma.reportExport.update({
        where: { id: exportRec.id },
        data: {
          status: 'COMPLETED',
          fileUrl,
          fileSize: Buffer.byteLength(csvData, 'utf-8'),
          generatedAt: new Date(),
        },
      });

      const csvBase64 = Buffer.from(csvData, 'utf-8').toString('base64');

      return {
        id: exportRec.id,
        title: report.title,
        status: 'COMPLETED',
        fileUrl,
        csvData: csvBase64,
        summary: `Generated ${dto.format} export for ${report.title} with ${csvData.split('\n').length - 1} rows`,
        createdAt: exportRec.createdAt,
      };
    } catch (err: any) {
      await this.prisma.reportExport.update({
        where: { id: exportRec.id },
        data: { status: 'FAILED', errorMessage: err.message, failedAt: new Date() },
      });
      throw new BadRequestException(`Export failed: ${err.message}`);
    }
  }

  private async generateReportData(reportKey: string, companyId: string, dto: CreateReportExportDto): Promise<string> {
    const dateFilter = dto.dateFrom || dto.dateTo
      ? this.dateRangeWhere(dto.dateFrom, dto.dateTo)
      : {};

    switch (reportKey) {
      case 'employees':
        return this.exportEmployees(companyId);
      case 'attendance':
        return this.exportAttendance(companyId, dateFilter);
      case 'leaves':
        return this.exportLeaves(companyId, dateFilter);
      case 'payroll':
        return this.exportPayroll(companyId, dateFilter);
      case 'properties':
        return this.exportProperties(companyId);
      case 'leads':
        return this.exportLeads(companyId, dateFilter);
      case 'bookings':
        return this.exportBookings(companyId, dateFilter);
      case 'commissions':
        return this.exportCommissions(companyId, dateFilter);
      case 'inventory':
        return this.exportInventory(companyId);
      case 'labour':
        return this.exportLabour(companyId, dateFilter);
      default:
        throw new BadRequestException(`Unknown report key: ${reportKey}`);
    }
  }

  private escapeCsv(val: any): string {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private rowsToCsv(headers: string[], rows: any[][]): string {
    const headerLine = headers.join(',');
    const dataLines = rows.map((row) => row.map((v) => this.escapeCsv(v)).join(','));
    return [headerLine, ...dataLines].join('\n');
  }

  private async exportEmployees(companyId: string): Promise<string> {
    const data = await this.prisma.employee.findMany({
      where: { companyId },
      include: { user: { select: { firstName: true, lastName: true, email: true } }, department: { select: { name: true } }, designation: { select: { name: true } } },
    });
    const headers = ['Employee Code', 'First Name', 'Last Name', 'Email', 'Department', 'Designation', 'Status', 'Phone', 'Date of Joining', 'Salary'];
    const rows = data.map((e) => [e.employeeCode, e.user?.firstName || '', e.user?.lastName || '', e.user?.email || '', e.department?.name || '', e.designation?.name || '', e.status, e.phone || '', e.dateOfJoining?.toISOString().slice(0, 10) || '', e.salary?.toString() || '']);
    return this.rowsToCsv(headers, rows);
  }

  private async exportAttendance(companyId: string, dateFilter: Record<string, any>): Promise<string> {
    const data = await this.prisma.attendance.findMany({
      where: { companyId, ...dateFilter },
      include: { employee: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    const headers = ['Employee', 'Date', 'Check In', 'Check Out', 'Status', 'Verified'];
    const rows = data.map((a) => {
      const name = a.employee?.user ? `${a.employee.user.firstName} ${a.employee.user.lastName}` : '';
      return [name, a.date.toISOString().slice(0, 10), a.checkIn?.toISOString() || '', a.checkOut?.toISOString() || '', a.status, a.verified ? 'Yes' : 'No'];
    });
    return this.rowsToCsv(headers, rows);
  }

  private async exportLeaves(companyId: string, dateFilter: Record<string, any>): Promise<string> {
    const data = await this.prisma.leaveRequest.findMany({
      where: { companyId, ...dateFilter },
      include: { employee: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    const headers = ['Employee', 'Type', 'Start Date', 'End Date', 'Status', 'Reason'];
    const rows = data.map((l) => {
      const name = l.employee?.user ? `${l.employee.user.firstName} ${l.employee.user.lastName}` : '';
      return [name, l.type, l.startDate.toISOString().slice(0, 10), l.endDate.toISOString().slice(0, 10), l.status, l.reason || ''];
    });
    return this.rowsToCsv(headers, rows);
  }

  private async exportPayroll(companyId: string, dateFilter: Record<string, any>): Promise<string> {
    const data = await this.prisma.payrollRun.findMany({
      where: { companyId, ...dateFilter },
      orderBy: { createdAt: 'desc' },
    });
    const headers = ['Period Start', 'Period End', 'Status', 'Total Earnings', 'Total Deductions', 'Total Net Pay', 'Employee Count'];
    const rows = data.map((p) => [p.periodStart.toISOString().slice(0, 10), p.periodEnd.toISOString().slice(0, 10), p.status, p.totalEarnings?.toString() || '', p.totalDeductions?.toString() || '', p.totalNetPay?.toString() || '', p.employeeCount?.toString() || '']);
    return this.rowsToCsv(headers, rows);
  }

  private async exportProperties(companyId: string): Promise<string> {
    const data = await this.prisma.property.findMany({
      where: { companyId },
      include: { assignedTo: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    const headers = ['Title', 'Type', 'Status', 'Price', 'City', 'Location', 'Bedrooms', 'Area', 'Assigned To'];
    const rows = data.map((p) => {
      const name = p.assignedTo?.user ? `${p.assignedTo.user.firstName} ${p.assignedTo.user.lastName}` : '';
      return [p.title, p.type, p.status, p.price.toString(), p.city, p.location, p.bedrooms?.toString() || '', p.area?.toString() || '', name];
    });
    return this.rowsToCsv(headers, rows);
  }

  private async exportLeads(companyId: string, dateFilter: Record<string, any>): Promise<string> {
    const data = await this.prisma.lead.findMany({
      where: { companyId, ...dateFilter },
      include: { assignedTo: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    const headers = ['Customer Name', 'Customer Email', 'Customer Phone', 'Source', 'Status', 'Assigned To', 'Created At'];
    const rows = data.map((l) => {
      const name = l.assignedTo?.user ? `${l.assignedTo.user.firstName} ${l.assignedTo.user.lastName}` : '';
      return [l.customerName, l.customerEmail || '', l.customerPhone || '', l.source, l.status, name, l.createdAt.toISOString().slice(0, 10)];
    });
    return this.rowsToCsv(headers, rows);
  }

  private async exportBookings(companyId: string, dateFilter: Record<string, any>): Promise<string> {
    const data = await this.prisma.booking.findMany({
      where: { companyId, ...dateFilter },
      include: { customer: { select: { name: true } }, property: { select: { title: true } }, assignedTo: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    const headers = ['Customer', 'Property', 'Amount', 'Status', 'Payment Status', 'Booking Date', 'Assigned To'];
    const rows = data.map((b) => {
      const name = b.assignedTo?.user ? `${b.assignedTo.user.firstName} ${b.assignedTo.user.lastName}` : '';
      return [b.customer?.name || '', b.property?.title || '', b.amount.toString(), b.status, b.paymentStatus, b.bookingDate.toISOString().slice(0, 10), name];
    });
    return this.rowsToCsv(headers, rows);
  }

  private async exportCommissions(companyId: string, dateFilter: Record<string, any>): Promise<string> {
    const data = await this.prisma.pipelineCommission.findMany({
      where: { companyId, ...dateFilter },
    });
    const employeeIds = [...new Set(data.map((c) => c.employeeId))];
    const employees = employeeIds.length > 0
      ? await this.prisma.employee.findMany({
          where: { id: { in: employeeIds }, companyId },
          select: { id: true, user: { select: { firstName: true, lastName: true } } },
        })
      : [];
    const empMap = new Map(employees.map((e) => [e.id, e]));
    const headers = ['Employee', 'Amount', 'Status', 'Paid At', 'Created At'];
    const rows = data.map((c) => {
      const emp = empMap.get(c.employeeId);
      const name = emp?.user ? `${emp.user.firstName} ${emp.user.lastName}` : '';
      return [name, c.amount.toString(), c.status, c.paidAt?.toISOString().slice(0, 10) || '', c.createdAt.toISOString().slice(0, 10)];
    });
    return this.rowsToCsv(headers, rows);
  }

  private async exportInventory(companyId: string): Promise<string> {
    const data = await this.prisma.inventoryItem.findMany({
      where: { companyId },
      include: { material: { select: { name: true, unit: true } }, site: { select: { name: true } } },
    });
    const headers = ['Site', 'Material', 'Quantity on Hand', 'Unit'];
    const rows = data.map((i) => [i.site?.name || '', i.material?.name || '', i.quantityOnHand.toString(), i.material?.unit || '']);
    return this.rowsToCsv(headers, rows);
  }

  private async exportLabour(companyId: string, dateFilter: Record<string, any>): Promise<string> {
    const data = await this.prisma.labourEntry.findMany({
      where: { companyId, ...dateFilter },
      include: { site: { select: { name: true } } },
    });
    const headers = ['Site', 'Labour Name', 'Type', 'Date', 'Hours Worked', 'Wages Amount'];
    const rows = data.map((l) => [l.site?.name || '', l.labourName, l.labourType, l.date.toISOString().slice(0, 10), l.hoursWorked?.toString() || '', l.wagesAmount.toString()]);
    return this.rowsToCsv(headers, rows);
  }

  private async getAttendanceTrend(companyId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [records, leaves] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { companyId, date: { gte: thirtyDaysAgo } },
        select: { date: true, status: true },
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

    const dayMap = new Map<string, { present: number; absent: number; onLeave: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { present: 0, absent: 0, onLeave: 0 });
    }

    for (const r of records) {
      const key = r.date.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (!entry) continue;
      if (r.status === 'PRESENT') entry.present++;
      else if (r.status === 'ABSENT') entry.absent++;
    }

    for (const leave of leaves) {
      const cursor = new Date(Math.max(leave.startDate.getTime(), thirtyDaysAgo.getTime()));
      cursor.setHours(0, 0, 0, 0);
      const end = new Date(leave.endDate);
      end.setHours(0, 0, 0, 0);
      while (cursor <= end) {
        const entry = dayMap.get(cursor.toISOString().slice(0, 10));
        if (entry) entry.onLeave++;
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return Array.from(dayMap.entries()).map(([date, counts]) => ({ date, ...counts }));
  }

  private async getDepartmentDistribution(companyId: string) {
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
}
