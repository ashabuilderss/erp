"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { Building2, Banknote, Calendar, Plus, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

const METHOD_LABELS: Record<string, string> = { CASH: "Cash", CHEQUE: "Cheque", ONLINE: "Online", BANK_TRANSFER: "Bank Transfer" };

export default function PaymentsPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [entryForm, setEntryForm] = useState({ amount: "", method: "CASH", reference: "", paymentDate: "", notes: "" });
  const [scheduleForm, setScheduleForm] = useState({ installmentNumber: "1", amount: "", dueDate: "" });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => api.get<any[]>("/bookings"),
  });

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ["payment-schedules", selectedId],
    queryFn: () => api.get<any[]>(`/payment-schedules/booking/${selectedId}`),
    enabled: !!selectedId,
  });

  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ["payment-entries", selectedId],
    queryFn: () => api.get<any[]>(`/payment-entries/booking/${selectedId}`),
    enabled: !!selectedId,
  });

  const { showToast } = useToast();

  const addEntry = useMutation({
    mutationFn: () => api.post(`/payment-entries/booking/${selectedId}`, {
      amount: parseFloat(entryForm.amount),
      method: entryForm.method,
      reference: entryForm.reference || undefined,
      paymentDate: entryForm.paymentDate,
      notes: entryForm.notes || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payment-entries"] }); qc.invalidateQueries({ queryKey: ["bookings"] }); setShowEntryForm(false); setEntryForm({ amount: "", method: "CASH", reference: "", paymentDate: "", notes: "" }); showToast("Payment recorded"); },
    onError: (err) => showToast(getApiErrorMessage(err, "Failed to record payment"), "error"),
  });

  const addSchedule = useMutation({
    mutationFn: () => api.post(`/payment-schedules/booking/${selectedId}`, {
      installmentNumber: parseInt(scheduleForm.installmentNumber),
      amount: parseFloat(scheduleForm.amount),
      dueDate: scheduleForm.dueDate,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payment-schedules"] }); setShowScheduleForm(false); setScheduleForm({ installmentNumber: "1", amount: "", dueDate: "" }); showToast("Installment added"); },
    onError: (err) => showToast(getApiErrorMessage(err, "Failed to add installment"), "error"),
  });

  const raw = bookingsData as { data?: any[] } | any[] | undefined;
  const bookings = Array.isArray(raw) ? raw : (raw?.data ?? []);

  const selected = bookings.find((b: { id: string }) => b.id === selectedId);

  const totalPaid = entries?.reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0) ?? 0;
  const totalScheduled = schedules?.reduce((sum: number, s: { amount: number }) => sum + Number(s.amount), 0) ?? 0;
  const hasEntries = entries && entries.length > 0;
  const hasSchedules = schedules && schedules.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Payments</h2>
          <p className="text-sm text-muted-foreground">Track payment schedules and collections</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Banknote className="h-5 w-5" />Bookings</CardTitle></CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto divide-y">
            {bookingsLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />)}
              </div>
            ) : bookings.length === 0 ? (
              <EmptyState icon={<Banknote className="h-12 w-12" />} title="No bookings found" description="Payments from bookings will appear here" />
            ) : (
              bookings.map((b: { id: string; customer?: { name: string }; paymentStatus: string; property?: { title: string }; amount: number }) => (
                <button key={b.id} onClick={() => setSelectedId(b.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${selectedId === b.id ? "bg-muted" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{b.customer?.name || "N/A"}</span>
                    <Badge variant="outline">{b.paymentStatus}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{b.property?.title || "N/A"}</span>
                    <span className="text-xs font-medium">₹{Number(b.amount).toLocaleString()}</span>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!selectedId ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Banknote className="h-12 w-12 mb-3" /><p className="font-medium">Select a booking</p></CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">
                    {selected?.customer?.name}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      {selected?.property?.title} — ₹{Number(selected?.amount).toLocaleString()}
                    </span>
                  </CardTitle>
                  <Badge>{selected?.paymentStatus}</Badge>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Total Scheduled</p><p className="text-lg font-semibold">₹{totalScheduled.toLocaleString()}</p></div>
                  <div><p className="text-sm text-muted-foreground">Total Collected</p><p className="text-lg font-semibold">₹{totalPaid.toLocaleString()}</p></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Installment Schedule</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setShowScheduleForm(!showScheduleForm)}><Plus className="h-4 w-4 mr-1" />Add</Button>
                </CardHeader>
                <CardContent>
                  {showScheduleForm && (
                    <div className="flex items-end gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                      <div><label className="text-xs">#</label><Input size={1} value={scheduleForm.installmentNumber} onChange={(e) => setScheduleForm(p => ({ ...p, installmentNumber: e.target.value }))} className="w-16" /></div>
                       <div><label className="text-xs">Amount *</label><Input type="number" value={scheduleForm.amount} onChange={(e) => setScheduleForm(p => ({ ...p, amount: e.target.value }))} className="w-28" placeholder="0.00" /></div>
                      <div><label className="text-xs">Due Date</label><Input type="date" value={scheduleForm.dueDate} onChange={(e) => setScheduleForm(p => ({ ...p, dueDate: e.target.value }))} className="w-36" /></div>
                      <Button size="sm" onClick={() => { if (!scheduleForm.amount || !scheduleForm.dueDate) { showToast("Amount and due date are required", "error"); return; } addSchedule.mutate(); }} disabled={addSchedule.isPending}>Save</Button>
                    </div>
                  )}
                   {schedulesLoading ? (
                    <div className="space-y-2 py-4">
                      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />)}
                    </div>
                  ) : !hasSchedules ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No installments set up</p>
                  ) : (
                    <div className="space-y-2">
                      {schedules?.map((s: { id: string; installmentNumber: number; amount: number; dueDate: string; status: string }) => (
                        <div key={s.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">#{s.installmentNumber}</span>
                            <span className="text-sm">₹{Number(s.amount).toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(s.dueDate).toLocaleDateString()}</span>
                          </div>
                          <Badge variant={s.status === "PAID" ? "default" : s.status === "OVERDUE" ? "destructive" : "secondary"}>{s.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Payment History</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setShowEntryForm(!showEntryForm)}><Plus className="h-4 w-4 mr-1" />Record</Button>
                </CardHeader>
                <CardContent>
                  {showEntryForm && (
                    <div className="grid grid-cols-5 gap-2 mb-4 p-3 bg-muted/50 rounded-lg items-end">
                       <div><label className="text-xs">Amount *</label><Input type="number" value={entryForm.amount} onChange={(e) => setEntryForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" /></div>
                      <div>
                        <label className="text-xs">Method</label>
                  <Select value={entryForm.method} onValueChange={(v) => setEntryForm(p => ({ ...p, method: v || "CASH" }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(METHOD_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><label className="text-xs">Reference</label><Input value={entryForm.reference} onChange={(e) => setEntryForm(p => ({ ...p, reference: e.target.value }))} /></div>
                      <div><label className="text-xs">Date *</label><Input type="date" value={entryForm.paymentDate} onChange={(e) => setEntryForm(p => ({ ...p, paymentDate: e.target.value }))} /></div>
                      <Button size="sm" onClick={() => { if (!entryForm.amount || !entryForm.paymentDate) { showToast("Amount and date are required", "error"); return; } addEntry.mutate(); }} disabled={addEntry.isPending}>Save</Button>
                    </div>
                  )}
                   {entriesLoading ? (
                    <div className="space-y-2 py-4">
                      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />)}
                    </div>
                  ) : !hasEntries ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No payments recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {entries?.map((e: { id: string; amount: number; method: string; reference?: string; paymentDate: string }) => (
                        <div key={e.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                          <div>
                            <p className="text-sm font-medium">₹{Number(e.amount).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{METHOD_LABELS[e.method] || e.method}{e.reference ? ` — ${e.reference}` : ""}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(e.paymentDate).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
