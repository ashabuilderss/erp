"use client";

import { useState } from "react";
import {
  useCurrentUser,
  useUpload,
  useEodReports,
  useCreateEodReport,
  useSubmitEodReport,
  useReviewEodReport,
} from "@/hooks/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Send, CheckCircle, FileText, ImagePlus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton-variants";

export default function EodReportsPage() {
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role;
  const isMgmt = role === "OWNER" || role === "ADMIN" || role === "HR_MANAGER" || role === "MANAGER";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reportDate: "", accomplishments: "", challenges: "", tomorrowPlan: "", photoUrls: [] as string[] });
  const { uploadGeneral, uploading: uploadLoading } = useUpload();

  const { data: reports, isLoading } = useEodReports(isMgmt);
  const createReport = useCreateEodReport();
  const submitReport = useSubmitEodReport();
  const reviewReport = useReviewEodReport();

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
            <div>
              <label className="text-sm font-medium">Photos (optional)</label>
              <div className="mt-1.5">
                <label className="flex items-center justify-center gap-2 h-20 rounded-md border border-dashed border-input bg-transparent text-sm text-muted-foreground cursor-pointer hover:bg-accent/50 transition-colors">
                  <ImagePlus className="h-4 w-4" />
                  {uploadLoading ? "Uploading..." : "Add photos"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploadLoading}
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files) return;
                      for (const file of Array.from(files)) {
                        try {
                          const result = await uploadGeneral(file);
                          setForm(p => ({ ...p, photoUrls: [...p.photoUrls, result.url] }));
                        } catch {
                          // silently skip failed uploads
                        }
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {form.photoUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.photoUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="h-16 w-16 rounded-md object-cover border" />
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, photoUrls: p.photoUrls.filter((_, j) => j !== i) }))}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={() =>
                createReport.mutate(
                  {
                    reportDate: form.reportDate,
                    accomplishments: form.accomplishments,
                    challenges: form.challenges || undefined,
                    tomorrowPlan: form.tomorrowPlan || undefined,
                    photoUrls: form.photoUrls.length > 0 ? form.photoUrls : undefined,
                  },
                  {
                    onSuccess: () => {
                      setShowForm(false);
                      setForm({ reportDate: "", accomplishments: "", challenges: "", tomorrowPlan: "", photoUrls: [] });
                    },
                  }
                )
              }
              disabled={createReport.isPending}
            >
              {createReport.isPending ? "Saving..." : "Save Report"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : reports?.length === 0 ? (
        <EmptyState icon={<FileText className="h-12 w-12" />} title="No EOD reports yet" description="End of day reports will appear here once submitted" />
      ) : (
        <div className="space-y-3">
          {reports?.map((r: { id: string; employee?: { employeeCode: string }; status: string; reportDate: string; accomplishments: string; challenges?: string; tomorrowPlan?: string; photoUrls?: string[] }) => (
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
                  {r.photoUrls && r.photoUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(r.photoUrls as string[]).map((url: string, i: number) => (
                        <img key={i} src={url} alt="Report photo" className="h-16 w-16 rounded-md object-cover border" />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
