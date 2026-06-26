"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, MapPin, FileText, CheckCircle, Clock, AlertCircle, ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { LucideIcon } from "lucide-react";
import { useSiteVisits, useBookings, useLeads, useProperties } from "@/hooks/api";
import { useCurrentUser } from "@/hooks/api";
import { format } from "date-fns";
import Link from "next/link";

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800", COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800", RESCHEDULED: "bg-yellow-100 text-yellow-800",
  PENDING: "bg-yellow-100 text-yellow-800", CONFIRMED: "bg-green-100 text-green-800",
  NEW: "bg-blue-100 text-blue-800", CONTACTED: "bg-purple-100 text-purple-800",
  INTERESTED: "bg-indigo-100 text-indigo-800", SITE_VISIT_SCHEDULED: "bg-orange-100 text-orange-800",
  NEGOTIATION: "bg-pink-100 text-pink-800", CONVERTED: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
  AVAILABLE: "bg-green-100 text-green-800", RESERVED: "bg-yellow-100 text-yellow-800",
  BOOKED: "bg-blue-100 text-blue-800", SOLD: "bg-purple-100 text-purple-800",
};

const typeConfig: Record<string, { label: string; icon: LucideIcon; href: string }> = {
  SITE_VISIT: { label: "Site Visit", icon: MapPin, href: "/dashboard/site-visits" },
  BOOKING: { label: "Booking", icon: FileText, href: "/dashboard/bookings" },
  LEAD: { label: "Lead", icon: Users, href: "/dashboard/leads" },
  PROPERTY: { label: "Property", icon: Building2, href: "/dashboard/properties" },
};

interface TaskItem {
  id: string;
  type: "SITE_VISIT" | "BOOKING" | "LEAD" | "PROPERTY";
  title: string;
  status: string;
  date: string;
}

export default function MyTasksPage() {
  const { data: currentUser } = useCurrentUser();
  const employeeId = currentUser?.employee?.id || "";

  const filter = useMemo(() => ({ assignedToEmployeeId: employeeId, limit: 100 }), [employeeId]);
  const { data: svData } = useSiteVisits(employeeId ? filter : { limit: 1 });
  const { data: bkData } = useBookings(employeeId ? filter : { limit: 1 });
  const { data: leadData } = useLeads(employeeId ? filter : { limit: 1 });
  const { data: propData } = useProperties(employeeId ? filter : { limit: 1 });

  const tasks = useMemo(() => {
    const items: TaskItem[] = [];
    (svData?.data || []).forEach((sv) => {
      items.push({ id: sv.id, type: "SITE_VISIT", title: sv.property?.title || sv.propertyId, status: sv.status, date: sv.scheduledDate });
    });
    (bkData?.data || []).forEach((bk) => {
      items.push({ id: bk.id, type: "BOOKING", title: `${bk.property?.title || bk.propertyId} - ${bk.customer?.name || bk.customerId}`, status: bk.status, date: bk.bookingDate });
    });
    (leadData?.data || []).forEach((l) => {
      items.push({ id: l.id, type: "LEAD", title: l.customerName, status: l.status, date: l.createdAt });
    });
    (propData?.data || []).forEach((p) => {
      items.push({ id: p.id, type: "PROPERTY", title: p.title, status: p.status, date: p.createdAt });
    });
    return items;
  }, [svData, bkData, leadData, propData]);

  const completed = tasks.filter(t => ["COMPLETED", "CONFIRMED", "CONVERTED", "SOLD"].includes(t.status)).length;
  const pending = tasks.filter(t => ["SCHEDULED", "PENDING", "NEW", "AVAILABLE"].includes(t.status)).length;
  const overdue = tasks.filter(t => {
    if (t.status !== "SCHEDULED" && t.status !== "PENDING") return false;
    const d = new Date(t.date);
    return d < new Date();
  }).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">My Tasks</h2>
        <p className="text-sm text-muted-foreground">Everything assigned to you</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500"><CheckCircle className="h-5 w-5 text-white" /></div><div><p className="text-2xl font-bold">{tasks.length}</p><p className="text-xs text-muted-foreground">Total Tasks</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500"><CheckCircle className="h-5 w-5 text-white" /></div><div><p className="text-2xl font-bold">{completed}</p><p className="text-xs text-muted-foreground">Completed</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-yellow-500"><Clock className="h-5 w-5 text-white" /></div><div><p className="text-2xl font-bold">{pending}</p><p className="text-xs text-muted-foreground">Pending</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-red-500"><AlertCircle className="h-5 w-5 text-white" /></div><div><p className="text-2xl font-bold">{overdue}</p><p className="text-xs text-muted-foreground">Overdue</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">All Tasks</CardTitle></CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <EmptyState icon={<ClipboardList className="h-12 w-12" />} title="No tasks assigned to you yet" description="Tasks assigned to you will appear here" />
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => {
                const config = typeConfig[t.type];
                const Icon = config.icon;
                return (
                  <Link key={`${t.type}-${t.id}`} href={config.href} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-muted"><Icon className="h-4 w-4" /></div>
                      <div>
                        <p className="text-sm font-medium">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{config.label} • {format(new Date(t.date), "MMM dd, yyyy")}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColors[t.status] || "bg-gray-100 text-gray-800"}>{t.status}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
