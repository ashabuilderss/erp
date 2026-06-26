"use client";

import { lazy, Suspense, useMemo } from "react";
import { Building2, Users, MapPin, FileText, UserCircle, CalendarCheck, CalendarRange, Activity, Shield, ClipboardCheck, Settings } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/api";
import { useAnalyticsDashboard, useConversionFunnel } from "@/hooks/api/useAnalytics";
import { useTodayAttendance } from "@/hooks/api/useAttendance";
import { KPICard } from "./kpi-card";
import { DashboardClock } from "./dashboard-clock";
import { Last7DaysAttendance } from "./last7days-attendance";
import { DashboardSkeleton, ChartSkeleton } from "@/components/ui/skeleton-variants";
import Link from "next/link";

const LeadFunnelChart = lazy(() => import("@/components/charts/LeadFunnelChart").then(m => ({ default: m.LeadFunnelChart })));

export function OwnerDashboard() {
  const { data: analytics, isLoading } = useAnalyticsDashboard();
  const { data: todayAttendance, isLoading: attLoading } = useTodayAttendance();
  const { data: currentUser } = useCurrentUser();
  const { data: funnel } = useConversionFunnel();
  const name = currentUser?.user?.firstName ?? "Owner";
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const totalProperties = analytics?.properties?.total ?? 0;
  const totalLeads = analytics?.leads?.total ?? 0;
  const convertedLeads = analytics?.leads?.converted ?? 0;
  const conversionRate = analytics?.leads?.conversionRate ?? 0;
  const totalSiteVisits = analytics?.siteVisits?.total ?? 0;
  const totalBookings = analytics?.bookings?.total ?? 0;
  const revenue = analytics?.bookings?.revenue ?? 0;
  const totalEmployees = analytics?.employees?.active ?? 0;
  const presentToday = todayAttendance?.present ?? 0;
  const absentToday = todayAttendance?.absent ?? 0;
  const onLeaveToday = todayAttendance?.onLeave ?? 0;

  const leadFunnelData = useMemo(() => {
    if (!funnel?.leads) return [];
    return funnel.leads.map(l => ({ stage: l.status, count: l.count }));
  }, [funnel]);

  if (isLoading || attLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{timeOfDay}, {name}</h2>
        <p className="text-sm text-muted-foreground">Full business oversight</p>
        <div className="mt-2"><DashboardClock /></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <KPICard label="Total Properties" value={totalProperties} icon={<Building2 className="h-5 w-5 text-white" />} color="bg-blue-500" />
        <KPICard label="Total Leads" value={totalLeads} sub={`${convertedLeads} converted`} icon={<Users className="h-5 w-5 text-white" />} color="bg-green-500" />
        <KPICard label="Site Visits" value={totalSiteVisits} icon={<MapPin className="h-5 w-5 text-white" />} color="bg-orange-500" />
        <KPICard label="Total Bookings" value={totalBookings} sub={`₹${revenue.toLocaleString()}`} icon={<FileText className="h-5 w-5 text-white" />} color="bg-purple-500" />
        <KPICard label="Total Employees" value={totalEmployees} sub={`${presentToday} present today`} icon={<UserCircle className="h-5 w-5 text-white" />} color="bg-indigo-500" />
        <KPICard label="Present Today" value={presentToday} sub={`${absentToday} absent, ${onLeaveToday} on leave`} icon={<CalendarCheck className="h-5 w-5 text-white" />} color="bg-emerald-500" />
        <KPICard label="Absent Today" value={absentToday} sub={`${onLeaveToday} on leave`} icon={<CalendarRange className="h-5 w-5 text-white" />} color="bg-red-500" />
        <KPICard label="Conversion Rate" value={`${conversionRate}%`} sub="Lead to booking" icon={<Activity className="h-5 w-5 text-white" />} color="bg-yellow-500" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leadFunnelData.length > 0 && (
          <Suspense fallback={<ChartSkeleton />}><LeadFunnelChart data={leadFunnelData} /></Suspense>
        )}
        <Card>
          <CardHeader><CardTitle>Property Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-3xl font-bold">{totalProperties}</p>
              <p className="text-sm text-muted-foreground">Total Properties</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-3xl font-bold">₹{revenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Owner Actions</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <Link href="/dashboard/approvals" className="block"><Card className="cursor-pointer hover:bg-muted/50 transition-colors"><CardContent className="flex flex-col items-center justify-center py-4 gap-2"><ClipboardCheck className="h-6 w-6 text-blue-500" /><span className="text-sm font-medium">Approval Center</span></CardContent></Card></Link>
          <Link href="/dashboard/users" className="block"><Card className="cursor-pointer hover:bg-muted/50 transition-colors"><CardContent className="flex flex-col items-center justify-center py-4 gap-2"><Shield className="h-6 w-6 text-green-500" /><span className="text-sm font-medium">Manage Users</span></CardContent></Card></Link>
          <Link href="/dashboard/settings" className="block"><Card className="cursor-pointer hover:bg-muted/50 transition-colors"><CardContent className="flex flex-col items-center justify-center py-4 gap-2"><Settings className="h-6 w-6 text-orange-500" /><span className="text-sm font-medium">Company Settings</span></CardContent></Card></Link>
          <Link href="/dashboard/employees" className="block"><Card className="cursor-pointer hover:bg-muted/50 transition-colors"><CardContent className="flex flex-col items-center justify-center py-4 gap-2"><UserCircle className="h-6 w-6 text-purple-500" /><span className="text-sm font-medium">View Employees</span></CardContent></Card></Link>
          <Link href="/dashboard/properties" className="block"><Card className="cursor-pointer hover:bg-muted/50 transition-colors"><CardContent className="flex flex-col items-center justify-center py-4 gap-2"><Building2 className="h-6 w-6 text-red-500" /><span className="text-sm font-medium">View Properties</span></CardContent></Card></Link>
        </div>
      </div>

      <Last7DaysAttendance />
    </div>
  );
}
