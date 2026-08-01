"use client";

import { lazy, Suspense, useMemo, useEffect, useRef } from "react";
import {
  Building2,
  Users,
  MapPin,
  FileText,
  UserCircle,
  CalendarCheck,
  CalendarRange,
  Activity,
  Shield,
  ClipboardCheck,
  Settings,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  IndianRupee,
  BarChart3,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useCurrentUser, useTodayAttendance, useAnalyticsDashboard, useConversionFunnel } from "@/hooks/api";
import {
  useOwnerMetrics,
  useOwnerKpi,
  useOwnerAlerts,
  useOwnerHistory,
  useInventory,
} from "@/hooks/api";
import { KPICard } from "./kpi-card";
import { DashboardClock } from "./dashboard-clock";
import { Last7DaysAttendance } from "./last7days-attendance";
import { DashboardSkeleton, ChartSkeleton } from "@/components/ui/skeleton-variants";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { format } from "date-fns";
import { io, Socket } from "socket.io-client";

const LeadFunnelChart = lazy(() =>
  import("@/components/charts/LeadFunnelChart").then((m) => ({
    default: m.LeadFunnelChart,
  }))
);
const RevenueTrendChart = lazy(() =>
  import("@/components/charts/RevenueTrendChart").then((m) => ({
    default: m.RevenueTrendChart,
  }))
);
const LeadTrendChart = lazy(() =>
  import("@/components/charts/LeadTrendChart").then((m) => ({
    default: m.LeadTrendChart,
  }))
);
const AttendanceAreaChart = lazy(() =>
  import("@/components/charts/AttendanceAreaChart").then((m) => ({
    default: m.AttendanceAreaChart,
  }))
);

const ALERT_SEVERITY: Record<string, { dot: string; badge: string }> = {
  CRITICAL: { dot: "bg-red-500", badge: "bg-red-500/15 text-red-400 border-red-500/20" },
  HIGH:     { dot: "bg-orange-500", badge: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  MEDIUM:   { dot: "bg-yellow-500", badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  LOW:      { dot: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
};

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-card/50 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="rounded-lg bg-white/[0.06] p-2">
        <Icon className="h-4 w-4 text-white/50" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white/90">{title}</h3>
        {subtitle && <p className="text-xs text-white/35">{subtitle}</p>}
      </div>
    </div>
  );
}

interface LowStockItem {
  id: string;
  materialId: string;
  quantityOnHand: number | string;
  lowStockThreshold: number;
  material?: { name: string; unit?: string };
  materials?: { name: string; unit?: string };
  site?: { name: string };
  constructionSites?: { name: string };
}

function resolveMaterialName(item: LowStockItem): string {
  return item.material?.name ?? item.materials?.name ?? item.materialId;
}

export function OwnerDashboard() {
  const queryClient = useQueryClient();
  const { data: analytics, isLoading } = useAnalyticsDashboard();
  const { data: todayAttendance, isLoading: attLoading } = useTodayAttendance();
  const { data: currentUser } = useCurrentUser();
  const { data: funnel } = useConversionFunnel();
  const { data: ownerMetrics } = useOwnerMetrics();
  const { data: ownerKpi } = useOwnerKpi();
  const { data: ownerAlerts } = useOwnerAlerts(10);
  const { data: ownerHistory } = useOwnerHistory(30);
  const { data: inventoryAll } = useInventory();
  const lowStockItems: LowStockItem[] = useMemo(
    () =>
      (Array.isArray(inventoryAll) ? (inventoryAll as LowStockItem[]) : []).filter(
        (i) => Number(i.quantityOnHand) <= (i.lowStockThreshold ?? 0),
      ),
    [inventoryAll],
  );

  const name = currentUser?.user?.firstName ?? "Owner";
  const hour = new Date().getHours();
  const timeOfDay =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const totalProperties = ownerKpi?.totalProperties ?? analytics?.properties?.total ?? 0;
  const totalLeads = ownerKpi?.totalLeads ?? analytics?.leads?.total ?? 0;
  const convertedLeads = ownerKpi?.convertedLeads ?? analytics?.leads?.converted ?? 0;
  const conversionRate = ownerKpi?.conversionRate ?? analytics?.leads?.conversionRate ?? 0;
  const totalSiteVisits = ownerKpi?.totalSiteVisits ?? analytics?.siteVisits?.total ?? 0;
  const totalBookings = ownerKpi?.totalBookings ?? analytics?.bookings?.total ?? 0;
  const revenue = ownerKpi?.totalRevenue ?? analytics?.bookings?.revenue ?? 0;
  const totalEmployees = ownerKpi?.totalEmployees ?? analytics?.employees?.active ?? 0;
  const presentToday = ownerKpi?.presentEmployees ?? todayAttendance?.present ?? 0;
  const absentToday = ownerKpi?.absentEmployees ?? todayAttendance?.absent ?? 0;
  const onLeaveToday = ownerKpi?.onLeaveToday ?? todayAttendance?.onLeave ?? 0;
  const pendingApprovals = ownerKpi?.pendingApprovals ?? 0;
  const overdueTasks = ownerKpi?.overdueTasks ?? 0;
  const activeWarnings = ownerKpi?.activeWarnings ?? 0;
  const activePayrollHolds = ownerKpi?.activePayrollHolds ?? 0;
  const criticalAlerts = ownerKpi?.criticalAlerts ?? 0;
  const avgPerformance = ownerKpi?.avgPerformanceScore ?? 0;

  const leadFunnelData = useMemo(() => {
    if (!funnel?.leads) return [];
    return funnel.leads.map((l) => ({ stage: l.status, count: l.count }));
  }, [funnel]);

  const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.owner.kpi() });
    queryClient.invalidateQueries({ queryKey: queryKeys.owner.metrics() });
    queryClient.invalidateQueries({ queryKey: queryKeys.owner.alerts() });
  };

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!currentUser?.user) return;

    let mounted = true;

    async function initSocket() {
      try {
        const tokenRes = await fetch("/api/auth/ws-token");
        if (!tokenRes.ok) return;
        const { token } = await tokenRes.json();

        if (!mounted) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const socket = io(API_URL, {
          path: "/api/v1/socket.io",
          auth: { token },
        });

        socket.on("dashboard:update", () => {
          handleRefresh();
        });

        socketRef.current = socket;
      } catch (err) {
        console.error("Socket initialization failed", err);
      }
    }

    initSocket();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUser?.user]);

  if (isLoading || attLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {timeOfDay}, <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">{name}</span>
          </h1>
          <p className="mt-1 text-sm text-white/40">Business overview & analytics</p>
          <div className="mt-2">
            <DashboardClock />
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/60 transition-all hover:bg-white/[0.08] hover:text-white/80"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          label="Properties"
          value={totalProperties}
          icon={<Building2 className="h-4 w-4" />}
          color="bg-blue-500"
        />
        <KPICard
          label="Total Leads"
          value={totalLeads}
          sub={`${convertedLeads} converted`}
          icon={<Users className="h-4 w-4" />}
          color="bg-emerald-500"
        />
        <KPICard
          label="Site Visits"
          value={totalSiteVisits}
          icon={<MapPin className="h-4 w-4" />}
          color="bg-orange-500"
        />
        <KPICard
          label="Bookings"
          value={totalBookings}
          sub={`₹${revenue.toLocaleString()}`}
          icon={<FileText className="h-4 w-4" />}
          color="bg-purple-500"
        />
        <KPICard
          label="Employees"
          value={totalEmployees}
          sub={`${attendanceRate}% present`}
          icon={<UserCircle className="h-4 w-4" />}
          color="bg-indigo-500"
        />
        <KPICard
          label="Conversion"
          value={`${conversionRate}%`}
          sub="Lead to booking"
          icon={<Activity className="h-4 w-4" />}
          color="bg-cyan-500"
        />
      </div>

      {/* Secondary Metrics */}
      <GlassCard className="p-4">
        <SectionHeader icon={BarChart3} title="Operations" subtitle="Requires attention" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <MetricPill label="Pending Approvals" value={pendingApprovals} icon={<ClipboardCheck className="h-3.5 w-3.5" />} color="text-blue-400" />
          <MetricPill label="Overdue Tasks" value={overdueTasks} icon={<AlertTriangle className="h-3.5 w-3.5" />} color="text-red-400" alert={overdueTasks > 0} />
          <MetricPill label="Active Warnings" value={activeWarnings} icon={<Shield className="h-3.5 w-3.5" />} color="text-orange-400" alert={activeWarnings > 0} />
          <MetricPill label="Payroll Holds" value={activePayrollHolds} icon={<Zap className="h-3.5 w-3.5" />} color="text-red-400" alert={activePayrollHolds > 0} />
          <MetricPill label="Site Delays" value={ownerKpi?.siteDelays ?? 0} icon={<MapPin className="h-3.5 w-3.5" />} color="text-amber-400" alert={(ownerKpi?.siteDelays ?? 0) > 0} />
          <MetricPill label="Avg Performance" value={avgPerformance.toFixed(1)} icon={<TrendingUp className="h-3.5 w-3.5" />} color="text-emerald-400" />
        </div>
      </GlassCard>

      {/* Business Health — §5.9 Collection Status + Material Alerts */}
      <GlassCard className="p-4">
        <SectionHeader
          icon={IndianRupee}
          title="Business Health"
          subtitle="Financial & material status"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricPill
            label="Collection Status"
            value={ownerKpi?.collectionStatus ?? 0}
            icon={<IndianRupee className="h-3.5 w-3.5" />}
            color="text-emerald-400"
          />
          <MetricPill
            label="Material Alerts"
            value={ownerKpi?.materialAlerts ?? 0}
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            color="text-red-400"
            alert={(ownerKpi?.materialAlerts ?? 0) > 0}
          />
          <MetricPill
            label="Critical Alerts"
            value={criticalAlerts}
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            color="text-red-400"
            alert={criticalAlerts > 0}
          />
          <MetricPill
            label="Avg Performance"
            value={avgPerformance.toFixed(1)}
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            color="text-emerald-400"
          />
        </div>
        {/* Collection Status — detail reusing the bookings/revenue data shape (§5.9) */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40">Collected share of booked revenue</p>
            <span className="text-xs font-medium text-white/80">
              {Math.min(100, Math.round(ownerKpi?.collectionStatus ?? 0))}%
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full bg-emerald-400/60"
              style={{
                width: `${Math.min(100, Math.round(ownerKpi?.collectionStatus ?? 0))}%`,
              }}
            />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between text-[11px] text-white/40">
            <span>
              Collected ₹
              {Math.round(
                (Number(revenue) *
                  Math.min(100, ownerKpi?.collectionStatus ?? 0)) /
                  100,
              ).toLocaleString()}
            </span>
            <span>
              Outstanding ₹
              {Math.round(
                Number(revenue) *
                  (1 - Math.min(100, ownerKpi?.collectionStatus ?? 0) / 100),
              ).toLocaleString()}{" "}
              · {ownerKpi?.totalBookings ?? 0} bookings
            </span>
          </div>
        </div>

        {/* Material Alerts — low-stock items surfaced from the inventory API (§5.9) */}
        {lowStockItems.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs text-white/40">
              Low-stock materials ({lowStockItems.length})
            </p>
            <div className="space-y-1.5">
              {lowStockItems.slice(0, 6).map((item) => {
                const isCritical =
                  Number(item.quantityOnHand) <= item.lowStockThreshold;
                return (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          isCritical
                            ? "h-1.5 w-1.5 rounded-full bg-red-500"
                            : "h-1.5 w-1.5 rounded-full bg-amber-500"
                        }
                      />
                      <span className="text-sm text-white/80">
                        {resolveMaterialName(item)}
                      </span>
                    </div>
                    <span
                      className={
                        isCritical
                          ? "text-xs font-medium text-red-400"
                          : "text-xs font-medium text-white/40"
                      }
                    >
                      {item.quantityOnHand} left · thresh {item.lowStockThreshold}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground/60">
          <Link
            href="/dashboard/materials"
            className="underline underline-offset-2 hover:text-muted-foreground"
          >
            Review low-stock materials →
          </Link>
          <Link
            href="/dashboard/payments"
            className="underline underline-offset-2 hover:text-muted-foreground"
          >
            Collection ledger →
          </Link>
        </div>
      </GlassCard>

      {/* Charts Row 1 — Revenue + Lead Trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        {ownerHistory && ownerHistory.length > 0 && (
          <GlassCard className="p-4">
            <SectionHeader icon={IndianRupee} title="Revenue Trend" subtitle="Last 30 days" />
            <Suspense fallback={<ChartSkeleton />}>
              <RevenueTrendChart data={ownerHistory} />
            </Suspense>
          </GlassCard>
        )}
        {ownerHistory && ownerHistory.length > 0 && (
          <GlassCard className="p-4">
            <SectionHeader icon={TrendingUp} title="Lead Pipeline" subtitle="Last 30 days" />
            <Suspense fallback={<ChartSkeleton />}>
              <LeadTrendChart data={ownerHistory} />
            </Suspense>
          </GlassCard>
        )}
      </div>

      {/* Charts Row 2 — Attendance + Funnel */}
      <div className="grid gap-4 lg:grid-cols-2">
        {ownerHistory && ownerHistory.length > 0 && (
          <GlassCard className="p-4">
            <SectionHeader icon={CalendarRange} title="Attendance Overview" subtitle="Last 30 days" />
            <Suspense fallback={<ChartSkeleton />}>
              <AttendanceAreaChart data={ownerHistory} />
            </Suspense>
          </GlassCard>
        )}
        {leadFunnelData.length > 0 && (
          <GlassCard className="p-4">
            <SectionHeader icon={BarChart3} title="Conversion Funnel" subtitle="Current pipeline" />
            <Suspense fallback={<ChartSkeleton />}>
              <LeadFunnelChart data={leadFunnelData} />
            </Suspense>
          </GlassCard>
        )}
      </div>

      {/* Alerts */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-white/[0.06] p-2">
            <AlertTriangle className="h-4 w-4 text-white/50" />
          </div>
          <h3 className="text-sm font-semibold text-white/90">Alerts</h3>
          {criticalAlerts > 0 && (
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${ALERT_SEVERITY.CRITICAL.badge}`}
            >
              {criticalAlerts} critical
            </span>
          )}
        </div>
        {ownerAlerts && ownerAlerts.length > 0 ? (
          <div className="space-y-2">
            {ownerAlerts.slice(0, 5).map((alert) => {
              const severity = ALERT_SEVERITY[alert.status] ?? ALERT_SEVERITY.MEDIUM;
              return (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${severity.dot}`} />
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${severity.badge}`}>
                      {alert.status}
                    </span>
                    <span className="text-sm text-white/60">Alert {alert.id.slice(0, 8)}</span>
                  </div>
                  <span className="text-xs text-white/30">
                    {format(new Date(alert.createdAt), "MMM d, HH:mm")}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-emerald-500/5 px-4 py-6">
            <Shield className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-400">All clear</p>
              <p className="text-xs text-white/30">No critical alerts — systems nominal</p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Quick Actions */}
      <div>
        <SectionHeader icon={Zap} title="Quick Actions" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ActionCard href="/dashboard/approvals" icon={ClipboardCheck} label="Approvals" color="text-blue-400" bg="bg-blue-500/10" />
          <ActionCard href="/dashboard/users" icon={Shield} label="Users" color="text-emerald-400" bg="bg-emerald-500/10" />
          <ActionCard href="/dashboard/employees" icon={UserCircle} label="Employees" color="text-purple-400" bg="bg-purple-500/10" />
          <ActionCard href="/dashboard/properties" icon={Building2} label="Properties" color="text-orange-400" bg="bg-orange-500/10" />
          <ActionCard href="/dashboard/reports" icon={BarChart3} label="Reports" color="text-cyan-400" bg="bg-cyan-500/10" />
        </div>
      </div>

      {/* Attendance Table */}
      <GlassCard className="p-4">
        <SectionHeader icon={CalendarCheck} title="Team Attendance" subtitle="Last 7 days" />
        <Last7DaysAttendance />
      </GlassCard>
    </div>
  );
}

function MetricPill({ label, value, icon, color, alert }: { label: string; value: string | number; icon: React.ReactNode; color: string; alert?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border border-white/[0.06] px-4 py-3 transition-colors hover:bg-white/[0.04] ${alert ? "border-red-500/20 bg-red-500/5" : "bg-white/[0.02]"}`}>
      <div className={color}>{icon}</div>
      <div>
        <p className="text-xs text-white/40">{label}</p>
        <p className={`text-lg font-bold ${alert ? "text-red-400" : "text-white"}`}>{value}</p>
      </div>
    </div>
  );
}

function ActionCard({ href, icon: Icon, label, color, bg }: { href: string; icon: React.ElementType; label: string; color: string; bg: string }) {
  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 transition-all hover:border-white/[0.12] hover:bg-white/[0.06]">
        <div className={`rounded-lg p-2 ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <span className="text-sm font-medium text-white/70 group-hover:text-white">{label}</span>
        <ChevronRight className="ml-auto h-4 w-4 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/40" />
      </div>
    </Link>
  );
}
