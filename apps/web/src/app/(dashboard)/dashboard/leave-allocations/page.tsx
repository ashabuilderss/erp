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
import {
  useLeaveAllocations,
  useCreateLeaveAllocation,
  useUpdateLeaveAllocation,
  useDeleteLeaveAllocation,
  useEmployees,
} from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
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
  const { data: empData } = useEmployees({ limit: 200 });
  const employees = empData?.data || [];
  const [form, setForm] = useState<LeaveAllocationForm>({});

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
        <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Delete this allocation?")) deleteMutation.mutate(row.original.id, { onSuccess: () => showToast("Allocation deleted"), onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete"), "error") }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
              <div><label className="text-sm font-medium">Employee</label><Select value={form.employeeId || ""} onValueChange={(v) => setForm({ ...form, employeeId: v } as LeaveAllocationForm)}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.employeeCode} - {e.user ? `${e.user.firstName} ${e.user.lastName}` : e.id}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium">Year</label><Input type="number" value={form.year || new Date().getFullYear()} onChange={(e) => setForm({ ...form, year: Number(e.target.value) } as LeaveAllocationForm)} /></div>
              <div><label className="text-sm font-medium">Leave Type</label><Select value={form.leaveType || "SICK"} onValueChange={(v) => setForm({ ...form, leaveType: v } as LeaveAllocationForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SICK">Sick</SelectItem><SelectItem value="CASUAL">Casual</SelectItem><SelectItem value="ANNUAL">Annual</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select></div>
              <div><label className="text-sm font-medium">Total Days</label><Input type="number" min={0} value={form.totalDays || 0} onChange={(e) => setForm({ ...form, totalDays: Number(e.target.value) } as LeaveAllocationForm)} /></div>
            </div>
            <DialogFooter showCloseButton>
              <Button onClick={() => { if (!form.employeeId || !form.totalDays) { showToast("Please fill Employee ID and Total Days", "error"); return; } createMutation.mutate(form as CreateLeaveAllocationDto, { onSuccess: () => { showToast("Allocation created"); setCreateOpen(false); resetForm(); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create"), "error") }); }} disabled={createMutation.isPending}>Save</Button>
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
            <Button onClick={() => { if (editItem) { updateMutation.mutate({ id: editItem.id, dto: form as UpdateLeaveAllocationDto }, { onSuccess: () => { showToast("Allocation updated"); setEditItem(null); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update"), "error") }); } }} disabled={updateMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
