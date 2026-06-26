"use client";

import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFilePolicy, useLoginHistory, useSecurityEvents, useSessions } from "@/hooks/api";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton, ListSkeleton } from "@/components/ui/skeleton-variants";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

export default function SecurityPage() {
  const { data: loginHistory, isLoading: loginLoading } = useLoginHistory();
  const { data: securityEvents, isLoading: eventsLoading } = useSecurityEvents();
  const { data: sessions } = useSessions();
  const { data: filePolicy } = useFilePolicy();

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground">Login activity, sessions, event audit, and upload policy.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Login attempts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{loginHistory?.meta.total ?? 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Sessions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{sessions?.length ?? 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Security events</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{securityEvents?.meta.total ?? 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Upload limit</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{filePolicy ? `${Math.round(filePolicy.maxSizeBytes / 1024 / 1024)}MB` : "-"}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Login History</CardTitle></CardHeader>
        <CardContent>
          {loginLoading ? <TableSkeleton rows={5} columns={5} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-2">Email</th><th className="pb-2">Status</th><th className="pb-2">Reason</th><th className="pb-2">Time</th></tr></thead>
                <tbody>
                  {(loginHistory?.data ?? []).slice(0, 10).map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2">{row.email}</td>
                      <td className="py-2"><Badge variant="outline">{row.status}</Badge></td>
                      <td className="py-2">{row.reason ?? "-"}</td>
                      <td className="py-2">{formatDate(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Security Events</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {eventsLoading ? <ListSkeleton rows={4} /> : (securityEvents?.data ?? []).slice(0, 8).map((event) => (
              <div key={event.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{event.type}</span>
                  <Badge variant="outline">{event.severity}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{event.description ?? formatDate(event.createdAt)}</p>
              </div>
            ))}
            {!eventsLoading && (securityEvents?.data ?? []).length === 0 && <EmptyState icon={<ShieldAlert className="h-12 w-12" />} title="No security events yet" description="Security events will appear here as they occur" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Allowed Uploads</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{filePolicy?.allowedExtensions.join(", ") ?? "Loading upload policy..."}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
