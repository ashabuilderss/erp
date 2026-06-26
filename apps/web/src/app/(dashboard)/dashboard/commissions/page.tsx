"use client";

import { useState, useMemo } from "react";
import { useCommissions, useCreateCommission, useUpdateCommissionStatus, useEmployees } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { FieldError } from "@/components/shared/field-error";
import { validateForm, clearFieldError } from "@/components/shared/form-validation";
import type { ValidationRules } from "@/components/shared/form-validation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Plus, Banknote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import type { PipelineCommission } from "@/lib/types";

const statusColor = (s: string) => {
  const map: Record<string, string> = { PENDING: "bg-yellow-100 text-yellow-800", APPROVED: "bg-blue-100 text-blue-800", PAID: "bg-green-100 text-green-800", CANCELLED: "bg-red-100 text-red-800" };
  return map[s] || "bg-gray-100 text-gray-800";
};

export default function CommissionsPage() {
  const [query, setQuery] = useState({ page: 1, limit: 20 });
  const { data, isLoading } = useCommissions(query);
  const createCommission = useCreateCommission();
  const updateStatus = useUpdateCommissionStatus();

  const { data: employeesData } = useEmployees({ limit: 100 });
  const employees = employeesData?.data ?? [];
  const employeeMap = useMemo(() => {
    const m: Record<string, string> = {};
    employees.forEach((e) => { m[e.id] = e.user ? `${e.user.firstName} ${e.user.lastName}` : e.employeeCode; });
    return m;
  }, [employees]);

  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", amount: "", percentage: "", notes: "" });
  const [errors, setErrors] = useState<Partial<Record<"employeeId" | "amount", string>>>({});

  const handleCreate = async () => {
    const rules: ValidationRules<{ employeeId: string; amount: string }> = {
      employeeId: { required: "Employee is required" },
      amount: { required: "Amount is required" },
    };
    const errs = validateForm(form, rules);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      await createCommission.mutateAsync({
        employeeId: form.employeeId,
        amount: parseFloat(form.amount),
        percentage: form.percentage ? parseFloat(form.percentage) : undefined,
        notes: form.notes || undefined,
      });
      setErrors({});
      setForm({ employeeId: "", amount: "", percentage: "", notes: "" });
      setOpen(false);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to create commission"), "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Pipeline Commissions</h2>
          <p className="text-sm text-muted-foreground">Track commissions from sales pipeline</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4 mr-1" />New Commission</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Commission</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Employee</Label>
                <Select value={form.employeeId || undefined} onValueChange={(v) => { setForm(p => ({ ...p, employeeId: v ?? '' })); clearFieldError("employeeId", setErrors); }}>
                  <SelectTrigger className={errors.employeeId ? "border-red-500" : ""}><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.employeeCode} — {emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : emp.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={errors.employeeId} />
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" value={form.amount} onChange={(e) => { setForm(p => ({ ...p, amount: e.target.value })); clearFieldError("amount", setErrors); }} className={errors.amount ? "border-red-500" : ""} placeholder="0.00" />
                <FieldError error={errors.amount} />
              </div>
              <div>
                <Label>Percentage (optional)</Label>
                <Input type="number" value={form.percentage} onChange={(e) => setForm(p => ({ ...p, percentage: e.target.value }))} placeholder="e.g. 5" />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Input value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Commission notes" />
              </div>
              <Button onClick={handleCreate} disabled={createCommission.isPending} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Employee</th>
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Percentage</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Created</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="p-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={6} className="p-6"><EmptyState icon={<Banknote className="h-12 w-12" />} title="No commissions yet" description="Commissions will appear here once calculated" /></td></tr>
              ) : (
                data?.data?.map((c: PipelineCommission) => (
                  <tr key={c.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{employeeMap[c.employeeId] || c.employeeId.slice(0, 8)}</td>
                    <td className="p-3 font-medium">₹{Number(c.amount).toLocaleString()}</td>
                    <td className="p-3">{c.percentage ? `${c.percentage}%` : "-"}</td>
                    <td className="p-3"><Badge variant="outline" className={statusColor(c.status)}>{c.status}</Badge></td>
                    <td className="p-3 text-muted-foreground">{format(new Date(c.createdAt), "MMM dd, yyyy")}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                         {(c.status === "PENDING") && (
                          <Button size="xs" variant="outline" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: c.id, status: "APPROVED" }, { onError: (err) => showToast(getApiErrorMessage(err, "Failed to approve"), "error") })}>Approve</Button>
                        )}
                        {c.status === "APPROVED" && (
                          <Button size="xs" variant="outline" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: c.id, status: "PAID" }, { onError: (err) => showToast(getApiErrorMessage(err, "Failed to mark paid"), "error") })}>Mark Paid</Button>
                        )}
                        {(c.status === "PENDING" || c.status === "APPROVED") && (
                          <Button size="xs" variant="ghost" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: c.id, status: "CANCELLED" }, { onError: (err) => showToast(getApiErrorMessage(err, "Failed to cancel"), "error") })}>Cancel</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
