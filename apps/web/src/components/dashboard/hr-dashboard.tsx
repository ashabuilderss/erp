"use client";

import { useMemo } from "react";
import { CheckCircle, Clock, CalendarRange, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser, useTodayAttendance, usePendingLeaveCount, useAttendance, useLeaveRequests } from "@/hooks/api";
import { KPICard } from "./kpi-card";
import { DashboardClock } from "./dashboard-clock";
import { Last7DaysAttendance } from "./last7days-attendance";
import { DashboardSkeleton } from "@/components/ui/skeleton-variants";
import { EmptyState } from "@/components/shared/empty-state";
import { format } from "date-fns";

export function HRDashboard() {
  const recentAttQuery = useMemo(() => ({ limit: 5, sortBy: "date" as const, sortOrder: "desc" as const }), []);
  const leaveQuery = useMemo(() => ({ limit: 10, sortBy: "createdAt" as const, sortOrder: "desc" as const }), []);
  const { data: todayAttendance, isLoading: attLoading } = useTodayAttendance();
  const { data: pendingLeavesCount, isLoading: pendingLoading } = usePendingLeaveCount();
  const { data: attendanceData, isLoading: recentLoading } = useAttendance(recentAttQuery);
  const { data: leaveData, isLoading: leaveLoading } = useLeaveRequests(leaveQuery);

  const { data: currentUser } = useCurrentUser();
  const name = currentUser?.user?.firstName ?? "HR";
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const isLoading = attLoading || pendingLoading || recentLoading || leaveLoading;

  const presentToday = todayAttendance?.present ?? 0;
  const absentToday = todayAttendance?.absent ?? 0;
  const onLeaveToday = todayAttendance?.onLeave ?? 0;
  const pendingLeaves = pendingLeavesCount ?? 0;
  const pendingList = leaveData?.data?.filter(l => l.status === "PENDING") ?? [];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{timeOfDay}, {name}</h2>
        <p className="text-sm text-muted-foreground">Workforce overview</p>
        <div className="mt-2"><DashboardClock /></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KPICard label="Present Today" value={presentToday} icon={<CheckCircle className="h-5 w-5 text-white" />} color="bg-green-500" />
        <KPICard label="Absent Today" value={absentToday} icon={<Clock className="h-5 w-5 text-white" />} color="bg-red-500" />
        <KPICard label="On Leave" value={onLeaveToday} icon={<CalendarRange className="h-5 w-5 text-white" />} color="bg-orange-500" />
        <KPICard label="Pending Leaves" value={pendingLeaves} sub="Requires approval" icon={<Activity className="h-5 w-5 text-white" />} color="bg-yellow-500" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Attendance</CardTitle></CardHeader>
          <CardContent>
            {attendanceData?.data?.length ? (
              <div className="space-y-3">
                {attendanceData.data.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{a.employee?.employeeCode || a.employeeId}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(a.date), "MMM dd, yyyy")}</p>
                    </div>
                    <Badge variant="outline" className={a.status === "PRESENT" ? "bg-green-100 text-green-800" : a.status === "ABSENT" ? "bg-red-100 text-red-800" : a.status === "HALF_DAY" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}>{a.status}</Badge>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No records" description="No attendance records found" className="border-0" />}
          </CardContent>
        </Card>

      </div>

      <Last7DaysAttendance />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Pending Leave Requests</CardTitle></CardHeader>
          <CardContent>
            {pendingList.length > 0 ? (
              <div className="space-y-3">
                {pendingList.slice(0, 5).map((l) => (
                  <div key={l.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{l.employee?.employeeCode || l.employeeId}</p>
                      <p className="text-xs text-muted-foreground">{l.type} - {format(new Date(l.startDate), "MMM dd")} to {format(new Date(l.endDate), "MMM dd")}</p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">{l.status}</Badge>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No pending requests" description="No leave requests require approval" className="border-0" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
