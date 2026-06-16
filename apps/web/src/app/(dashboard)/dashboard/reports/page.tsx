"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalyticsDashboard, useConversionFunnel } from "@/hooks/api";

export default function ReportsPage() {
  const { data: analytics } = useAnalyticsDashboard();
  const { data: funnel } = useConversionFunnel();

  const statCards = [
    { label: "Total Employees", value: analytics?.hrms?.totalEmployees ?? 0, sub: `${analytics?.hrms?.activeEmployees ?? 0} active` },
    { label: "Total Assignments", value: analytics?.ems?.totalAssignments ?? 0 },
    { label: "Avg Performance", value: analytics?.ems?.avgPerformanceScore ? `${analytics.ems.avgPerformanceScore.toFixed(1)}%` : "-" },
    { label: "Attendance Rate", value: analytics?.hrms?.attendanceRate ? `${analytics.hrms.attendanceRate.toFixed(1)}%` : "-" },
    { label: "Pending Leaves", value: analytics?.hrms?.pendingLeaves ?? 0 },
  ];

  const funnelData = funnel ? [
    { stage: "Leads", count: funnel.leads },
    { stage: "Site Visits", count: funnel.siteVisits },
    { stage: "Bookings", count: funnel.bookings },
    { stage: "Converted", count: funnel.convertedLeads },
  ] : [];

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-semibold">Reports</h2><p className="text-sm text-muted-foreground">Key metrics and analytics</p></div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              {s.sub && <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Conversion Funnel</CardTitle></CardHeader>
          <CardContent>
            {funnelData.length > 0 ? (
              <div className="space-y-3">
                {funnelData.map((f) => (
                  <div key={f.stage}>
                    <div className="flex justify-between text-sm mb-1"><span>{f.stage}</span><span className="font-medium">{f.count}</span></div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${funnelData[0].count > 0 ? (f.count / funnelData[0].count) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 text-sm text-muted-foreground space-y-1">
                  <p>Lead → Visit: {funnel?.leadToVisitRate.toFixed(1)}%</p>
                  <p>Visit → Booking: {funnel?.visitToBookingRate.toFixed(1)}%</p>
                  <p>Lead → Booking: {funnel?.leadToBookingRate.toFixed(1)}%</p>
                </div>
              </div>
            ) : <p className="text-muted-foreground text-sm">No data available</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assignments by Type</CardTitle></CardHeader>
          <CardContent>
            {analytics?.ems?.assignmentsByType && analytics.ems.assignmentsByType.length > 0 ? (
              <div className="space-y-3">
                {analytics.ems.assignmentsByType.map((a) => (
                  <div key={a.type}>
                    <div className="flex justify-between text-sm mb-1"><span>{a.type}</span><span className="font-medium">{a.count}</span></div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${Math.max(1, (a.count / Math.max(...analytics.ems.assignmentsByType.map(x => x.count))) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-sm">No assignment data</p>}
          </CardContent>
        </Card>

        {analytics?.ems?.topPerformers && analytics.ems.topPerformers.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Top Performers</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.ems.topPerformers.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span>{p.employeeId}</span>
                    <span className="font-medium">{p.score} pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
