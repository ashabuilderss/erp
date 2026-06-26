"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/hooks/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Send, CheckCircle, FileText } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton-variants";

export default function EodReportsPage() {
  const qc = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role;
  const isMgmt = role === "OWNER" || role === "ADMIN" || role === "HR_MANAGER";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reportDate: "", accomplishments: "", challenges: "", tomorrowPlan: "" });

  const { data: reports, isLoading } = useQuery({
    queryKey: ["eod-reports", isMgmt ? "all" : "my"],
    queryFn: () => api.get<any[]>(isMgmt ? "/eod-reports" : "/eod-reports/my"),
  });

  const createReport = useMutation({
    mutationFn: () => api.post("/eod-reports", {
      reportDate: form.reportDate,
      accomplishments: form.accomplishments,
      challenges: form.challenges || undefined,
      tomorrowPlan: form.tomorrowPlan || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["eod-reports"] }); setShowForm(false); setForm({ reportDate: "", accomplishments: "", challenges: "", tomorrowPlan: "" }); },
  });

  const submitReport = useMutation({
    mutationFn: (id: string) => api.patch(`/eod-reports/${id}`, { status: "SUBMITTED" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["eod-reports"] }),
  });

  const reviewReport = useMutation({
    mutationFn: (id: string) => api.patch(`/eod-reports/${id}/review`, { status: "REVIEWED" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["eod-reports"] }),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">EOD Reports</h2>
          <p className="text-sm text-muted-foreground">End-of-day reports from your team</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" />New Report</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">New EOD Report</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><label className="text-sm font-medium">Date</label><input type="date" value={form.reportDate} onChange={(e) => setForm(p => ({ ...p, reportDate: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" /></div>
            <div><label className="text-sm font-medium">Accomplishments</label><Textarea value={form.accomplishments} onChange={(e) => setForm(p => ({ ...p, accomplishments: e.target.value }))} rows={3} placeholder="What did you accomplish today?" /></div>
            <div><label className="text-sm font-medium">Challenges (optional)</label><Textarea value={form.challenges} onChange={(e) => setForm(p => ({ ...p, challenges: e.target.value }))} rows={2} placeholder="Any blockers or issues?" /></div>
            <div><label className="text-sm font-medium">Tomorrow&apos;s Plan (optional)</label><Textarea value={form.tomorrowPlan} onChange={(e) => setForm(p => ({ ...p, tomorrowPlan: e.target.value }))} rows={2} placeholder="What is planned for tomorrow?" /></div>
            <Button onClick={() => createReport.mutate()} disabled={createReport.isPending}>{createReport.isPending ? "Saving..." : "Save Report"}</Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : reports?.length === 0 ? (
        <EmptyState icon={<FileText className="h-12 w-12" />} title="No EOD reports yet" description="End of day reports will appear here once submitted" />
      ) : (
        <div className="space-y-3">
          {reports?.map((r: { id: string; employee?: { employeeCode: string }; status: string; reportDate: string; accomplishments: string; challenges?: string; tomorrowPlan?: string }) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.employee?.employeeCode || "N/A"}</span>
                      <Badge variant={r.status === "REVIEWED" ? "default" : r.status === "SUBMITTED" ? "secondary" : "outline"}>{r.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(r.reportDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status === "DRAFT" && (
                      <Button size="sm" variant="outline" onClick={() => submitReport.mutate(r.id)} disabled={submitReport.isPending}>
                        <Send className="h-3 w-3 mr-1" />Submit
                      </Button>
                    )}
                    {isMgmt && r.status === "SUBMITTED" && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => reviewReport.mutate(r.id)} disabled={reviewReport.isPending}>
                        <CheckCircle className="h-3 w-3 mr-1" />Review
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium text-xs text-muted-foreground">Accomplishments:</span><p className="mt-0.5">{r.accomplishments}</p></div>
                  {r.challenges && <div><span className="font-medium text-xs text-muted-foreground">Challenges:</span><p className="mt-0.5">{r.challenges}</p></div>}
                  {r.tomorrowPlan && <div><span className="font-medium text-xs text-muted-foreground">Tomorrow:</span><p className="mt-0.5">{r.tomorrowPlan}</p></div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
