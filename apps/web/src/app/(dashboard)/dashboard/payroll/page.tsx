"use client";

import { useState } from "react";
import { usePayrollRuns, usePayrollRun, useCreatePayrollRun, useProcessPayrollRun, usePayPayrollRun, useCancelPayrollRun, useMyPayslips } from "@/hooks/api";
import { useCurrentUser } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Plus, Play, CircleDollarSign, XCircle, Eye, DollarSign } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/skeleton-variants";

const runStatusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  PAID: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

function EmployeePayrollView() {
  const { data: payslips, isLoading } = useMyPayslips();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">My Payslips</h2>
        <p className="text-sm text-muted-foreground">View your payslip history</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : payslips && payslips.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Period</th>
                    <th className="pb-2 font-medium">Basic</th>
                    <th className="pb-2 font-medium">Gross</th>
                    <th className="pb-2 font-medium">Deductions</th>
                    <th className="pb-2 font-medium">Net Pay</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2">
                        {p.payrollRun ? `${format(new Date(p.payrollRun.periodStart), "MMM dd")} - ${format(new Date(p.payrollRun.periodEnd), "MMM dd, yyyy")}` : "-"}
                      </td>
                      <td className="py-2">₹{Number(p.basicSalary).toLocaleString()}</td>
                      <td className="py-2">₹{Number(p.grossPay).toLocaleString()}</td>
                      <td className="py-2 text-red-600">₹{Number(p.totalDeductions).toLocaleString()}</td>
                      <td className="py-2 font-semibold">₹{Number(p.netPay).toLocaleString()}</td>
                      <td className="py-2"><Badge variant="outline" className={runStatusColors[p.status]}>{p.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={<DollarSign className="h-12 w-12" />} title="No payslips yet" description="Payslips will appear here once generated" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminPayrollView() {
  const { showToast } = useToast();
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const { data, isLoading } = usePayrollRuns(query);
  const createMutation = useCreatePayrollRun();
  const processMutation = useProcessPayrollRun();
  const payMutation = usePayPayrollRun();
  const cancelMutation = useCancelPayrollRun();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ periodStart: "", periodEnd: "", notes: "" });
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const { data: runDetail } = usePayrollRun(selectedRun || "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Payroll</h2>
          <p className="text-sm text-muted-foreground">Manage payroll runs and payslips</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setForm({ periodStart: "", periodEnd: "", notes: "" }); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> New Payroll Run</DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Create Payroll Run</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-sm font-medium">Period Start *</label><Input type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Period End *</label><Input type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Notes</label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter showCloseButton>
              <Button onClick={() => {
                if (!form.periodStart || !form.periodEnd) return;
                createMutation.mutate({
                  periodStart: new Date(form.periodStart).toISOString(),
                  periodEnd: new Date(form.periodEnd).toISOString(),
                  notes: form.notes || undefined,
                }, {
                  onSuccess: () => { showToast("Payroll run created"); setCreateOpen(false); },
                  onError: (err: Error) => showToast(err.message || "Failed", "error"),
                });
              }} disabled={createMutation.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : data?.data && data.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Period</th>
                    <th className="pb-2 font-medium">Employees</th>
                    <th className="pb-2 font-medium">Total Net Pay</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((run) => (
                    <tr key={run.id} className="border-b last:border-0">
                      <td className="py-2">{format(new Date(run.periodStart), "MMM dd")} - {format(new Date(run.periodEnd), "MMM dd, yyyy")}</td>
                      <td className="py-2">{run.employeeCount ?? run._count?.payslips ?? "-"}</td>
                      <td className="py-2 font-medium">{run.totalNetPay ? `₹${Number(run.totalNetPay).toLocaleString()}` : "-"}</td>
                      <td className="py-2"><Badge variant="outline" className={runStatusColors[run.status]}>{run.status}</Badge></td>
                      <td className="py-2">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => setSelectedRun(selectedRun === run.id ? null : run.id)}><Eye className="h-4 w-4" /></Button>
                          {run.status === "DRAFT" && (
                            <Button variant="ghost" size="icon-sm" onClick={() => processMutation.mutate(run.id, {
                              onSuccess: () => showToast("Payroll processed"),
                              onError: (err: Error) => showToast(err.message || "Failed", "error"),
                            })}><Play className="h-4 w-4 text-blue-600" /></Button>
                          )}
                          {run.status === "COMPLETED" && (
                            <Button variant="ghost" size="icon-sm" onClick={() => payMutation.mutate(run.id, {
                              onSuccess: () => showToast("Marked as paid"),
                              onError: (err: Error) => showToast(err.message || "Failed", "error"),
                            })}><CircleDollarSign className="h-4 w-4 text-green-600" /></Button>
                          )}
                          {(run.status === "DRAFT" || run.status === "COMPLETED") && (
                            <Button variant="ghost" size="icon-sm" onClick={() => setConfirmCancel(run.id)}><XCircle className="h-4 w-4 text-red-600" /></Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={<DollarSign className="h-12 w-12" />} title="No payroll runs yet" description="Payroll runs will appear here once processed" />
          )}
        </CardContent>
      </Card>

      {selectedRun && runDetail && (
        <Card>
          <CardHeader>
            <CardTitle>
              Payslips - {format(new Date(runDetail.periodStart), "MMM dd")} to {format(new Date(runDetail.periodEnd), "MMM dd, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {runDetail.payslips && runDetail.payslips.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Employee</th>
                      <th className="pb-2 font-medium">Basic</th>
                      <th className="pb-2 font-medium">Gross</th>
                      <th className="pb-2 font-medium">Deductions</th>
                      <th className="pb-2 font-medium">Net Pay</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runDetail.payslips.map((ps) => (
                      <tr key={ps.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">
                          {ps.employee?.user ? `${ps.employee.user.firstName} ${ps.employee.user.lastName}` : ps.employeeId}
                        </td>
                        <td className="py-2">₹{Number(ps.basicSalary).toLocaleString()}</td>
                        <td className="py-2">₹{Number(ps.grossPay).toLocaleString()}</td>
                        <td className="py-2 text-red-600">₹{Number(ps.totalDeductions).toLocaleString()}</td>
                        <td className="py-2 font-semibold">₹{Number(ps.netPay).toLocaleString()}</td>
                        <td className="py-2"><Badge variant="outline" className={runStatusColors[ps.status]}>{ps.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={<DollarSign className="h-12 w-12" />} title="No payslips generated yet" description="Generate payslips to view them here" />
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!confirmCancel}
        onOpenChange={(o) => { if (!o) setConfirmCancel(null); }}
        title="Cancel Payroll Run"
        variant="destructive"
        onConfirm={() => {
          if (confirmCancel) {
            cancelMutation.mutate(confirmCancel, {
              onSuccess: () => showToast("Payroll run cancelled"),
              onError: (err: Error) => showToast(err.message || "Failed", "error"),
            });
          }
          setConfirmCancel(null);
        }}
        loading={cancelMutation.isPending}
      >
        Cancel this payroll run?
      </ConfirmDialog>
    </div>
  );
}

export default function PayrollPage() {
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role;

  if (role === "EMPLOYEE") return <EmployeePayrollView />;
  return <AdminPayrollView />;
}
