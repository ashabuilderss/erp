"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useCurrentUser, usePendingLeaveCount, useEmployeeAnalytics, useMyLeaveBalance, useMyAttendance, useCheckIn, useCheckOut } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "./kpi-card";
import { DashboardClock } from "./dashboard-clock";
import { DashboardSkeleton } from "@/components/ui/skeleton-variants";
import { CalendarCheck, Building2, Users, MapPin, FileText, Activity, LogIn, CalendarRange } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export function EmployeeDashboard() {
  const { data: session } = useSession();
  const { data: currentUser } = useCurrentUser();
  const { showToast } = useToast();
  const employeeName = session?.user ? `${session.user.firstName} ${session.user.lastName}` : "Employee";
  const { data: pendingLeavesCount } = usePendingLeaveCount();
  const employeeId = currentUser?.employee?.id || "";
  const { data: myAnalytics } = useEmployeeAnalytics(employeeId);
  const { data: leaveBalance } = useMyLeaveBalance();
  const { data: myAttendanceRes } = useMyAttendance();
  const myAttendance = myAttendanceRes?.records ?? [];
  const todayStr = myAttendanceRes?.today ?? new Date().toISOString().slice(0, 10);
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const [gpsLoading, setGpsLoading] = useState(false);

  const todayRecord = myAttendance?.find((a) => {
    const d = a.date ? (typeof a.date === 'string' ? a.date.slice(0, 10) : '') : '';
    return d === todayStr;
  });
  const isCheckedIn = todayRecord?.checkIn && !todayRecord?.checkOut;

  const getPosition = useCallback((): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000, enableHighAccuracy: true },
      );
    });
  }, []);

  const handleCheckIn = useCallback(async () => {
    setGpsLoading(true);
    const coords = await getPosition();
    checkIn.mutate(coords ?? undefined, {
      onSuccess: () => showToast("Checked in successfully"),
      onError: (err: unknown) => showToast(getApiErrorMessage(err, "Check-in failed"), "error"),
      onSettled: () => setGpsLoading(false),
    });
  }, [checkIn, getPosition, showToast]);

  const handleCheckOut = useCallback(async () => {
    setGpsLoading(true);
    const coords = await getPosition();
    checkOut.mutate(coords ?? undefined, {
      onSuccess: () => showToast("Checked out successfully"),
      onError: (err: unknown) => showToast(getApiErrorMessage(err, "Check-out failed"), "error"),
      onSettled: () => setGpsLoading(false),
    });
  }, [checkOut, getPosition, showToast]);

  const isLoading = !currentUser || !myAnalytics;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Welcome, {employeeName}</h2>
        <p className="text-sm text-muted-foreground">Your personal workspace</p>
        <div className="mt-2"><DashboardClock /></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <KPICard
          label="My Attendance"
          value={myAttendance.length > 0 ? `${Math.round((myAttendance.filter(a => a.status === "PRESENT").length / myAttendance.length) * 100)}%` : "-"}
          sub={`${myAttendance.filter(a => a.status === "PRESENT").length}/${myAttendance.length} days`}
          icon={<CalendarCheck className="h-5 w-5 text-white" />}
          color="bg-blue-500"
        />
        <KPICard label="Properties" value={myAnalytics?.metrics?.propertiesAssigned ?? 0} icon={<Building2 className="h-5 w-5 text-white" />} color="bg-orange-500" />
        <KPICard label="Leads" value={myAnalytics?.metrics?.leadsAssigned ?? 0} icon={<Users className="h-5 w-5 text-white" />} color="bg-purple-500" />
        <KPICard label="Site Visits" value={myAnalytics?.metrics?.siteVisitsCompleted ?? 0} sub="Completed" icon={<MapPin className="h-5 w-5 text-white" />} color="bg-teal-500" />
        <KPICard label="Bookings" value={myAnalytics?.metrics?.bookingsClosed ?? 0} sub="Closed" icon={<FileText className="h-5 w-5 text-white" />} color="bg-green-500" />
        <KPICard label="Pending Leaves" value={pendingLeavesCount ?? 0} icon={<Activity className="h-5 w-5 text-white" />} color="bg-yellow-500" />
      </div>

      <Card>
        <CardHeader><CardTitle>Today&apos;s Attendance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {todayRecord?.checkIn && <p className="text-sm text-muted-foreground">Check-in: <span className="font-medium text-foreground">{format(new Date(todayRecord.checkIn), "HH:mm")}</span></p>}
            {todayRecord?.checkOut && <p className="text-sm text-muted-foreground">Check-out: <span className="font-medium text-foreground">{format(new Date(todayRecord.checkOut), "HH:mm")}</span></p>}
            {todayRecord?.status && <Badge variant="outline" className={todayRecord.status === "PRESENT" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>{todayRecord.status}</Badge>}
            {(todayRecord as any)?.latitude && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {Number((todayRecord as any).latitude).toFixed(4)}, {Number((todayRecord as any).longitude).toFixed(4)}
              </p>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            {!todayRecord?.checkIn && (
              <Button size="sm" onClick={handleCheckIn} disabled={checkIn.isPending || gpsLoading}>
                {gpsLoading ? "Getting location..." : checkIn.isPending ? "Checking in..." : "Check In"}
              </Button>
            )}
            {isCheckedIn && (
              <Button size="sm" variant="outline" onClick={handleCheckOut} disabled={checkOut.isPending || gpsLoading}>
                {gpsLoading ? "Getting location..." : checkOut.isPending ? "Checking out..." : "Check Out"}
              </Button>
            )}
            {todayRecord?.checkIn && todayRecord?.checkOut && (
              <p className="text-sm text-green-600 font-medium">Completed</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/attendance"><Card className="cursor-pointer hover:bg-muted/50 transition-colors"><CardContent className="flex flex-col items-center justify-center py-6 gap-2"><LogIn className="h-8 w-8 text-blue-500" /><span className="text-sm font-medium">Attendance History</span></CardContent></Card></Link>
        <Link href="/dashboard/leave-requests"><Card className="cursor-pointer hover:bg-muted/50 transition-colors"><CardContent className="flex flex-col items-center justify-center py-6 gap-2"><CalendarRange className="h-8 w-8 text-green-500" /><span className="text-sm font-medium">Apply Leave</span></CardContent></Card></Link>
        <Link href="/dashboard/properties"><Card className="cursor-pointer hover:bg-muted/50 transition-colors"><CardContent className="flex flex-col items-center justify-center py-6 gap-2"><Building2 className="h-8 w-8 text-orange-500" /><span className="text-sm font-medium">My Properties</span></CardContent></Card></Link>
        <Link href="/dashboard/leads"><Card className="cursor-pointer hover:bg-muted/50 transition-colors"><CardContent className="flex flex-col items-center justify-center py-6 gap-2"><Users className="h-8 w-8 text-purple-500" /><span className="text-sm font-medium">My Leads</span></CardContent></Card></Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Leave Balance</CardTitle></CardHeader>
          <CardContent>
            {leaveBalance && leaveBalance.length > 0 ? (
              <div className="space-y-3">
                {leaveBalance.map((b) => (
                  <div key={b.leaveType} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div><p className="text-sm font-medium">{b.leaveType}</p><p className="text-xs text-muted-foreground">{b.usedDays} used of {b.totalDays}</p></div>
                    <span className={`text-sm font-bold ${b.remainingDays <= 0 ? "text-destructive" : "text-green-600"}`}>{b.remainingDays} left</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-4">No leave allocations yet</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Attendance</CardTitle></CardHeader>
          <CardContent>
            {myAttendance && myAttendance.length > 0 ? (
              <div className="space-y-2">
                {myAttendance.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <p className="text-sm">{format(new Date(a.date), "MMM dd")}</p>
                    <Badge variant="outline" className={a.status === "PRESENT" ? "bg-green-100 text-green-800" : a.status === "ABSENT" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>{a.status}</Badge>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-4">No records</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Site Visits</CardTitle></CardHeader>
          <CardContent>
            {myAnalytics?.metrics?.siteVisitsCompleted ? (
              <p className="text-sm text-muted-foreground">{myAnalytics.metrics.siteVisitsCompleted} site visit(s) completed</p>
            ) : <p className="text-sm text-muted-foreground text-center py-4">No site visits yet</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Conversion Rate</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{myAnalytics?.metrics?.conversionRate ?? 0}%</div>
            <p className="text-sm text-muted-foreground mt-1">Lead to booking conversion</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
