"use client";

import { useCallback, useMemo, lazy, Suspense } from "react";
import { Building2, Users, MapPin, FileText, UserCircle, CalendarCheck, CalendarRange, Activity, Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAnalyticsDashboard } from "@/hooks/api/useAnalytics";
import { useTodayAttendance } from "@/hooks/api/useAttendance";
import { KPICard } from "./kpi-card";
import Link from "next/link";

const PropertyStatusChart = lazy(() => import("@/components/charts/PropertyStatusChart").then(m => ({ default: m.PropertyStatusChart })));
const LeadFunnelChart = lazy(() => import("@/components/charts/LeadFunnelChart").then(m => ({ default: m.LeadFunnelChart })));
const AttendanceTrendChart = lazy(() => import("@/components/charts/AttendanceTrendChart").then(m => ({ default: m.AttendanceTrendChart })));
const DepartmentPieChart = lazy(() => import("@/components/charts/DepartmentPieChart").then(m => ({ default: m.DepartmentPieChart })));

function ChartSkeleton() {
  return <Card><CardContent className="h-64 flex items-center justify-center"><div className="animate-pulse w-full h-48 rounded-lg bg-muted" /></CardContent></Card>;
}

function KpiSkeleton() {
  return <Card><CardContent className="p-4"><div className="animate-pulse space-y-2"><div className="h-4 w-24 rounded bg-muted" /><div className="h-8 w-16 rounded bg-muted" /></div></CardContent></Card>;
}

export function AdminDashboard() {
  const { data: analytics, isLoading } = useAnalyticsDashboard();
  const { data: todayAttendance, isLoading: attLoading } = useTodayAttendance();

  const crm = analytics?.crm;
  const hrms = analytics?.hrms;
  const attendanceTrend = useMemo(() => hrms?.attendanceTrend ?? [], [hrms]);
  const departmentData = useMemo(() => hrms?.departmentDistribution ?? [], [hrms]);

  const pByStatus = useCallback((s: string) => crm?.propertiesByStatus?.find(p => p.status === s)?.count ?? 0, [crm?.propertiesByStatus]);
  const lByStatus = useCallback((s: string) => crm?.leadsByStatus?.find(l => l.status === s)?.count ?? 0, [crm?.leadsByStatus]);
  const svByStatus = (s: string) => crm?.siteVisitsByStatus?.find(v => v.status === s)?.count ?? 0;
  const bkByStatus = (s: string) => crm?.bookingsByStatus?.find(b => b.status === s)?.count ?? 0;

  const totalProperties = crm?.totalProperties ?? 0;
  const availableProperties = pByStatus("AVAILABLE");
  const totalLeads = crm?.totalLeads ?? 0;
  const newLeads = lByStatus("NEW");
  const totalSiteVisits = crm?.totalSiteVisits ?? 0;
  const scheduledVisits = svByStatus("SCHEDULED");
  const totalBookings = crm?.totalBookings ?? 0;
  const pendingBookings = bkByStatus("PENDING");
  const totalEmployees = hrms?.totalEmployees ?? 0;
  const presentToday = todayAttendance?.present ?? 0;
  const absentToday = todayAttendance?.absent ?? 0;
  const onLeaveToday = todayAttendance?.onLeave ?? 0;
  const pendingLeaves = hrms?.pendingLeaves ?? 0;

  const propertyStatusData = useMemo(() => [
    { name: "Available", value: availableProperties, fill: "#22c55e" },
    { name: "Booked", value: pByStatus("BOOKED"), fill: "#3b82f6" },
    { name: "Sold", value: pByStatus("SOLD"), fill: "#8884d8" },
    { name: "Reserved", value: pByStatus("RESERVED"), fill: "#f59e0b" },
  ], [availableProperties, pByStatus]);

  const leadFunnelData = useMemo(() => [
    { stage: "New", count: lByStatus("NEW") },
    { stage: "Contacted", count: lByStatus("CONTACTED") },
    { stage: "Interested", count: lByStatus("INTERESTED") },
    { stage: "Site Visit", count: lByStatus("SITE_VISIT_SCHEDULED") },
    { stage: "Negotiation", count: lByStatus("NEGOTIATION") },
    { stage: "Converted", count: lByStatus("CONVERTED") },
    { stage: "Lost", count: lByStatus("LOST") },
  ], [lByStatus]);

  if (isLoading || attLoading) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-2xl font-semibold text-foreground">Admin Dashboard</h2><p className="text-sm text-muted-foreground">Real-time overview of your business</p></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">{Array.from({ length: 8 }).map((_, i) => <KpiSkeleton key={i} />)}</div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <ChartSkeleton key={i} />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Admin Dashboard</h2>
        <p className="text-sm text-muted-foreground">Real-time overview of your business</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <KPICard label="Total Properties" value={totalProperties} sub={`${availableProperties} available`} icon={<Building2 className="h-5 w-5 text-white" />} color="bg-blue-500" />
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
        <Suspense fallback={<ChartSkeleton />}><AttendanceTrendChart data={attendanceTrend} /></Suspense>
        <Suspense fallback={<ChartSkeleton />}><DepartmentPieChart data={departmentData} /></Suspense>
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg font-semibold">Pending Leave Requests</CardTitle></CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-4">
              {pendingLeaves > 0 ? `${pendingLeaves} pending approval` : "No pending leave requests"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
