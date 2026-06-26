"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useDesignations, useCreateDesignation, useUpdateDesignation, useDeleteDesignation, useDepartments } from "@/hooks/api";
import { FieldError } from "@/components/shared/field-error";
import { clearFieldError, validateForm, type ValidationRules } from "@/components/shared/form-validation";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import type { CreateDesignationDto, Designation, UpdateDesignationDto } from "@/lib/types";

export default function DesignationsPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const, search: "" });
  const { data, isLoading } = useDesignations(query);
  const createMutation = useCreateDesignation();
  const updateMutation = useUpdateDesignation();
  const deleteMutation = useDeleteDesignation();
  const { showToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Designation | null>(null);
  const [form, setForm] = useState<Partial<Designation>>({});
  const { data: departmentData } = useDepartments({ limit: 200 }, { enabled: createOpen || !!editItem });
  const [errors, setErrors] = useState<Partial<Record<"name" | "departmentId", string>>>({});
  const departments = departmentData?.data || [];
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const resetForm = () => setForm({ name: "", departmentId: "", description: "" });

  const columns: ColumnDef<Designation>[] = [
    { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "department", header: "Department", cell: ({ row }) => <span>{row.original.department?.name || row.original.departmentId}</span> },
    { accessorKey: "description", header: "Description", cell: ({ row }) => <span className="text-muted-foreground">{row.original.description || "-"}</span> },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ name: row.original.name, departmentId: row.original.departmentId, description: row.original.description ?? undefined }); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(row.original.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Designations</h2><p className="text-sm text-muted-foreground">Manage job titles and roles</p></div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Designation</DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Add Designation</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-sm font-medium">Name</label><Input value={form.name || ""} onChange={(e) => { setForm({ ...form, name: e.target.value } as Partial<Designation>); clearFieldError("name", setErrors); }} className={errors.name ? "border-red-500" : ""} /><FieldError error={errors.name} /></div>
              <div><label className="text-sm font-medium">Department</label><Select value={form.departmentId || ""} onValueChange={(value) => { setForm({ ...form, departmentId: value } as Partial<Designation>); clearFieldError("departmentId", setErrors); }}><SelectTrigger className={errors.departmentId ? "border-red-500" : ""}><SelectValue placeholder="Select department" /></SelectTrigger><SelectContent>{departments.map((department) => <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>)}</SelectContent></Select><FieldError error={errors.departmentId} /></div>
              <div><label className="text-sm font-medium">Description</label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value } as Partial<Designation>)} /></div>
            </div>
            <DialogFooter showCloseButton><Button onClick={() => { const rules: ValidationRules<CreateDesignationDto> = { name: { required: "Name is required" }, departmentId: { required: "Department is required" } }; const fieldErrors = validateForm(form, rules); setErrors(fieldErrors); if (Object.keys(fieldErrors).length > 0) return; createMutation.mutate({ name: form.name!, departmentId: form.departmentId!, description: form.description || undefined }, { onSuccess: () => { setCreateOpen(false); resetForm(); setErrors({}); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create designation"), "error") }); }} disabled={createMutation.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="designations" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Designation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Name</label><Input value={form.name || ""} onChange={(e) => { setForm({ ...form, name: e.target.value } as Partial<Designation>); clearFieldError("name", setErrors); }} className={errors.name ? "border-red-500" : ""} /><FieldError error={errors.name} /></div>
            <div><label className="text-sm font-medium">Department</label><Select value={form.departmentId || ""} onValueChange={(value) => { setForm({ ...form, departmentId: value } as Partial<Designation>); clearFieldError("departmentId", setErrors); }}><SelectTrigger className={errors.departmentId ? "border-red-500" : ""}><SelectValue placeholder="Select department" /></SelectTrigger><SelectContent>{departments.map((department) => <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>)}</SelectContent></Select><FieldError error={errors.departmentId} /></div>
          </div>
          <DialogFooter showCloseButton><Button onClick={() => { if (editItem) { const rules: ValidationRules<CreateDesignationDto> = { name: { required: "Name is required" }, departmentId: { required: "Department is required" } }; const fieldErrors = validateForm(form, rules); setErrors(fieldErrors); if (Object.keys(fieldErrors).length > 0) return; updateMutation.mutate({ id: editItem.id, dto: { name: form.name!, departmentId: form.departmentId!, description: form.description || undefined } as UpdateDesignationDto }, { onSuccess: () => { setEditItem(null); setErrors({}); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update designation"), "error") }); } }} disabled={updateMutation.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="Delete Designation"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) {
            deleteMutation.mutate(confirmDelete, { onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete"), "error") });
          }
          setConfirmDelete(null);
        }}
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this designation?
      </ConfirmDialog>
    </div>
  );
}
