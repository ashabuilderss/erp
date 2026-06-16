"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useDesignations, useCreateDesignation, useUpdateDesignation, useDeleteDesignation } from "@/hooks/api";
import type { CreateDesignationDto, Designation, UpdateDesignationDto } from "@/lib/types";

export default function DesignationsPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const, search: "" });
  const { data, isLoading } = useDesignations(query);
  const createMutation = useCreateDesignation();
  const updateMutation = useUpdateDesignation();
  const deleteMutation = useDeleteDesignation();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Designation | null>(null);
  const [form, setForm] = useState<Partial<Designation>>({});

  const resetForm = () => setForm({ name: "", departmentId: "", description: "" });

  const columns: ColumnDef<Designation>[] = [
    { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "department", header: "Department", cell: ({ row }) => <span>{row.original.department?.name || row.original.departmentId}</span> },
    { accessorKey: "description", header: "Description", cell: ({ row }) => <span className="text-muted-foreground">{row.original.description || "-"}</span> },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ ...row.original, description: row.original.description ?? undefined }); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Delete this designation?")) deleteMutation.mutate(row.original.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
              <div><label className="text-sm font-medium">Name</label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value } as Partial<Designation>)} /></div>
              <div><label className="text-sm font-medium">Department ID</label><Input value={form.departmentId || ""} onChange={(e) => setForm({ ...form, departmentId: e.target.value } as Partial<Designation>)} /></div>
              <div><label className="text-sm font-medium">Description</label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value } as Partial<Designation>)} /></div>
            </div>
            <DialogFooter showCloseButton><Button onClick={() => { createMutation.mutate(form as CreateDesignationDto); setCreateOpen(false); resetForm(); }} disabled={createMutation.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="designations" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Designation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Name</label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value } as Partial<Designation>)} /></div>
            <div><label className="text-sm font-medium">Department ID</label><Input value={form.departmentId || ""} onChange={(e) => setForm({ ...form, departmentId: e.target.value } as Partial<Designation>)} /></div>
          </div>
          <DialogFooter showCloseButton><Button onClick={() => { if (editItem) { updateMutation.mutate({ id: editItem.id, dto: form as UpdateDesignationDto }); setEditItem(null); } }} disabled={updateMutation.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
