import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { Prisma, PayrollRunStatus } from '@prisma/client';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { QueryPayrollRunDto } from './dto/query-payroll-run.dto';
import { GovernanceEventPublisher } from '../../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../../governance-events/types/events';
import { EmployeesService } from '../employees/employees.service';
import { TransitionService } from '../../../common/services/transition.service';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: GovernanceEventPublisher,
    private readonly employeesService: EmployeesService,
    private readonly transitionService: TransitionService,
  ) {}

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
        employees: {
          include: { users: { select: { firstName: true, lastName: true } } },
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
        employees: {
          include: { users: { select: { firstName: true, lastName: true } } },
        },
        payslips: {
          include: {
            employees: {
              include: {
                users: { select: { firstName: true, lastName: true } },
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
    const components = (settings.payrollComponents as Record<
      string,
      boolean
    >) ?? { pf: true, tds: true };

    const periodStart = new Date(run.periodStart);
    const periodEnd = new Date(run.periodEnd);
    const calendarDays =
      Math.floor(
        (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    const activeEmployees = await this.employeesService.findActiveForPayroll(companyId);

    if (activeEmployees.length === 0) {
      throw new BadRequestException(
        'No active employees found to process payroll',
      );
    }

    const activeHolds = await this.prisma.payrollHold.findMany({
      where: {
        companyId,
        status: { in: ['REQUESTED', 'UNDER_REVIEW', 'ACTIVE_HOLD'] },
      },
      select: { employeeId: true },
    });
    const heldEmployeeIds = new Set(activeHolds.map((h) => h.employeeId));
    const eligibleEmployees = activeEmployees.filter(
      (e) => !heldEmployeeIds.has(e.id),
    );

    if (heldEmployeeIds.size > 0) {
      const heldDetails = await this.prisma.payrollHold.findMany({
        where: {
          companyId,
          employeeId: { in: [...heldEmployeeIds] },
          status: { in: ['REQUESTED', 'UNDER_REVIEW', 'ACTIVE_HOLD'] },
        },
        include: {
          employeesPayrollHoldsEmployeeIdToemployees: {
            select: { id: true, employeeCode: true },
          },
        },
      });

      const ownerUsers = await this.prisma.user.findMany({
        where: { companyId, role: 'OWNER' },
        select: { id: true },
      });
      const hrUsers = await this.prisma.user.findMany({
        where: { companyId, role: 'HR_MANAGER' },
        select: { id: true },
      });
      const notifyUserIds = [...new Set([...ownerUsers.map((u) => u.id), ...hrUsers.map((u) => u.id)])];

      for (const hold of heldDetails) {
        const empName = hold.employeesPayrollHoldsEmployeeIdToemployees?.employeeCode ?? hold.employeeId;
        for (const userId of notifyUserIds) {
          await this.prisma.notification.create({
            data: {
              userId,
              companyId,
              title: 'Payroll Hold - Employee Excluded',
              message: `Employee ${empName} (${hold.employeeId}) is excluded from payroll run due to active hold (${hold.holdType}). Reason: ${hold.reason || 'Not specified'}.`,
              type: 'PAYROLL_HOLD_NOTIFICATION',
              link: `/payroll/holds/${hold.id}`,
            },
          });
        }
      }
    }

    if (eligibleEmployees.length === 0) {
      throw new BadRequestException(
        'All active employees are under payroll hold. Release holds before processing.',
      );
    }

    const attendanceSnapshots =
      await this.prisma.payrollAttendanceSnapshot.findMany({
        where: {
          employeeId: { in: eligibleEmployees.map((e) => e.id) },
          companyId,
          attendancePeriods: {
            startDate: { gte: periodStart },
            endDate: { lte: periodEnd },
          },
        },
        select: { employeeId: true, snapshotData: true },
      });
    const snapshotMap = new Map(
      attendanceSnapshots.map((snapshot) => [snapshot.employeeId, snapshot]),
    );

    const employeeIds = eligibleEmployees.map((e) => e.id);
    const approvedCommissions = await this.prisma.pipelineCommission.findMany({
      where: {
        companyId,
        employeeId: { in: employeeIds },
        status: 'APPROVED',
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      select: { employeeId: true, amount: true },
    });
    const commissionByEmployee = new Map<string, number>();
    for (const c of approvedCommissions) {
      commissionByEmployee.set(
        c.employeeId,
        (commissionByEmployee.get(c.employeeId) ?? 0) + Number(c.amount),
      );
    }

    const approvedIncentives = await this.prisma.incentive.findMany({
      where: {
        companyId,
        winnerId: { in: employeeIds },
        status: 'CLOSED',
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      select: { winnerId: true, value: true, title: true },
    });
    const incentiveByEmployee = new Map<string, number>();
    for (const inc of approvedIncentives) {
      if (inc.winnerId && inc.value) {
        incentiveByEmployee.set(
          inc.winnerId,
          (incentiveByEmployee.get(inc.winnerId) ?? 0) + Number(inc.value),
        );
      }
    }

    const payslipData = eligibleEmployees.map((emp) => {
      const monthlySalary = emp.salary ? Number(emp.salary) : 0;
      const dailyRate = monthlySalary / 30;

      const snapshot = snapshotMap.get(emp.id);
      const snapshotData =
        (snapshot?.snapshotData as Record<string, unknown>) ?? {};
      const effectivePresentDays = Math.min(
        calendarDays,
        Number(snapshotData.paidDays ?? 0),
      );
      const grossPay = Math.round(dailyRate * effectivePresentDays * 100) / 100;

      const earnings: { name: string; amount: number }[] = [
        {
          name: 'Basic (30-day rate)',
          amount: Math.round(dailyRate * effectivePresentDays * 100) / 100,
        },
      ];

      const commissionIncentive = commissionByEmployee.get(emp.id) ?? 0;
      if (commissionIncentive > 0) {
        earnings.push({
          name: 'Commission Incentive',
          amount: Math.round(commissionIncentive * 100) / 100,
        });
      }

      const performanceIncentive = incentiveByEmployee.get(emp.id) ?? 0;
      if (performanceIncentive > 0) {
        earnings.push({
          name: 'Performance Incentive',
          amount: Math.round(performanceIncentive * 100) / 100,
        });
      }

      const totalGross = earnings.reduce((s, e) => s + e.amount, 0);

      const deductions: { name: string; amount: number }[] = [];
      let totalDed = 0;

      if (components.pf) {
        const pf = Math.round(Math.min(monthlySalary * 0.12, 1800) * 100) / 100;
        deductions.push({ name: 'PF', amount: pf });
        totalDed += pf;
      }
      if (components.tds) {
        const tax = Math.round(totalGross * 0.05 * 100) / 100;
        deductions.push({ name: 'TDS', amount: tax });
        totalDed += tax;
      }

      const netPay = Math.round((totalGross - totalDed) * 100) / 100;

      return {
        employeeId: emp.id,
        companyId,
        basicSalary: monthlySalary,
        earnings,
        deductions,
        grossPay: totalGross,
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

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.PAYROLL_PROCESSED,
        entityId: id,
        entityType: 'PayrollRun',
        companyId,
        payload: {
          companyId,
          payrollRunId: id,
          processedById,
          employeeCount: payslipData.length,
          totalNetPay: Math.round(totalNetPay * 100) / 100,
          heldEmployeeCount: heldEmployeeIds.size,
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

    this.transitionService.validate('PayrollRun', run.status, 'PAID');

    if (!run.processedById) {
      throw new BadRequestException(
        'Payroll run has no processing record. Process the run before marking paid.',
      );
    }

    const payslips = await this.prisma.payslip.findMany({
      where: { payrollRunId: id },
      select: { id: true, employeeId: true },
    });

    const employeeIds = payslips.map((p) => p.employeeId);
    const heldEmployeeIds = new Set<string>();
    if (employeeIds.length > 0) {
      const activeHolds = await this.prisma.payrollHold.findMany({
        where: {
          companyId,
          employeeId: { in: employeeIds },
          status: { in: ['REQUESTED', 'UNDER_REVIEW', 'ACTIVE_HOLD'] },
        },
        select: { employeeId: true, reason: true },
      });
      for (const hold of activeHolds) {
        heldEmployeeIds.add(hold.employeeId);
      }
    }

    const clearPayslipIds = payslips
      .filter((p) => !heldEmployeeIds.has(p.employeeId))
      .map((p) => p.id);

    await this.prisma.$transaction(async (tx) => {
      if (clearPayslipIds.length > 0) {
        await tx.payslip.updateMany({
          where: { id: { in: clearPayslipIds } },
          data: { status: 'PAID', paidAt: new Date() },
        });
      }
      await tx.payrollRun.update({
        where: { id },
        data: { status: PayrollRunStatus.PAID },
      });
    });

    if (heldEmployeeIds.size > 0) {
      this.logger.warn(
        `Payroll run ${id} marked PAID, but ${heldEmployeeIds.size} employee(s) skipped due to active holds`,
      );
    }

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

    this.transitionService.validate('PayrollRun', run.status, 'CANCELLED');

    await this.prisma.$transaction(async (tx) => {
      await tx.payslip.deleteMany({ where: { payrollRunId: id } });
      await tx.payrollRun.update({
        where: { id },
        data: { status: PayrollRunStatus.CANCELLED },
      });
    });

    return this.findOneRun(id, companyId);
  }

  async findMyPayslips(employeeId: string, companyId: string) {
    return this.prisma.payslip.findMany({
      where: { employeeId, companyId },
      include: {
        payrollRuns: {
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
        employees: {
          include: { users: { select: { firstName: true, lastName: true } } },
        },
        payrollRuns: {
          select: { periodStart: true, periodEnd: true, status: true },
        },
      },
    });
    if (!payslip) throw new NotFoundException('Payslip not found');
    return payslip;
  }
}
