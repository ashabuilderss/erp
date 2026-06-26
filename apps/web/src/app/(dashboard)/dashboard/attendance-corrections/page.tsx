"use client";

import { useState } from "react";
import { useMyAttendanceCorrections, useAttendanceCorrections, useCreateAttendanceCorrection, useApproveCorrection, useRejectCorrection } from "@/hooks/api";
import { useCurrentUser } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Plus, CheckCircle2, XCircle } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton-variants";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

function EmployeeCorrectionsView() {
  const { showToast } = useToast();
  const { data: corrections, isLoading } = useMyAttendanceCorrections();
  const createMutation = useCreateAttendanceCorrection();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: "", reason: "", requestedCheckIn: "", requestedCheckOut: "", requestedStatus: "",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">My Attendance Corrections</h2>
          <p className="text-sm text-muted-foreground">Request corrections to your attendance records</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm({ date: "", reason: "", requestedCheckIn: "", requestedCheckOut: "", requestedStatus: "" }); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Request Correction</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Request Attendance Correction</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Reason *</label>
                <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Explain why you need this correction" />
              </div>
              <div>
                <label className="text-sm font-medium">Requested Check In</label>
                <Input type="time" value={form.requestedCheckIn} onChange={(e) => setForm({ ...form, requestedCheckIn: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Requested Check Out</label>
                <Input type="time" value={form.requestedCheckOut} onChange={(e) => setForm({ ...form, requestedCheckOut: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Requested Status</label>
                <Select value={form.requestedStatus || undefined} onValueChange={(v) => setForm({ ...form, requestedStatus: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="HALF_DAY">Half Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter showCloseButton>
              <Button onClick={() => {
                if (!form.date || !form.reason) { showToast("Date and reason are required", "error"); return; }
                createMutation.mutate({
                  date: new Date(form.date).toISOString(),
                  reason: form.reason,
                  requestedCheckIn: form.requestedCheckIn ? `${form.date}T${form.requestedCheckIn}:00.000Z` : undefined,
                  requestedCheckOut: form.requestedCheckOut ? `${form.date}T${form.requestedCheckOut}:00.000Z` : undefined,
                  requestedStatus: form.requestedStatus as any || undefined,
                }, {
                  onSuccess: () => { showToast("Correction requested"); setOpen(false); },
                  onError: (err: Error) => showToast(err.message || "Failed", "error"),
                });
              }} disabled={createMutation.isPending}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : corrections && corrections.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Reason</th>
                    <th className="pb-2 font-medium">Requested</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {corrections.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2">{format(new Date(c.date), "MMM dd, yyyy")}</td>
                      <td className="py-2 max-w-[200px] truncate">{c.reason}</td>
                      <td className="py-2">
                        {c.requestedCheckIn && <div>In: {format(new Date(c.requestedCheckIn), "HH:mm")}</div>}
                        {c.requestedCheckOut && <div>Out: {format(new Date(c.requestedCheckOut), "HH:mm")}</div>}
                        {c.requestedStatus && <Badge variant="outline" className="mt-1">{c.requestedStatus}</Badge>}
                      </td>
                      <td className="py-2"><Badge variant="outline" className={statusColors[c.status]}>{c.status}</Badge></td>
                      <td className="py-2 max-w-[150px] truncate text-muted-foreground">{c.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No correction requests</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminCorrectionsView() {
  const { showToast } = useToast();
  const { data, isLoading } = useAttendanceCorrections({});
  const approveMutation = useApproveCorrection();
  const rejectMutation = useRejectCorrection();
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Attendance Corrections</h2>
        <p className="text-sm text-muted-foreground">Review and manage attendance correction requests</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : data?.data && data.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Employee</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Reason</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">
                        {c.employee?.user ? `${c.employee.user.firstName} ${c.employee.user.lastName}` : c.employeeId}
                      </td>
                      <td className="py-2">{format(new Date(c.date), "MMM dd, yyyy")}</td>
                      <td className="py-2 max-w-[200px] truncate">{c.reason}</td>
                      <td className="py-2"><Badge variant="outline" className={statusColors[c.status]}>{c.status}</Badge></td>
                      <td className="py-2">
                        {c.status === "PENDING" && (
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon-sm" onClick={() => approveMutation.mutate({ id: c.id, notes }, {
                              onSuccess: () => showToast("Correction approved"),
                              onError: (err: Error) => showToast(err.message || "Failed", "error"),
                            })}><CheckCircle2 className="h-4 w-4 text-green-600" /></Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => rejectMutation.mutate({ id: c.id, notes }, {
                              onSuccess: () => showToast("Correction rejected"),
                              onError: (err: Error) => showToast(err.message || "Failed", "error"),
                            })}><XCircle className="h-4 w-4 text-red-600" /></Button>
                          </div>
                        )}
                        {c.status !== "PENDING" && c.notes && (
                          <span className="text-xs text-muted-foreground">{c.notes}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No correction requests</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AttendanceCorrectionsPage() {
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role;

  if (role === "EMPLOYEE") return <EmployeeCorrectionsView />;
  return <AdminCorrectionsView />;
}
