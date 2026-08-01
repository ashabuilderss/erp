import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  const mockPrisma = () => ({
    employee: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    employeeAssignment: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    performance: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    attendanceDayAggregate: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    leaveRequest: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    property: { count: jest.fn() },
    lead: { count: jest.fn() },
    siteVisit: { count: jest.fn() },
    booking: { count: jest.fn() },
    customer: { count: jest.fn() },
    department: { findMany: jest.fn() },
  });

  describe('getEmployeeAnalytics', () => {
    it('throws Error when employee not found', async () => {
      const prisma = mockPrisma();
      prisma.employee.findFirst.mockResolvedValue(null);
      const service = new AnalyticsService(prisma as never);

      await expect(service.getEmployeeAnalytics('emp-1', 'c1')).rejects.toThrow(
        'Employee not found',
      );
    });

    it('returns employee analytics with computed metrics', async () => {
      const prisma = mockPrisma();
      prisma.employee.findFirst.mockResolvedValue({ id: 'emp-1', user: {} });
      prisma.employeeAssignment.findMany.mockResolvedValue([{ id: 'a1' }]);
      prisma.performance.findMany.mockResolvedValue([
        { score: 80 },
        { score: 90 },
      ]);
      prisma.attendanceDayAggregate.findMany.mockResolvedValue([
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'UNDER_REVIEW' },
      ]);
      prisma.leaveRequest.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(3);
      prisma.lead.count.mockResolvedValue(10);
      prisma.siteVisit.count.mockResolvedValue(5);
      prisma.booking.count.mockResolvedValue(2);
      const service = new AnalyticsService(prisma as never);

      const result = await service.getEmployeeAnalytics('emp-1', 'c1');

      expect(result).toHaveProperty('employee');
      expect(result).toHaveProperty('assignments');
      expect(result).toHaveProperty('performance');
      expect(result.attendance).toEqual({
        totalDays: 3,
        presentDays: 2,
        attendanceRate: 67,
      });
      expect(result.metrics.propertiesAssigned).toBe(3);
      expect(result.metrics.leadsAssigned).toBe(10);
      expect(result.metrics.siteVisitsCompleted).toBe(5);
      expect(result.metrics.bookingsClosed).toBe(2);
      expect(result.metrics.attendanceRate).toBe(67);
      expect(result.metrics.conversionRate).toBe(20);
    });

    it('correctly calculates attendanceRate as 0 when no attendance', async () => {
      const prisma = mockPrisma();
      prisma.employee.findFirst.mockResolvedValue({ id: 'emp-1', user: {} });
      prisma.employeeAssignment.findMany.mockResolvedValue([]);
      prisma.performance.findMany.mockResolvedValue([]);
      prisma.attendanceDayAggregate.findMany.mockResolvedValue([]);
      prisma.leaveRequest.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(0);
      prisma.lead.count.mockResolvedValue(0);
      prisma.siteVisit.count.mockResolvedValue(0);
      prisma.booking.count.mockResolvedValue(0);
      const service = new AnalyticsService(prisma as never);

      const result = await service.getEmployeeAnalytics('emp-1', 'c1');

      expect(result.attendance).toEqual({
        totalDays: 0,
        presentDays: 0,
        attendanceRate: 0,
      });
    });

    it('correctly calculates conversionRate as 0 when no leads', async () => {
      const prisma = mockPrisma();
      prisma.employee.findFirst.mockResolvedValue({ id: 'emp-1', user: {} });
      prisma.employeeAssignment.findMany.mockResolvedValue([]);
      prisma.performance.findMany.mockResolvedValue([]);
      prisma.attendanceDayAggregate.findMany.mockResolvedValue([]);
      prisma.leaveRequest.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(0);
      prisma.lead.count.mockResolvedValue(0);
      prisma.siteVisit.count.mockResolvedValue(0);
      prisma.booking.count.mockResolvedValue(0);
      const service = new AnalyticsService(prisma as never);

      const result = await service.getEmployeeAnalytics('emp-1', 'c1');

      expect(result.metrics.conversionRate).toBe(0);
    });
  });

  describe('getTeamAnalytics', () => {
    it('returns team analytics summary', async () => {
      const prisma = mockPrisma();
      prisma.employee.findMany.mockResolvedValue([
        {
          id: 'e1',
          user: { firstName: 'John', lastName: 'Doe' },
          department: { name: 'Sales' },
        },
        {
          id: 'e2',
          user: { firstName: 'Jane', lastName: 'Smith' },
          department: { name: 'Sales' },
        },
      ]);
      prisma.employeeAssignment.findMany.mockResolvedValue([
        { id: 'a1', employeeId: 'e1' },
        { id: 'a2', employeeId: 'e2' },
      ]);
      prisma.performance.findMany.mockResolvedValue([
        { employeeId: 'e1', score: 80 },
        { employeeId: 'e2', score: 90 },
      ]);
      prisma.attendanceDayAggregate.findMany.mockResolvedValue([
        { status: 'PRESENT' },
        { status: 'PRESENT' },
        { status: 'ABSENT' },
      ]);
      prisma.leaveRequest.findMany.mockResolvedValue([]);
      const service = new AnalyticsService(prisma as never);

      const result = await service.getTeamAnalytics('c1');

      expect(result.totalEmployees).toBe(2);
      expect(result.totalAssignments).toBe(2);
      expect(result.avgPerformanceScore).toBe(85);
      expect(result).toHaveProperty('attendanceRate');
      expect(result.pendingLeaves).toBe(0);
      expect(result.employees).toHaveLength(2);
    });

    it('filters employees by department when departmentId provided', async () => {
      const prisma = mockPrisma();
      prisma.employee.findMany.mockResolvedValue([
        {
          id: 'e1',
          user: { firstName: 'John', lastName: 'Doe' },
          department: { name: 'Sales' },
        },
      ]);
      prisma.employeeAssignment.findMany.mockResolvedValue([]);
      prisma.performance.findMany.mockResolvedValue([]);
      prisma.attendanceDayAggregate.findMany.mockResolvedValue([]);
      prisma.leaveRequest.findMany.mockResolvedValue([]);
      const service = new AnalyticsService(prisma as never);

      await service.getTeamAnalytics('c1', 'dept-1');

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ departmentId: 'dept-1' }),
        }),
      );
    });
  });

  describe('getConversionFunnel', () => {
    it('returns conversion funnel with rates', async () => {
      const prisma = mockPrisma();
      prisma.lead.count.mockResolvedValueOnce(100).mockResolvedValueOnce(20);
      prisma.siteVisit.count.mockResolvedValue(50);
      prisma.booking.count.mockResolvedValue(20);
      const service = new AnalyticsService(prisma as never);

      const result = await service.getConversionFunnel('c1');

      expect(result.leads).toBe(100);
      expect(result.siteVisits).toBe(50);
      expect(result.bookings).toBe(20);
      expect(result.convertedLeads).toBe(20);
      expect(result.leadToVisitRate).toBe(50);
      expect(result.visitToBookingRate).toBe(40);
      expect(result.leadToBookingRate).toBe(20);
    });

    it('returns 0 rates when leads is 0', async () => {
      const prisma = mockPrisma();
      prisma.lead.count.mockResolvedValue(0);
      prisma.siteVisit.count.mockResolvedValue(0);
      prisma.booking.count.mockResolvedValue(0);
      const service = new AnalyticsService(prisma as never);

      const result = await service.getConversionFunnel('c1');

      expect(result.leadToVisitRate).toBe(0);
      expect(result.visitToBookingRate).toBe(0);
      expect(result.leadToBookingRate).toBe(0);
    });
  });
});
