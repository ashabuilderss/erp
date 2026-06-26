"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertTriangle, Plus, Trash2, CheckCircle } from "lucide-react";

const TRIGGER_LABELS: Record<string, string> = {
  LEAD_STALE: "Stale Lead",
  ATTENDANCE_MISSED: "Missed Attendance",
  LEAVE_PENDING: "Pending Leave > X Days",
  APPROVAL_PENDING: "Pending Approval",
  TASK_OVERDUE: "Overdue Task",
};

export default function EscalationPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"rules" | "events">("rules");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", triggerType: "LEAD_STALE", level: "1", notifyRoles: "", configDays: "3" });

  const { data: rules } = useQuery({
    queryKey: ["escalation-rules"],
    queryFn: () => api.get<any[]>("/escalation-rules"),
  });

  const { data: events } = useQuery({
    queryKey: ["escalation-events"],
    queryFn: () => api.get<any[]>("/escalation-events"),
  });

  const createRule = useMutation({
    mutationFn: () => api.post("/escalation-rules", {
      name: form.name,
      triggerType: form.triggerType,
      level: parseInt(form.level),
      notifyRoles: form.notifyRoles.split(",").map(s => s.trim()).filter(Boolean),
      config: { staleDays: parseInt(form.configDays) },
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["escalation-rules"] }); setShowForm(false); },
  });

  const deleteRule = useMutation({
    mutationFn: (id: string) => api.delete(`/escalation-rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["escalation-rules"] }),
  });

  const resolveEvent = useMutation({
    mutationFn: (id: string) => api.patch(`/escalation-events/${id}/resolve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["escalation-events"] }),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Escalation Matrix</h2>
          <p className="text-sm text-muted-foreground">Define escalation rules and monitor events</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "rules" ? "default" : "outline"} onClick={() => setTab("rules")}>Rules</Button>
        <Button variant={tab === "events" ? "default" : "outline"} onClick={() => setTab("events")}>
          Events
          {events && events.filter((e: { status: string }) => e.status === "TRIGGERED").length > 0 && (
            <Badge variant="destructive" className="ml-2">{events.filter((e: { status: string }) => e.status === "TRIGGERED").length}</Badge>
          )}
        </Button>
      </div>

      {tab === "rules" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" />Add Rule</Button>
          </div>

          {showForm && (
            <Card>
              <CardHeader><CardTitle className="text-lg">New Escalation Rule</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium">Name</label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><label className="text-sm font-medium">Trigger</label>
                    <Select value={form.triggerType} onValueChange={(v) => setForm(p => ({ ...p, triggerType: v || "LEAD_STALE" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(TRIGGER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium">Level</label>
                    <Select value={form.level} onValueChange={(v) => setForm(p => ({ ...p, level: v || "1" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="1">Level 1</SelectItem><SelectItem value="2">Level 2</SelectItem><SelectItem value="3">Level 3</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><label className="text-sm font-medium">Stale Days</label><Input type="number" value={form.configDays} onChange={(e) => setForm(p => ({ ...p, configDays: e.target.value }))} /></div>
                </div>
                <div><label className="text-sm font-medium">Notify Roles (comma-separated)</label><Input value={form.notifyRoles} onChange={(e) => setForm(p => ({ ...p, notifyRoles: e.target.value }))} placeholder="OWNER, ADMIN" /></div>
                <Button onClick={() => createRule.mutate()} disabled={createRule.isPending}>Save Rule</Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {rules?.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><AlertTriangle className="h-12 w-12 mb-3" /><p className="font-medium">No escalation rules defined</p></CardContent></Card>
            ) : (
              rules?.map((r: { id: string; name: string; triggerType: string; level: number; isActive: boolean; notifyRoles?: string[] }) => (
                <Card key={r.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-sm">L{r.level}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{r.name}</span>
                          <Badge variant="outline">{TRIGGER_LABELS[r.triggerType] || r.triggerType}</Badge>
                          {r.isActive ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Notifies: {r.notifyRoles?.join(", ")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => deleteRule.mutate(r.id)} disabled={deleteRule.isPending}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {tab === "events" && (
        <div className="space-y-2">
          {events?.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><CheckCircle className="h-12 w-12 mb-3" /><p className="font-medium">No escalation events</p></CardContent></Card>
          ) : (
            events?.map((e: { id: string; rule?: { name: string; level: number }; status: string; entityType: string; entityId: string; triggeredAt: string }) => (
              <Card key={e.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{e.rule?.name || "Unknown Rule"}</span>
                      <Badge variant={e.status === "TRIGGERED" ? "destructive" : e.status === "ACKNOWLEDGED" ? "secondary" : "default"}>{e.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Entity: {e.entityType}#{e.entityId.slice(0, 8)}</span>
                      <span>Level {e.rule?.level || "?"}</span>
                      <span>{new Date(e.triggeredAt).toLocaleString()}</span>
                    </div>
                  </div>
                  {e.status === "TRIGGERED" && (
                    <Button size="sm" variant="outline" className="text-green-600" onClick={() => resolveEvent.mutate(e.id)} disabled={resolveEvent.isPending}>
                      <CheckCircle className="h-4 w-4 mr-1" />Resolve
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
