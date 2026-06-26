"use client";

import { useMemo, lazy, Suspense } from "react";
import { Building2, Users, MapPin, FileText, UserCircle, CalendarCheck, CalendarRange, Activity, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/api";
import { useAnalyticsDashboard, useConversionFunnel, useBookingsByEmployee, useSiteVisitsByEmployee } from "@/hooks/api/useAnalytics";
import { useTodayAttendance } from "@/hooks/api/useAttendance";
import { KPICard } from "./kpi-card";
import { DashboardClock } from "./dashboard-clock";
import { Last7DaysAttendance } from "./last7days-attendance";
import { DashboardSkeleton, ChartSkeleton } from "@/components/ui/skeleton-variants";
import Link from "next/link";

const PropertyStatusChart = lazy(() => import("@/components/charts/PropertyStatusChart").then(m => ({ default: m.PropertyStatusChart })));
const LeadFunnelChart = lazy(() => import("@/components/charts/LeadFunnelChart").then(m => ({ default: m.LeadFunnelChart })));
const AttendanceTrendChart = lazy(() => import("@/components/charts/AttendanceTrendChart").then(m => ({ default: m.AttendanceTrendChart })));
const DepartmentPieChart = lazy(() => import("@/components/charts/DepartmentPieChart").then(m => ({ default: m.DepartmentPieChart })));
const BookingsByEmployeeChart = lazy(() => import("@/components/charts/BookingsByEmployeeChart").then(m => ({ default: m.BookingsByEmployeeChart })));
const SiteVisitsByEmployeeChart = lazy(() => import("@/components/charts/SiteVisitsByEmployeeChart").then(m => ({ default: m.SiteVisitsByEmployeeChart })));

export function AdminDashboard() {
  const { data: analytics, isLoading } = useAnalyticsDashboard();
  const { data: todayAttendance, isLoading: attLoading } = useTodayAttendance();
  const { data: funnelData } = useConversionFunnel();
  const { data: bookingsByEmployee } = useBookingsByEmployee();
  const { data: siteVisitsByEmployee } = useSiteVisitsByEmployee();
  const { data: currentUser } = useCurrentUser();
  const name = currentUser?.user?.firstName ?? "Admin";
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const totalProperties = analytics?.properties?.total ?? 0;
  const totalLeads = analytics?.leads?.total ?? 0;
  const newLeads = funnelData?.leads?.find(l => l.status === "NEW")?.count ?? 0;
  const totalSiteVisits = analytics?.siteVisits?.total ?? 0;
  const scheduledVisits = funnelData?.siteVisits?.find(v => v.status === "SCHEDULED")?.count ?? 0;
  const totalBookings = analytics?.bookings?.total ?? 0;
  const pendingBookings = funnelData?.bookings?.find(b => b.status === "PENDING")?.count ?? 0;
  const totalEmployees = analytics?.employees?.active ?? 0;
  const presentToday = todayAttendance?.present ?? 0;
  const absentToday = todayAttendance?.absent ?? 0;
  const onLeaveToday = todayAttendance?.onLeave ?? 0;
  const pendingLeaves = analytics?.pendingLeaves ?? 0;

  const propertyStatusData = useMemo(() => {
    const byStatus = analytics?.properties?.byStatus ?? [];
    const colors: Record<string, string> = {
      AVAILABLE: "#22c55e",
      RESERVED: "#f59e0b",
      BOOKED: "#3b82f6",
      SOLD: "#8b5cf6",
    };
    if (byStatus.length === 0) return [{ name: "Total Properties", value: totalProperties, fill: "#3b82f6" }];
    return byStatus.map((s) => ({
      name: s.status.charAt(0) + s.status.slice(1).toLowerCase(),
      value: s.count,
      fill: colors[s.status] ?? "#6b7280",
    }));
  }, [analytics?.properties?.byStatus, totalProperties]);

  const leadFunnelData = useMemo(() => [
    { stage: "New", count: newLeads },
    { stage: "Contacted", count: funnelData?.leads?.find(l => l.status === "CONTACTED")?.count ?? 0 },
    { stage: "Interested", count: funnelData?.leads?.find(l => l.status === "INTERESTED")?.count ?? 0 },
    { stage: "Site Visit", count: scheduledVisits },
    { stage: "Negotiation", count: funnelData?.leads?.find(l => l.status === "NEGOTIATION")?.count ?? 0 },
    { stage: "Converted", count: analytics?.leads?.converted ?? 0 },
    { stage: "Lost", count: funnelData?.leads?.find(l => l.status === "LOST")?.count ?? 0 },
  ], [newLeads, scheduledVisits, funnelData, analytics?.leads?.converted]);

  const attendanceTrendData = analytics?.attendanceTrend ?? [];
  const departmentDistData = analytics?.departmentDistribution ?? [];
  const bookingsByEmpData = bookingsByEmployee ?? [];
  const siteVisitsByEmpData = siteVisitsByEmployee ?? [];

  if (isLoading || attLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{timeOfDay}, {name}</h2>
        <p className="text-sm text-muted-foreground">Real-time overview of your business</p>
        <div className="mt-2"><DashboardClock /></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <KPICard label="Total Properties" value={totalProperties} sub="All properties" icon={<Building2 className="h-5 w-5 text-white" />} color="bg-blue-500" />
        <KPICard label="Total Leads" value={totalLeads} sub={`${newLeads} new`} icon={<Users className="h-5 w-5 text-white" />} color="bg-green-500" />
        <KPICard label="Site Visits" value={totalSiteVisits} sub={`${scheduledVisits} scheduled`} icon={<MapPin className="h-5 w-5 text-white" />} color="bg-orange-500" />
        <KPICard label="Total Bookings" value={totalBookings} sub={`${pendingBookings} pending`} icon={<FileText className="h-5 w-5 text-white" />} color="bg-purple-500" />
        <KPICard label="Total Employees" value={totalEmployees} sub={`${presentToday} present today`} icon={<UserCircle className="h-5 w-5 text-white" />} color="bg-indigo-500" />
        <KPICard label="Present Today" value={presentToday} sub={`${absentToday} absent, ${onLeaveToday} on leave`} icon={<CalendarCheck className="h-5 w-5 text-white" />} color="bg-emerald-500" />
        <KPICard label="Absent Today" value={absentToday} sub={`${onLeaveToday} on leave`} icon={<CalendarRange className="h-5 w-5 text-white" />} color="bg-red-500" />
        <KPICard label="Pending Leaves" value={pendingLeaves} sub="Requires approval" icon={<Activity className="h-5 w-5 text-white" />} color="bg-yellow-500" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<ChartSkeleton />}><PropertyStatusChart data={propertyStatusData} /></Suspense>
        <Suspense fallback={<ChartSkeleton />}><LeadFunnelChart data={leadFunnelData} /></Suspense>
        {attendanceTrendData.length > 0 && (
          <Suspense fallback={<ChartSkeleton />}><AttendanceTrendChart data={attendanceTrendData} /></Suspense>
        )}
        {departmentDistData.length > 0 && (
          <Suspense fallback={<ChartSkeleton />}><DepartmentPieChart data={departmentDistData} /></Suspense>
        )}
        {bookingsByEmpData.length > 0 && (
          <Suspense fallback={<ChartSkeleton />}><BookingsByEmployeeChart data={bookingsByEmpData} /></Suspense>
        )}
        {siteVisitsByEmpData.length > 0 && (
          <Suspense fallback={<ChartSkeleton />}><SiteVisitsByEmployeeChart data={siteVisitsByEmpData} /></Suspense>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <Link href="/dashboard/employees" className="block"><Card className="cursor-pointer hover:bg-muted/50 transition-colors"><CardContent className="flex flex-col items-center justify-center py-4 gap-2"><UserCircle className="h-6 w-6 text-blue-500" /><span className="text-sm font-medium">Create Employee</span></CardContent></Card></Link>
          <Link href="/dashboard/properties" className="block"><Card className="cursor-pointer hover:bg-muted/50 transition-colors"><CardContent className="flex flex-col items-center justify-center py-4 gap-2"><Building2 className="h-6 w-6 text-green-500" /><span className="text-sm font-medium">Add Property</span></CardContent></Card></Link>
          <Link href="/dashboard/attendance" className="block"><Card className="cursor-pointer hover:bg-muted/50 transition-colors"><CardContent className="flex flex-col items-center justify-center py-4 gap-2"><CalendarCheck className="h-6 w-6 text-orange-500" /><span className="text-sm font-medium">View Attendance</span></CardContent></Card></Link>
          <Link href="/dashboard/leave-requests" className="block"><Card className="cursor-pointer hover:bg-muted/50 transition-colors"><CardContent className="flex flex-col items-center justify-center py-4 gap-2"><CalendarRange className="h-6 w-6 text-purple-500" /><span className="text-sm font-medium">Pending Leaves</span></CardContent></Card></Link>
          <Link href="/dashboard/users" className="block"><Card className="cursor-pointer hover:bg-muted/50 transition-colors"><CardContent className="flex flex-col items-center justify-center py-4 gap-2"><Shield className="h-6 w-6 text-red-500" /><span className="text-sm font-medium">Manage Users</span></CardContent></Card></Link>
        </div>
      </div>

      <Last7DaysAttendance />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-4">Pending Leave Requests</h3>
            <p className="text-center text-muted-foreground py-4">
              {pendingLeaves > 0 ? `${pendingLeaves} pending approval` : "No pending leave requests"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
