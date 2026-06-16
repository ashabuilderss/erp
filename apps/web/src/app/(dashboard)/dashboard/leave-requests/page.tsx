"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useLeaveRequests, useCreateLeaveRequest, useUpdateLeaveRequest, useApproveLeaveRequest, useDeleteLeaveRequest, useEmployees } from "@/hooks/api";
import { useCurrentUser } from "@/hooks/api";
import type { CreateLeaveRequestDto, LeaveRequest, LeaveStatus, LeaveType, UpdateLeaveRequestDto } from "@/lib/types";
import { format } from "date-fns";

type LeaveRequestForm = Partial<LeaveRequest> & {
  startDate?: string;
  endDate?: string;
  status?: LeaveStatus;
  type?: LeaveType;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800", APPROVED: "bg-green-100 text-green-800", REJECTED: "bg-red-100 text-red-800",
};

const typeColors: Record<string, string> = {
  SICK: "bg-red-100 text-red-800", CASUAL: "bg-blue-100 text-blue-800", ANNUAL: "bg-green-100 text-green-800", OTHER: "bg-gray-100 text-gray-800",
};

export default function LeaveRequestsPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const, search: "" });
  const { data, isLoading } = useLeaveRequests(query);
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role || "EMPLOYEE";
  const canApprove = role === "ADMIN" || role === "HR_MANAGER";
  const { data: empData } = useEmployees({ limit: 200 });
  const employees = empData?.data || [];
  const createMutation = useCreateLeaveRequest();
  const updateMutation = useUpdateLeaveRequest();
  const approveMutation = useApproveLeaveRequest();
  const deleteMutation = useDeleteLeaveRequest();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<LeaveRequest | null>(null);
  const [form, setForm] = useState<LeaveRequestForm>({});

  const resetForm = () => setForm({ employeeId: "", startDate: "", endDate: "", type: "SICK", reason: "" });

  const columns: ColumnDef<LeaveRequest>[] = [
    { accessorKey: "employee", header: "Employee", cell: ({ row }) => <span className="font-medium">{row.original.employee?.employeeCode || row.original.employeeId}</span> },
    { accessorKey: "type", header: "Type", cell: ({ row }) => <Badge variant="outline" className={typeColors[row.original.type]}>{row.original.type}</Badge> },
    { accessorKey: "startDate", header: "Start", cell: ({ row }) => <span>{format(new Date(row.original.startDate), "MMM dd")}</span> },
    { accessorKey: "endDate", header: "End", cell: ({ row }) => <span>{format(new Date(row.original.endDate), "MMM dd")}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="outline" className={statusColors[row.original.status]}>{row.original.status}</Badge> },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {canApprove && row.original.status === "PENDING" && <>
          <Button variant="ghost" size="icon-sm" onClick={() => approveMutation.mutate({ id: row.original.id, dto: { status: "APPROVED" } })}><Check className="h-4 w-4 text-green-600" /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => approveMutation.mutate({ id: row.original.id, dto: { status: "REJECTED" } })}><X className="h-4 w-4 text-red-600" /></Button>
        </>}
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ ...row.original, startDate: row.original.startDate.slice(0, 10), endDate: row.original.endDate.slice(0, 10) }); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Delete this request?")) deleteMutation.mutate(row.original.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Leave Requests</h2><p className="text-sm text-muted-foreground">Manage employee leave requests</p></div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Leave Request</DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Add Leave Request</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-sm font-medium">Employee</label><Select value={form.employeeId || ""} onValueChange={(v) => setForm({ ...form, employeeId: v } as LeaveRequestForm)}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.user ? `${e.user.firstName} ${e.user.lastName}` : e.employeeCode}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium">Type</label><Select value={form.type || "SICK"} onValueChange={(v) => setForm({ ...form, type: v } as LeaveRequestForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SICK">Sick</SelectItem><SelectItem value="CASUAL">Casual</SelectItem><SelectItem value="ANNUAL">Annual</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select></div>
              <div><label className="text-sm font-medium">Start Date</label><Input type="date" value={form.startDate || ""} onChange={(e) => setForm({ ...form, startDate: e.target.value } as LeaveRequestForm)} /></div>
              <div><label className="text-sm font-medium">End Date</label><Input type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value } as LeaveRequestForm)} /></div>
              <div><label className="text-sm font-medium">Reason</label><Input value={form.reason || ""} onChange={(e) => setForm({ ...form, reason: e.target.value } as LeaveRequestForm)} /></div>
            </div>
            <DialogFooter showCloseButton><Button onClick={() => { if (form.startDate && form.endDate) { createMutation.mutate({ ...form, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString() } as CreateLeaveRequestDto); setCreateOpen(false); resetForm(); } }} disabled={createMutation.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="leave requests" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Leave Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Type</label><Select value={form.type || "SICK"} onValueChange={(v) => setForm({ ...form, type: v } as LeaveRequestForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SICK">Sick</SelectItem><SelectItem value="CASUAL">Casual</SelectItem><SelectItem value="ANNUAL">Annual</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select></div>
            <div><label className="text-sm font-medium">Start Date</label><Input type="date" value={form.startDate || ""} onChange={(e) => setForm({ ...form, startDate: e.target.value } as LeaveRequestForm)} /></div>
            <div><label className="text-sm font-medium">End Date</label><Input type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value } as LeaveRequestForm)} /></div>
            <div><label className="text-sm font-medium">Reason</label><Input value={form.reason || ""} onChange={(e) => setForm({ ...form, reason: e.target.value } as LeaveRequestForm)} /></div>
          </div>
          <DialogFooter showCloseButton><Button onClick={() => { if (editItem && form.startDate && form.endDate) { updateMutation.mutate({ id: editItem.id, dto: { ...form, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString() } as UpdateLeaveRequestDto }); setEditItem(null); } }} disabled={updateMutation.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
