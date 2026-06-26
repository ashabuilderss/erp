"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useLeaveAllocations,
  useCreateLeaveAllocation,
  useUpdateLeaveAllocation,
  useDeleteLeaveAllocation,
  useEmployees,
} from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { FieldError } from "@/components/shared/field-error";
import { validateForm, clearFieldError } from "@/components/shared/form-validation";
import type { ValidationRules } from "@/components/shared/form-validation";
import type { CreateLeaveAllocationDto, LeaveAllocation, UpdateLeaveAllocationDto } from "@/lib/types";

type LeaveAllocationForm = Partial<CreateLeaveAllocationDto> &
  Pick<Partial<LeaveAllocation>, "id" | "usedDays">;

const typeColors: Record<string, string> = {
  SICK: "bg-red-100 text-red-800", CASUAL: "bg-blue-100 text-blue-800",
  ANNUAL: "bg-green-100 text-green-800", OTHER: "bg-gray-100 text-gray-800",
};

export default function LeaveAllocationsPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const, search: "" });
  const { data, isLoading } = useLeaveAllocations(query);
  const createMutation = useCreateLeaveAllocation();
  const updateMutation = useUpdateLeaveAllocation();
  const deleteMutation = useDeleteLeaveAllocation();
  const { showToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<LeaveAllocation | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { data: empData } = useEmployees({ limit: 200 });
  const employees = empData?.data || [];
  const [form, setForm] = useState<LeaveAllocationForm>({});
  const [errors, setErrors] = useState<Partial<Record<"employeeId" | "leaveType" | "totalDays", string>>>({});

  const resetForm = () => setForm({ employeeId: "", year: new Date().getFullYear(), leaveType: "SICK", totalDays: 0 });

  const columns: ColumnDef<LeaveAllocation>[] = [
    { accessorKey: "employee", header: "Employee", cell: ({ row }) => (
      <span className="font-medium">{row.original.employee?.user ? `${row.original.employee.user.firstName} ${row.original.employee.user.lastName}` : row.original.employeeId}</span>
    )},
    { accessorKey: "year", header: "Year" },
    { accessorKey: "leaveType", header: "Type", cell: ({ row }) => <Badge variant="outline" className={typeColors[row.original.leaveType]}>{row.original.leaveType}</Badge> },
    { accessorKey: "totalDays", header: "Total Days" },
    { accessorKey: "usedDays", header: "Used" },
    { accessorKey: "remaining", header: "Remaining", cell: ({ row }) => {
      const remaining = row.original.totalDays - row.original.usedDays;
      return <span className={remaining <= 0 ? "text-destructive font-medium" : "text-green-600 font-medium"}>{remaining}</span>;
    }},
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm(row.original); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(row.original.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Leave Allocations</h2><p className="text-sm text-muted-foreground">Manage annual leave balances per employee</p></div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Allocation</DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Add Leave Allocation</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-sm font-medium">Employee</label><Select value={form.employeeId || ""} onValueChange={(v) => { setForm({ ...form, employeeId: v } as LeaveAllocationForm); clearFieldError("employeeId", setErrors); }}><SelectTrigger className={errors.employeeId ? "border-red-500" : ""}><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.employeeCode} - {e.user ? `${e.user.firstName} ${e.user.lastName}` : e.id}</SelectItem>)}</SelectContent></Select><FieldError error={errors.employeeId} /></div>
              <div><label className="text-sm font-medium">Year</label><Input type="number" value={form.year || new Date().getFullYear()} onChange={(e) => setForm({ ...form, year: Number(e.target.value) } as LeaveAllocationForm)} /></div>
              <div><label className="text-sm font-medium">Leave Type</label><Select value={form.leaveType || "SICK"} onValueChange={(v) => { setForm({ ...form, leaveType: v } as LeaveAllocationForm); clearFieldError("leaveType", setErrors); }}><SelectTrigger className={errors.leaveType ? "border-red-500" : ""}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SICK">Sick</SelectItem><SelectItem value="CASUAL">Casual</SelectItem><SelectItem value="ANNUAL">Annual</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select><FieldError error={errors.leaveType} /></div>
              <div><label className="text-sm font-medium">Total Days</label><Input type="number" min={0} value={form.totalDays || 0} onChange={(e) => { setForm({ ...form, totalDays: Number(e.target.value) } as LeaveAllocationForm); clearFieldError("totalDays", setErrors); }} className={errors.totalDays ? "border-red-500" : ""} /><FieldError error={errors.totalDays} /></div>
            </div>
            <DialogFooter showCloseButton>
              <Button onClick={() => { const rules: ValidationRules<CreateLeaveAllocationDto> = { employeeId: { required: "Employee is required" }, leaveType: { required: "Leave type is required" }, totalDays: { required: "Total days is required" } }; const errs = validateForm(form, rules); setErrors(errs); if (Object.keys(errs).length > 0) return; createMutation.mutate({ employeeId: form.employeeId!, year: form.year, leaveType: form.leaveType!, totalDays: form.totalDays! } as CreateLeaveAllocationDto, { onSuccess: () => { setErrors({}); showToast("Allocation created"); setCreateOpen(false); resetForm(); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create"), "error") }); }} disabled={createMutation.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="leave-allocations" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Allocation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Total Days</label><Input type="number" min={0} value={form.totalDays || 0} onChange={(e) => setForm({ ...form, totalDays: Number(e.target.value) } as LeaveAllocationForm)} /></div>
            <div><label className="text-sm font-medium">Used Days</label><Input type="number" min={0} value={form.usedDays || 0} onChange={(e) => setForm({ ...form, usedDays: Number(e.target.value) } as LeaveAllocationForm)} /></div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={() => { if (editItem) { const rules: ValidationRules<Partial<CreateLeaveAllocationDto>> = { totalDays: { required: "Total days is required" } }; const errs = validateForm(form, rules); setErrors(errs); if (Object.keys(errs).length > 0) return; updateMutation.mutate({ id: editItem.id, dto: { totalDays: form.totalDays! } }, { onSuccess: () => { setErrors({}); showToast("Allocation updated"); setEditItem(null); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update"), "error") }); } }} disabled={updateMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="Delete Allocation"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) {
            deleteMutation.mutate(confirmDelete, { onSuccess: () => showToast("Allocation deleted"), onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete"), "error") });
          }
          setConfirmDelete(null);
        }}
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this allocation?
      </ConfirmDialog>
    </div>
  );
}
