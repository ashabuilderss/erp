import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { DayAggregateStatus, Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(companyId: string) {
    const [
      totalProperties,
      propertiesByStatus,
      totalLeads,
      leadsByStatus,
      totalCustomers,
      totalSiteVisits,
      siteVisitsByStatus,
      totalBookings,
      bookingsByStatus,
      totalEmployees,
      activeEmployees,
      totalAssignments,
      assignmentsByType,
      avgPerformanceScore,
      topPerformers,
      attendanceRate,
      pendingLeaves,
      attendanceTrend,
      departmentDistribution,
    ] = await Promise.all([
      this.prisma.property.count({ where: { companyId } }),
      this.prisma.property.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { status: true },
      }),
      this.prisma.lead.count({ where: { companyId } }),
      this.prisma.lead.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { status: true },
      }),
      this.prisma.customer.count({ where: { companyId } }),
      this.prisma.siteVisit.count({ where: { companyId } }),
      this.prisma.siteVisit.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { status: true },
      }),
      this.prisma.booking.count({ where: { companyId } }),
      this.prisma.booking.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { status: true },
      }),
      this.prisma.employee.count({ where: { companyId } }),
      this.prisma.employee.count({ where: { status: 'ACTIVE', companyId } }),
      this.prisma.employeeAssignment.count({ where: { companyId } }),
      this.prisma.employeeAssignment.groupBy({
        by: ['type'],
        where: { companyId },
        _count: { type: true },
      }),
      this.prisma.performance.aggregate({
        where: { companyId },
        _avg: { score: true },
      }),
      this.prisma.performance.findMany({
        where: { companyId },
        take: 5,
        orderBy: { score: 'desc' },
        include: { employees: { include: { users: true } } },
      }),
      this.getAttendanceRate(companyId),
      this.prisma.leaveRequest.count({
        where: { status: 'PENDING', companyId },
      }),
      this.getAttendanceTrend(companyId),
      this.getDepartmentDistribution(companyId),
    ]);

    return {
      crm: {
        totalProperties,
        propertiesByStatus: propertiesByStatus.map((p) => ({
          status: p.status,
          count: p._count.status,
        })),
        totalLeads,
        leadsByStatus: leadsByStatus.map((l) => ({
          status: l.status,
          count: l._count.status,
        })),
        totalCustomers,
        totalSiteVisits,
        siteVisitsByStatus: siteVisitsByStatus.map((s) => ({
          status: s.status,
          count: s._count.status,
        })),
        totalBookings,
        bookingsByStatus: bookingsByStatus.map((b) => ({
          status: b.status,
          count: b._count.status,
        })),
      },
      hrms: {
        totalEmployees,
        activeEmployees,
        attendanceRate,
        pendingLeaves,
        attendanceTrend,
        departmentDistribution,
      },
      ems: {
        totalAssignments,
        assignmentsByType: assignmentsByType.map((a) => ({
          type: a.type,
          count: a._count.type,
        })),
        avgPerformanceScore: Math.round(avgPerformanceScore._avg.score ?? 0),
        topPerformers,
      },
    };
  }

  async getEmployeeAnalytics(employeeId: string, companyId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { users: true, departments: true, designations: true },
    });
    if (!employee) throw new Error('Employee not found');

    const [
      assignments,
      performance,
      attendance,
      leaves,
      propertiesAssigned,
      leadsAssigned,
      siteVisitsCompleted,
      bookingsClosed,
    ] = await Promise.all([
      this.prisma.employeeAssignment.findMany({ where: { employeeId } }),
      this.prisma.performance.findMany({
        where: { employeeId },
        orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
      }),
      this.prisma.attendanceDayAggregate.findMany({
        where: { employeeId },
        orderBy: { date: 'desc' },
      }),
      this.prisma.leaveRequest.findMany({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.property.count({
        where: { assignedToEmployeeId: employeeId },
      }),
      this.prisma.lead.count({ where: { assignedToEmployeeId: employeeId } }),
      this.prisma.siteVisit.count({
        where: { assignedToEmployeeId: employeeId, status: 'COMPLETED' },
      }),
      this.prisma.booking.count({
        where: { assignedToEmployeeId: employeeId, status: 'CONFIRMED' },
      }),
    ]);

    const totalDays = attendance.length;
    const presentDays = attendance.filter(
      (a) =>
        a.status === DayAggregateStatus.COMPLETED ||
        a.status === DayAggregateStatus.VERIFIED,
    ).length;
    const attendanceRate =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    const conversionRate =
      leadsAssigned > 0
        ? Math.round((bookingsClosed / leadsAssigned) * 100)
        : 0;

    return {
      employee,
      assignments,
      performance,
      attendance: { totalDays, presentDays, attendanceRate },
      leaves,
      metrics: {
        propertiesAssigned,
        leadsAssigned,
        siteVisitsCompleted,
        bookingsClosed,
        attendanceRate,
        conversionRate,
      },
    };
  }

  async getTeamAnalytics(companyId: string, departmentId?: string) {
    const where: Prisma.EmployeeWhereInput = { status: 'ACTIVE', companyId };
    if (departmentId) where.departmentId = departmentId;

    const employees = await this.prisma.employee.findMany({
      where,
      include: { users: true, departments: true },
    });

    const employeeIds = employees.map((e) => e.id);

    const [assignments, performance, attendance, leaves] = await Promise.all([
      this.prisma.employeeAssignment.findMany({
        where: { employeeId: { in: employeeIds } },
      }),
      this.prisma.performance.findMany({
        where: { employeeId: { in: employeeIds } },
      }),
      this.prisma.attendanceDayAggregate.findMany({
        where: { employeeId: { in: employeeIds } },
      }),
      this.prisma.leaveRequest.findMany({
        where: { employeeId: { in: employeeIds }, status: 'PENDING' },
      }),
    ]);

    const totalEmployees = employees.length;
    const totalAssignments = assignments.length;
    const avgScore =
      performance.length > 0
        ? Math.round(
            performance.reduce((sum, p) => sum + p.score, 0) /
              performance.length,
          )
        : 0;

    const attendanceRate = this.calculateAttendanceRate(attendance);

    return {
      totalEmployees,
      totalAssignments,
      avgPerformanceScore: avgScore,
      attendanceRate,
      pendingLeaves: leaves.length,
      employees: employees.map((e) => ({
        id: e.id,
        name: e.users
          ? `${e.users.firstName} ${e.users.lastName}`
          : 'Unlinked User',
        departments: e.departments?.name,
        assignments: assignments.filter((a) => a.employeeId === e.id).length,
        avgScore: this.getEmployeeAvgScore(performance, e.id),
      })),
    };
  }

  async getConversionFunnel(companyId: string) {
    const [totalLeads, siteVisits, bookings] = await Promise.all([
      this.prisma.lead.count({ where: { companyId } }),
      this.prisma.siteVisit.count({ where: { companyId } }),
      this.prisma.booking.count({ where: { companyId } }),
    ]);

    const convertedLeads = await this.prisma.lead.count({
      where: { status: 'CONVERTED', companyId },
    });

    return {
      leads: totalLeads,
      siteVisits,
      bookings,
      convertedLeads,
      leadToVisitRate:
        totalLeads > 0 ? Math.round((siteVisits / totalLeads) * 100) : 0,
      visitToBookingRate:
        siteVisits > 0 ? Math.round((bookings / siteVisits) * 100) : 0,
      leadToBookingRate:
        totalLeads > 0 ? Math.round((bookings / totalLeads) * 100) : 0,
    };
  }

  private async getAttendanceRate(companyId: string) {
    const [total, present] = await Promise.all([
      this.prisma.attendanceDayAggregate.count({ where: { companyId } }),
      this.prisma.attendanceDayAggregate.count({
        where: {
          status: { in: [DayAggregateStatus.COMPLETED, DayAggregateStatus.VERIFIED] },
          companyId,
        },
      }),
    ]);
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }

  private calculateAttendanceRate(attendance: { status: string }[]) {
    const total = attendance.length;
    const present = attendance.filter((a) => a.status === 'PRESENT').length;
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }

  private getEmployeeAvgScore(
    performance: { employeeId: string; score: number }[],
    employeeId: string,
  ) {
    const empPerf = performance.filter((p) => p.employeeId === employeeId);
    return empPerf.length > 0
      ? Math.round(
          empPerf.reduce((sum, p) => sum + p.score, 0) / empPerf.length,
        )
      : 0;
  }

  async getBookingsByEmployee(companyId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' },
      include: { users: true },
    });

    const employeeIds = employees.map((e) => e.id);
    const bookings = await this.prisma.booking.groupBy({
      by: ['assignedToEmployeeId', 'status'],
      where: { companyId, assignedToEmployeeId: { in: employeeIds } },
      _count: { id: true },
    });

    return employees
      .map((e) => {
        const empBookings = bookings.filter(
          (b) => b.assignedToEmployeeId === e.id,
        );
        const total = empBookings.reduce((sum, b) => sum + b._count.id, 0);
        const closed = empBookings
          .filter((b) => b.status === 'CONFIRMED')
          .reduce((sum, b) => sum + b._count.id, 0);
        return {
          name: e.users
            ? `${e.users.firstName} ${e.users.lastName}`
            : 'Unlinked',
          bookings: total,
          closed,
        };
      })
      .filter((e) => e.bookings > 0)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10);
  }

  async getSiteVisitsByEmployee(companyId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' },
      include: { users: true },
    });

    const employeeIds = employees.map((e) => e.id);
    const siteVisits = await this.prisma.siteVisit.groupBy({
      by: ['assignedToEmployeeId', 'status'],
      where: { companyId, assignedToEmployeeId: { in: employeeIds } },
      _count: { id: true },
    });

    return employees
      .map((e) => {
        const empVisits = siteVisits.filter(
          (sv) => sv.assignedToEmployeeId === e.id,
        );
        const scheduled = empVisits
          .filter((sv) => sv.status === 'SCHEDULED')
          .reduce((sum, sv) => sum + sv._count.id, 0);
        const completed = empVisits
          .filter((sv) => sv.status === 'COMPLETED')
          .reduce((sum, sv) => sum + sv._count.id, 0);
        return {
          name: e.users
            ? `${e.users.firstName} ${e.users.lastName}`
            : 'Unlinked',
          scheduled,
          completed,
        };
      })
      .filter((e) => e.scheduled > 0 || e.completed > 0)
      .sort((a, b) => b.scheduled + b.completed - (a.scheduled + a.completed))
      .slice(0, 10);
  }

  private async getAttendanceTrend(companyId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [records, leaves] = await Promise.all([
      this.prisma.attendanceDayAggregate.findMany({
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

    const dayMap = new Map<
      string,
      { present: number; absent: number; onLeave: number }
    >();
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
      if (
        r.status === DayAggregateStatus.COMPLETED ||
        r.status === DayAggregateStatus.VERIFIED
      )
        entry.present++;
      else if (r.status === DayAggregateStatus.UNDER_REVIEW) entry.absent++;
    }

    for (const leave of leaves) {
      const cursor = new Date(
        Math.max(leave.startDate.getTime(), thirtyDaysAgo.getTime()),
      );
      cursor.setHours(0, 0, 0, 0);
      const end = new Date(leave.endDate);
      end.setHours(0, 0, 0, 0);
      while (cursor <= end) {
        const entry = dayMap.get(cursor.toISOString().slice(0, 10));
        if (entry) entry.onLeave++;
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return Array.from(dayMap.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }));
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
