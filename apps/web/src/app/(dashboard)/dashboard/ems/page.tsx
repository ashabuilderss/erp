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
import { usePerformance, useCreatePerformance, useUpdatePerformance, useDeletePerformance, useAssignments, useCreateAssignment, useUpdateAssignment, useDeleteAssignment, useEmployees, useProperties, useLeads, useSiteVisits, useBookings } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import type {
  Assignment,
  AssignmentType,
  CreateAssignmentDto,
  CreatePerformanceDto,
  Performance,
  UpdateAssignmentDto,
  UpdatePerformanceDto,
} from "@/lib/types";

type PerformanceForm = Partial<Performance>;
type AssignmentForm = Partial<Assignment> & { type?: AssignmentType };

const assignTypeColors: Record<string, string> = {
  PROPERTY: "bg-blue-100 text-blue-800", LEAD: "bg-orange-100 text-orange-800",
  SITE_VISIT: "bg-purple-100 text-purple-800", BOOKING: "bg-green-100 text-green-800",
};

const scoreColor = (score: number) =>
  score >= 80 ? "bg-green-100 text-green-800" : score >= 60 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";

export default function EMSPage() {
  const [pQuery, setPQuery] = useState({ page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" as const });
  const { data: perfData, isLoading: perfLoading } = usePerformance(pQuery);
  const createPerf = useCreatePerformance();
  const updatePerf = useUpdatePerformance();
  const delPerf = useDeletePerformance();
  const [perfOpen, setPerfOpen] = useState(false);
  const [perfEdit, setPerfEdit] = useState<Performance | null>(null);
  const [perfForm, setPerfForm] = useState<PerformanceForm>({});
  const resetPerfForm = () => setPerfForm({ employeeId: "", year: new Date().getFullYear(), quarter: 1, score: 0, notes: "" });

  const { data: empData } = useEmployees({ limit: 200 });
  const employees = (empData?.data || []).filter((e) => e.user?.role === "EMPLOYEE");

  const { data: propData } = useProperties({ limit: 200 });
  const { data: leadData } = useLeads({ limit: 200 });
  const { data: svData } = useSiteVisits({ limit: 200 });
  const { data: bookData } = useBookings({ limit: 200 });
  const properties = propData?.data || [];
  const leads = leadData?.data || [];
  const siteVisits = svData?.data || [];
  const bookings = bookData?.data || [];

  const getEntitiesByType = (type: AssignmentType): Array<{ id: string; label: string }> => {
    switch (type) {
      case "PROPERTY": return properties.map((e) => ({ id: e.id, label: e.title }));
      case "LEAD": return leads.map((e) => ({ id: e.id, label: e.customerName || e.id }));
      case "SITE_VISIT": return siteVisits.map((e) => ({ id: e.id, label: `${e.property?.title || e.propertyId} - ${e.customer?.name || e.customerId}` }));
      case "BOOKING": return bookings.map((e) => ({ id: e.id, label: `${e.property?.title || e.propertyId} - ${e.customer?.name || e.customerId}` }));
      default: return [];
    }
  };

  const { showToast } = useToast();

  const [aQuery, setAQuery] = useState({ page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" as const });
  const { data: assignData, isLoading: assignLoading } = useAssignments(aQuery);
  const createAssign = useCreateAssignment();
  const updateAssign = useUpdateAssignment();
  const delAssign = useDeleteAssignment();
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignEdit, setAssignEdit] = useState<Assignment | null>(null);
  const [assignForm, setAssignForm] = useState<AssignmentForm>({});
  const [confirmPerfDelete, setConfirmPerfDelete] = useState<string | null>(null);
  const [confirmAssignDelete, setConfirmAssignDelete] = useState<string | null>(null);
  const resetAssignForm = () => setAssignForm({ employeeId: "", type: "PROPERTY", entityId: "", notes: "", startDate: "", endDate: "" });

  const perfColumns: ColumnDef<Performance>[] = [
    { accessorKey: "employeeId", header: "Employee", cell: ({ row }) => <span className="font-medium">{row.original.employeeId}</span> },
    { accessorKey: "year", header: "Year" },
    { accessorKey: "quarter", header: "Quarter" },
    { accessorKey: "score", header: "Score", cell: ({ row }) => <Badge variant="outline" className={scoreColor(row.original.score)}>{row.original.score}</Badge> },
    { accessorKey: "notes", header: "Notes", cell: ({ row }) => <span className="text-muted-foreground">{row.original.notes || "-"}</span> },
    { id: "act", header: "", cell: ({ row }) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setPerfEdit(row.original); setPerfForm({ employeeId: row.original.employeeId, year: row.original.year, quarter: row.original.quarter, score: row.original.score, notes: row.original.notes ?? undefined }); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setConfirmPerfDelete(row.original.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  const assignColumns: ColumnDef<Assignment>[] = [
    { accessorKey: "employeeId", header: "Employee", cell: ({ row }) => <span className="font-medium">{row.original.employeeId}</span> },
    { accessorKey: "type", header: "Type", cell: ({ row }) => <Badge variant="outline" className={assignTypeColors[row.original.type]}>{row.original.type}</Badge> },
    { accessorKey: "entityId", header: "Entity ID" },
    { accessorKey: "notes", header: "Notes", cell: ({ row }) => <span className="text-muted-foreground">{row.original.notes || "-"}</span> },
    { id: "act", header: "", cell: ({ row }) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setAssignEdit(row.original); setAssignForm({ employeeId: row.original.employeeId, type: row.original.type, entityId: row.original.entityId, notes: row.original.notes ?? undefined, startDate: row.original.startDate ?? undefined, endDate: row.original.endDate ?? undefined }); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setConfirmAssignDelete(row.original.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div><h2 className="text-2xl font-semibold">Performance Reviews</h2><p className="text-sm text-muted-foreground">Employee performance scores</p></div>
          <Dialog open={perfOpen} onOpenChange={(o) => { setPerfOpen(o); if (!o) resetPerfForm(); }}>
            <DialogTrigger render={<Button size="sm" />}><Plus className="h-4 w-4" /> Add Review</DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle>{perfEdit ? "Edit" : "Add"} Performance Review</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><label className="text-sm font-medium">Employee</label><Select value={perfForm.employeeId || ""} onValueChange={(v) => setPerfForm({ ...perfForm, employeeId: v } as PerformanceForm)}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.user ? `${e.user.firstName} ${e.user.lastName}` : e.employeeCode}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-sm font-medium">Year</label><Input type="number" value={perfForm.year || new Date().getFullYear()} onChange={(e) => setPerfForm({ ...perfForm, year: Number(e.target.value) } as PerformanceForm)} /></div>
                  <div><label className="text-sm font-medium">Quarter</label><Select value={String(perfForm.quarter || 1)} onValueChange={(v) => setPerfForm({ ...perfForm, quarter: Number(v) } as PerformanceForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4].map(q => <SelectItem key={q} value={String(q)}>Q{q}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div><label className="text-sm font-medium">Score (0-100)</label><Input type="number" min={0} max={100} value={perfForm.score || 0} onChange={(e) => setPerfForm({ ...perfForm, score: Number(e.target.value) } as PerformanceForm)} /></div>
                <div><label className="text-sm font-medium">Notes</label><Input value={perfForm.notes || ""} onChange={(e) => setPerfForm({ ...perfForm, notes: e.target.value } as PerformanceForm)} /></div>
              </div>
              <DialogFooter showCloseButton>
                <Button onClick={() => { if (perfEdit) { updatePerf.mutate({ id: perfEdit.id, dto: perfForm as UpdatePerformanceDto }, { onSuccess: () => { setPerfEdit(null); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update performance"), "error") }); } else { createPerf.mutate(perfForm as CreatePerformanceDto, { onSuccess: () => { setPerfOpen(false); resetPerfForm(); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create performance"), "error") }); } }} disabled={createPerf.isPending || updatePerf.isPending}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <DataTable columns={perfColumns} data={perfData?.data || []} isLoading={perfLoading} pageCount={perfData?.meta?.totalPages} totalRecords={perfData?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setPQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />
        <Dialog open={!!perfEdit} onOpenChange={(o) => { if (!o) setPerfEdit(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Edit Performance Review</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-sm font-medium">Year</label><Input type="number" value={perfForm.year || new Date().getFullYear()} onChange={(e) => setPerfForm({ ...perfForm, year: Number(e.target.value) } as PerformanceForm)} /></div>
                <div><label className="text-sm font-medium">Quarter</label><Select value={String(perfForm.quarter || 1)} onValueChange={(v) => setPerfForm({ ...perfForm, quarter: Number(v) } as PerformanceForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4].map(q => <SelectItem key={q} value={String(q)}>Q{q}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div><label className="text-sm font-medium">Score</label><Input type="number" min={0} max={100} value={perfForm.score || 0} onChange={(e) => setPerfForm({ ...perfForm, score: Number(e.target.value) } as PerformanceForm)} /></div>
              <div><label className="text-sm font-medium">Notes</label><Input value={perfForm.notes || ""} onChange={(e) => setPerfForm({ ...perfForm, notes: e.target.value } as PerformanceForm)} /></div>
            </div>
            <DialogFooter showCloseButton><Button onClick={() => { if (perfEdit) { updatePerf.mutate({ id: perfEdit.id, dto: perfForm as UpdatePerformanceDto }, { onSuccess: () => { setPerfEdit(null); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update performance"), "error") }); } }} disabled={updatePerf.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div><h2 className="text-2xl font-semibold">Employee Assignments</h2><p className="text-sm text-muted-foreground">Track assignments to properties, leads, etc.</p></div>
          <Dialog open={assignOpen} onOpenChange={(o) => { setAssignOpen(o); if (!o) resetAssignForm(); }}>
            <DialogTrigger render={<Button size="sm" />}><Plus className="h-4 w-4" /> Add Assignment</DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle>{assignEdit ? "Edit" : "Add"} Assignment</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><label className="text-sm font-medium">Employee</label><Select value={assignForm.employeeId || ""} onValueChange={(v) => setAssignForm({ ...assignForm, employeeId: v } as AssignmentForm)}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.user ? `${e.user.firstName} ${e.user.lastName}` : e.employeeCode}</SelectItem>)}</SelectContent></Select></div>
                <div><label className="text-sm font-medium">Type</label><Select value={assignForm.type || "PROPERTY"} onValueChange={(v) => { setAssignForm({ ...assignForm, type: v, entityId: "" } as AssignmentForm); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PROPERTY">Property</SelectItem><SelectItem value="LEAD">Lead</SelectItem><SelectItem value="SITE_VISIT">Site Visit</SelectItem><SelectItem value="BOOKING">Booking</SelectItem></SelectContent></Select></div>
                <div><label className="text-sm font-medium">Entity</label><Select value={assignForm.entityId || ""} onValueChange={(v) => setAssignForm({ ...assignForm, entityId: v } as AssignmentForm)}><SelectTrigger><SelectValue placeholder="Select entity" /></SelectTrigger><SelectContent>{getEntitiesByType(assignForm.type || "PROPERTY").map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-sm font-medium">Start Date</label><Input type="date" value={assignForm.startDate || ""} onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value } as AssignmentForm)} /></div>
                  <div><label className="text-sm font-medium">End Date</label><Input type="date" value={assignForm.endDate || ""} onChange={(e) => setAssignForm({ ...assignForm, endDate: e.target.value } as AssignmentForm)} /></div>
                </div>
                <div><label className="text-sm font-medium">Notes</label><Input value={assignForm.notes || ""} onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value } as AssignmentForm)} /></div>
              </div>
              <DialogFooter showCloseButton>
                <Button onClick={() => { if (assignEdit) { updateAssign.mutate({ id: assignEdit.id, dto: assignForm as UpdateAssignmentDto }, { onSuccess: () => { setAssignEdit(null); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update assignment"), "error") }); } else { createAssign.mutate(assignForm as CreateAssignmentDto, { onSuccess: () => { setAssignOpen(false); resetAssignForm(); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create assignment"), "error") }); } }} disabled={createAssign.isPending || updateAssign.isPending}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <DataTable columns={assignColumns} data={assignData?.data || []} isLoading={assignLoading} pageCount={assignData?.meta?.totalPages} totalRecords={assignData?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setAQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />
        <Dialog open={!!assignEdit} onOpenChange={(o) => { if (!o) setAssignEdit(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Edit Assignment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-sm font-medium">Type</label><Select value={assignForm.type || "PROPERTY"} onValueChange={(v) => setAssignForm({ ...assignForm, type: v } as AssignmentForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PROPERTY">Property</SelectItem><SelectItem value="LEAD">Lead</SelectItem><SelectItem value="SITE_VISIT">Site Visit</SelectItem><SelectItem value="BOOKING">Booking</SelectItem></SelectContent></Select></div>
              <div><label className="text-sm font-medium">Entity ID</label><Input value={assignForm.entityId || ""} onChange={(e) => setAssignForm({ ...assignForm, entityId: e.target.value } as AssignmentForm)} /></div>
            </div>
            <DialogFooter showCloseButton><Button onClick={() => { if (assignEdit) { updateAssign.mutate({ id: assignEdit.id, dto: assignForm as UpdateAssignmentDto }, { onSuccess: () => { setAssignEdit(null); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update assignment"), "error") }); } }} disabled={updateAssign.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ConfirmDialog
        open={!!confirmPerfDelete}
        onOpenChange={(o) => { if (!o) setConfirmPerfDelete(null); }}
        title="Delete Performance Review"
        variant="destructive"
        onConfirm={() => {
          if (confirmPerfDelete) {
            delPerf.mutate(confirmPerfDelete, { onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete"), "error") });
          }
          setConfirmPerfDelete(null);
        }}
        loading={delPerf.isPending}
      >
        Are you sure you want to delete this performance review?
      </ConfirmDialog>

      <ConfirmDialog
        open={!!confirmAssignDelete}
        onOpenChange={(o) => { if (!o) setConfirmAssignDelete(null); }}
        title="Delete Assignment"
        variant="destructive"
        onConfirm={() => {
          if (confirmAssignDelete) {
            delAssign.mutate(confirmAssignDelete, { onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete"), "error") });
          }
          setConfirmAssignDelete(null);
        }}
        loading={delAssign.isPending}
      >
        Are you sure you want to delete this assignment?
      </ConfirmDialog>
    </div>
  );
}
