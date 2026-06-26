"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Check, X, Upload } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useLeaveRequests, useCreateLeaveRequest, useUpdateLeaveRequest, useApproveLeaveRequest, useDeleteLeaveRequest, useEmployees, useUpload } from "@/hooks/api";
import { useCurrentUser } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
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
  SICK: "bg-red-100 text-red-800", CASUAL: "bg-blue-100 text-blue-800", ANNUAL: "bg-green-100 text-green-800", OTHER: "bg-gray-100 text-gray-800", MEDICAL: "bg-purple-100 text-purple-800",
};

export default function LeaveRequestsPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const, search: "" });
  const { data, isLoading } = useLeaveRequests(query);
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role || "EMPLOYEE";
  const canApprove = role === "OWNER";
  const { data: empData } = useEmployees({ limit: 200 });
  const employees = empData?.data || [];
  const createMutation = useCreateLeaveRequest();
  const updateMutation = useUpdateLeaveRequest();
  const approveMutation = useApproveLeaveRequest();
  const deleteMutation = useDeleteLeaveRequest();
  const { uploadGeneral, uploading } = useUpload();
  const { showToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<LeaveRequest | null>(null);
  const [form, setForm] = useState<LeaveRequestForm>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string>("");

  const resetForm = () => setForm({ employeeId: "", startDate: "", endDate: "", type: "MEDICAL", reason: "" });

  const columns: ColumnDef<LeaveRequest>[] = [
    { accessorKey: "employee", header: "Employee", cell: ({ row }) => <span className="font-medium">{row.original.employee?.employeeCode || row.original.employeeId}</span> },
    { accessorKey: "type", header: "Type", cell: ({ row }) => <Badge variant="outline" className={typeColors[row.original.type]}>{row.original.type}</Badge> },
    { accessorKey: "startDate", header: "Start", cell: ({ row }) => <span>{format(new Date(row.original.startDate), "MMM dd")}</span> },
    { accessorKey: "endDate", header: "End", cell: ({ row }) => <span>{format(new Date(row.original.endDate), "MMM dd")}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="outline" className={statusColors[row.original.status]}>{row.original.status}</Badge> },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {canApprove && row.original.status === "PENDING" && <>
          <Button variant="ghost" size="icon-sm" onClick={() => approveMutation.mutate({ id: row.original.id, dto: { status: "APPROVED" } }, { onError: (err) => showToast(getApiErrorMessage(err, "Failed to approve"), "error") })}><Check className="h-4 w-4 text-green-600" /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => approveMutation.mutate({ id: row.original.id, dto: { status: "REJECTED" } }, { onError: (err) => showToast(getApiErrorMessage(err, "Failed to reject"), "error") })}><X className="h-4 w-4 text-red-600" /></Button>
        </>}
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ employeeId: row.original.employeeId, type: row.original.type, reason: row.original.reason ?? undefined, startDate: row.original.startDate.slice(0, 10), endDate: row.original.endDate.slice(0, 10) }); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(row.original.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
               <div><label className="text-sm font-medium">Type</label><Select value={form.type || "MEDICAL"} onValueChange={(v) => setForm({ ...form, type: v } as LeaveRequestForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SICK">Sick</SelectItem><SelectItem value="CASUAL">Casual</SelectItem><SelectItem value="ANNUAL">Annual</SelectItem><SelectItem value="MEDICAL">Medical</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select></div>
              <div><label className="text-sm font-medium">Start Date</label><Input type="date" value={form.startDate || ""} onChange={(e) => setForm({ ...form, startDate: e.target.value } as LeaveRequestForm)} /></div>
              <div><label className="text-sm font-medium">End Date (max 3 days)</label><Input type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value } as LeaveRequestForm)} /></div>
              <div><label className="text-sm font-medium">Reason</label><Input value={form.reason || ""} onChange={(e) => setForm({ ...form, reason: e.target.value } as LeaveRequestForm)} /></div>
              <div>
                <label className="text-sm font-medium">Document</label>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const result = await uploadGeneral(file);
                      setDocumentUrl(result.url);
                      showToast("Document uploaded");
                    } catch {
                      showToast("Failed to upload document", "error");
                    }
                  }} />
                  {uploading && <span className="text-xs text-muted-foreground">Uploading...</span>}
                  {documentUrl && <span className="text-xs text-green-600">Uploaded</span>}
                </div>
              </div>
            </div>
            <DialogFooter showCloseButton><Button onClick={() => { if (!form.employeeId) { showToast("Please select an employee", "error"); return; } if (form.startDate && form.endDate) { createMutation.mutate({ employeeId: form.employeeId, type: form.type || "MEDICAL", startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString(), reason: form.reason || undefined, documentUrl: documentUrl || undefined } as CreateLeaveRequestDto, { onSuccess: () => { setCreateOpen(false); resetForm(); setDocumentUrl(""); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create leave request"), "error") }); } }} disabled={createMutation.isPending || uploading}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="leave requests" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Leave Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
             <div><label className="text-sm font-medium">Type</label><Select value={form.type || "SICK"} onValueChange={(v) => setForm({ ...form, type: v } as LeaveRequestForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SICK">Sick</SelectItem><SelectItem value="CASUAL">Casual</SelectItem><SelectItem value="ANNUAL">Annual</SelectItem><SelectItem value="MEDICAL">Medical</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select></div>
            <div><label className="text-sm font-medium">Start Date</label><Input type="date" value={form.startDate || ""} onChange={(e) => setForm({ ...form, startDate: e.target.value } as LeaveRequestForm)} /></div>
            <div><label className="text-sm font-medium">End Date</label><Input type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value } as LeaveRequestForm)} /></div>
            <div><label className="text-sm font-medium">Reason</label><Input value={form.reason || ""} onChange={(e) => setForm({ ...form, reason: e.target.value } as LeaveRequestForm)} /></div>
          </div>
          <DialogFooter showCloseButton><Button onClick={() => { if (editItem && form.startDate && form.endDate) { updateMutation.mutate({ id: editItem.id, dto: { type: form.type || undefined, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString(), reason: form.reason || undefined } as UpdateLeaveRequestDto }, { onSuccess: () => { setEditItem(null); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update leave request"), "error") }); } }} disabled={updateMutation.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="Delete Leave Request"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) {
            deleteMutation.mutate(confirmDelete, { onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete"), "error") });
          }
          setConfirmDelete(null);
        }}
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this leave request?
      </ConfirmDialog>
    </div>
  );
}
