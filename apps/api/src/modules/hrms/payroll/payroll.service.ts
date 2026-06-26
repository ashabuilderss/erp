import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { Prisma, PayrollRunStatus } from '@prisma/client';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { QueryPayrollRunDto } from './dto/query-payroll-run.dto';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async createRun(dto: CreatePayrollRunDto, companyId: string) {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    const existing = await this.prisma.payrollRun.findUnique({
      where: {
        companyId_periodStart_periodEnd: { companyId, periodStart, periodEnd },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Payroll run for this period already exists',
      );
    }

    return this.prisma.payrollRun.create({
      data: { companyId, periodStart, periodEnd, notes: dto.notes },
    });
  }

  async findAllRuns(query: QueryPayrollRunDto, companyId: string) {
    const where: Prisma.PayrollRunWhereInput = { companyId };
    if (query.status) where.status = query.status;

    const total = await this.prisma.payrollRun.count({ where });
    const data = await this.prisma.payrollRun.findMany({
      where,
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
      take: query.limit ?? 10,
      orderBy: { periodStart: 'desc' },
      include: {
        processedBy: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        _count: { select: { payslips: true } },
      },
    });
    return {
      data,
      meta: {
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        totalPages: Math.ceil(total / (query.limit ?? 10)),
      },
    };
  }

  async findOneRun(id: string, companyId: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, companyId },
      include: {
        processedBy: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        payslips: {
          include: {
            employee: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  async processRun(id: string, processedById: string, companyId: string) {
    const run = await this.findOneRun(id, companyId);
    if (run.status !== PayrollRunStatus.DRAFT) {
      throw new BadRequestException(
        'Payroll run must be in DRAFT status to process',
      );
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { settings: true },
    });
    const settings = (company?.settings as Record<string, unknown>) ?? {};
    const weeklyOffDays = (settings.weeklyOffDays as string[]) ?? ['SUNDAY'];
    const components = (settings.payrollComponents as Record<string, boolean>) ?? { pf: true, tds: true };

    const periodStart = new Date(run.periodStart);
    const periodEnd = new Date(run.periodEnd);
    const calendarDays =
      Math.floor(
        (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    const weeklyOffDates = new Set<string>();
    for (let i = 0; i < calendarDays; i++) {
      const d = new Date(periodStart);
      d.setDate(d.getDate() + i);
      const dayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][d.getDay()];
      if (weeklyOffDays.includes(dayName)) {
        weeklyOffDates.add(d.toISOString().slice(0, 10));
      }
    }

    const activeEmployees = await this.prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: { id: true, salary: true, dateOfJoining: true },
    });

    if (activeEmployees.length === 0) {
      throw new BadRequestException(
        'No active employees found to process payroll',
      );
    }

    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        employeeId: { in: activeEmployees.map((e) => e.id) },
        date: { gte: periodStart, lte: periodEnd },
        companyId,
      },
      select: { employeeId: true, date: true, status: true },
    });
    const approvedLeaves = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId: { in: activeEmployees.map((e) => e.id) },
        companyId,
        status: 'APPROVED',
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      select: { employeeId: true, startDate: true, endDate: true },
    });


    const attendanceMap = new Map<string, Set<string>>();
    const halfDayMap = new Map<string, Set<string>>();
    for (const rec of attendanceRecords) {
      if (!attendanceMap.has(rec.employeeId)) {
        attendanceMap.set(rec.employeeId, new Set());
        halfDayMap.set(rec.employeeId, new Set());
      }
      if (rec.status === 'PRESENT') {
        attendanceMap.get(rec.employeeId)!.add(rec.date.toISOString().slice(0, 10));
      } else if (rec.status === 'HALF_DAY') {
        halfDayMap.get(rec.employeeId)!.add(rec.date.toISOString().slice(0, 10));
      }
    }

    const leaveDateMap = new Map<string, Set<string>>();
    for (const leave of approvedLeaves) {
      const dates = leaveDateMap.get(leave.employeeId) ?? new Set<string>();
      const start = new Date(Math.max(leave.startDate.getTime(), periodStart.getTime()));
      const end = new Date(Math.min(leave.endDate.getTime(), periodEnd.getTime()));
      for (
        const date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        dates.add(date.toISOString().slice(0, 10));
      }
      leaveDateMap.set(leave.employeeId, dates);
    }

    const payslipData = activeEmployees.map((emp) => {
      const monthlySalary = emp.salary ? Number(emp.salary) : 0;
      const dailyRate = monthlySalary / 30;

      const presentDates = attendanceMap.get(emp.id);
      const halfDayDates = halfDayMap.get(emp.id);
      const presentDays = presentDates?.size ?? 0;
      const halfDays = halfDayDates?.size ?? 0;

      const leaveDates = leaveDateMap.get(emp.id) ?? new Set<string>();
      const paidWeeklyOffDays = [...weeklyOffDates].filter(
        (date) => !presentDates?.has(date) && !halfDayDates?.has(date),
      ).length;
      const paidLeaveDays = [...leaveDates].filter(
        (date) =>
          !presentDates?.has(date) &&
          !halfDayDates?.has(date) &&
          !weeklyOffDates.has(date),
      ).length;
      const effectivePresentDays = Math.min(
        calendarDays,
        presentDays + halfDays * 0.5 + paidWeeklyOffDays + paidLeaveDays,
      );
      const grossPay = Math.round(dailyRate * effectivePresentDays * 100) / 100;

      const earnings: { name: string; amount: number }[] = [
        { name: 'Basic (30-day rate)', amount: Math.round(dailyRate * effectivePresentDays * 100) / 100 },
      ];

      const deductions: { name: string; amount: number }[] = [];
      let totalDed = 0;

      if (components.pf) {
        const pf = Math.round(Math.min(monthlySalary * 0.12, 1800) * 100) / 100;
        deductions.push({ name: 'PF', amount: pf });
        totalDed += pf;
      }
      if (components.tds) {
        const tax = Math.round(grossPay * 0.05 * 100) / 100;
        deductions.push({ name: 'TDS', amount: tax });
        totalDed += tax;
      }

      const netPay = Math.round((grossPay - totalDed) * 100) / 100;

      return {
        employeeId: emp.id,
        companyId,
        basicSalary: monthlySalary,
        earnings,
        deductions,
        grossPay,
        totalDeductions: totalDed,
        netPay,
        status: 'DRAFT' as const,
      };
    });

    const totalEarnings = payslipData.reduce((s, p) => s + p.grossPay, 0);
    const totalDeductions = payslipData.reduce(
      (s, p) => s + p.totalDeductions,
      0,
    );
    const totalNetPay = payslipData.reduce((s, p) => s + p.netPay, 0);

    await this.prisma.$transaction(async (tx) => {
      await tx.payrollRun.update({
        where: { id },
        data: {
          status: PayrollRunStatus.PROCESSING,
          processedById,
          processedAt: new Date(),
        },
      });

      for (const ps of payslipData) {
        await tx.payslip.create({ data: { ...ps, payrollRunId: id } });
      }

      await tx.payrollRun.update({
        where: { id },
        data: {
          status: PayrollRunStatus.COMPLETED,
          totalEarnings: Math.round(totalEarnings * 100) / 100,
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          totalNetPay: Math.round(totalNetPay * 100) / 100,
          employeeCount: payslipData.length,
        },
      });
    });

    return this.findOneRun(id, companyId);
  }

  async markPaid(id: string, companyId: string) {
    const run = await this.findOneRun(id, companyId);
    if (run.status !== PayrollRunStatus.COMPLETED) {
      throw new BadRequestException(
        'Payroll run must be COMPLETED before marking paid',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payslip.updateMany({
        where: { payrollRunId: id },
        data: { status: 'PAID', paidAt: new Date() },
      });
      await tx.payrollRun.update({
        where: { id },
        data: { status: PayrollRunStatus.PAID },
      });
    });

    return this.findOneRun(id, companyId);
  }

  async cancelRun(id: string, companyId: string) {
    const run = await this.findOneRun(id, companyId);
    if (
      run.status === PayrollRunStatus.PAID ||
      run.status === PayrollRunStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cannot cancel a PAID or already CANCELLED run',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payslip.deleteMany({ where: { payrollRunId: id } });
      await tx.payrollRun.update({
        where: { id },
        data: { status: PayrollRunStatus.CANCELLED },
      });
    });

    return this.findOneRun(id, companyId);
  }

  async findMyPayslips(employeeId: string) {
    return this.prisma.payslip.findMany({
      where: { employeeId },
      include: {
        payrollRun: {
          select: { periodStart: true, periodEnd: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOnePayslip(id: string, companyId: string) {
    const payslip = await this.prisma.payslip.findFirst({
      where: { id, companyId },
      include: {
        employee: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        payrollRun: {
          select: { periodStart: true, periodEnd: true, status: true },
        },
      },
    });
    if (!payslip) throw new NotFoundException('Payslip not found');
    return payslip;
  }
}
