"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Handshake } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useBrokers, useCreateBroker, useUpdateBroker, useDeleteBroker, useCurrentUser } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { FieldError } from "@/components/shared/field-error";
import { validateForm, clearFieldError } from "@/components/shared/form-validation";
import type { ValidationRules } from "@/components/shared/form-validation";
import type { Broker, CreateBrokerDto } from "@/lib/types";

const statusBadge = (isActive: boolean) =>
  isActive
    ? <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
    : <Badge variant="outline" className="bg-gray-100 text-gray-800">Inactive</Badge>;

export default function BrokersPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const, search: "" });
  const { data, isLoading } = useBrokers(query);
  const { showToast } = useToast();
  const createMutation = useCreateBroker();
  const updateMutation = useUpdateBroker();
  const deleteMutation = useDeleteBroker();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Broker | null>(null);
  const [form, setForm] = useState<Partial<Broker>>({});
  const [errors, setErrors] = useState<Partial<Record<"name", string>>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const resetForm = () => setForm({ name: "", companyName: "", phone: "", email: "", commissionRate: 0, isActive: true });

  const columns: ColumnDef<Broker>[] = [
    { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "companyName", header: "Company", cell: ({ row }) => <span>{row.original.companyName || "-"}</span> },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => <span>{row.original.phone || "-"}</span> },
    { accessorKey: "email", header: "Email", cell: ({ row }) => <span>{row.original.email || "-"}</span> },
    { accessorKey: "commissionRate", header: "Commission Rate", cell: ({ row }) => <span>{row.original.commissionRate?.toLocaleString() ?? "-"}</span> },
    { accessorKey: "_count", header: "Leads", cell: ({ row }) => <span>{row.original._count?.leads ?? 0}</span> },
    { accessorKey: "isActive", header: "Status", cell: ({ row }) => statusBadge(row.original.isActive) },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ name: row.original.name, isActive: row.original.isActive, commissionRate: row.original.commissionRate ?? undefined, companyName: row.original.companyName ?? undefined, phone: row.original.phone ?? undefined, email: row.original.email ?? undefined }); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(row.original.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Handshake className="h-5 w-5" /> Brokers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Manage your external brokers and agents</p>
            <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Broker</DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Add Broker</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="text-sm font-medium">Name *</label><Input value={form.name || ""} onChange={(e) => { setForm({ ...form, name: e.target.value } as Partial<Broker>); clearFieldError("name", setErrors); }} className={errors.name ? "border-red-500" : ""} /><FieldError error={errors.name} /></div>
                  <div><label className="text-sm font-medium">Company</label><Input value={form.companyName || ""} onChange={(e) => setForm({ ...form, companyName: e.target.value } as Partial<Broker>)} /></div>
                  <div><label className="text-sm font-medium">Phone</label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value } as Partial<Broker>)} /></div>
                  <div><label className="text-sm font-medium">Email</label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value } as Partial<Broker>)} /></div>
                  <div><label className="text-sm font-medium">Commission Rate</label><Input type="number" value={form.commissionRate ?? ""} onChange={(e) => setForm({ ...form, commissionRate: e.target.valueAsNumber } as Partial<Broker>)} /></div>
                  <div><label className="text-sm font-medium">Status</label><Select value={form.isActive === false ? "false" : "true"} onValueChange={(v) => setForm({ ...form, isActive: v === "true" } as Partial<Broker>)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Active</SelectItem><SelectItem value="false">Inactive</SelectItem></SelectContent></Select></div>
                </div>
                <DialogFooter><Button onClick={() => { const rules: ValidationRules<CreateBrokerDto> = { name: { required: "Name is required" } }; const errs = validateForm(form, rules); setErrors(errs); if (Object.keys(errs).length > 0) return; createMutation.mutate({ name: form.name!, companyName: form.companyName || undefined, phone: form.phone || undefined, email: form.email || undefined, commissionRate: form.commissionRate ?? undefined, isActive: form.isActive } as CreateBrokerDto, { onSuccess: () => { setErrors({}); showToast("Broker created"); setCreateOpen(false); resetForm(); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create broker"), "error") }); }} disabled={createMutation.isPending}>Save</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="brokers" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />
        </CardContent>
      </Card>

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Broker</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-sm font-medium">Name *</label><Input value={form.name || ""} onChange={(e) => { setForm({ ...form, name: e.target.value } as Partial<Broker>); clearFieldError("name", setErrors); }} className={errors.name ? "border-red-500" : ""} /><FieldError error={errors.name} /></div>
            <div><label className="text-sm font-medium">Company</label><Input value={form.companyName || ""} onChange={(e) => setForm({ ...form, companyName: e.target.value } as Partial<Broker>)} /></div>
            <div><label className="text-sm font-medium">Phone</label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value } as Partial<Broker>)} /></div>
            <div><label className="text-sm font-medium">Email</label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value } as Partial<Broker>)} /></div>
            <div><label className="text-sm font-medium">Commission Rate</label><Input type="number" value={form.commissionRate ?? ""} onChange={(e) => setForm({ ...form, commissionRate: e.target.valueAsNumber } as Partial<Broker>)} /></div>
            <div><label className="text-sm font-medium">Status</label><Select value={form.isActive === false ? "false" : "true"} onValueChange={(v) => setForm({ ...form, isActive: v === "true" } as Partial<Broker>)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Active</SelectItem><SelectItem value="false">Inactive</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button onClick={() => { if (editItem) { const rules: ValidationRules<CreateBrokerDto> = { name: { required: "Name is required" } }; const errs = validateForm(form, rules); setErrors(errs); if (Object.keys(errs).length > 0) return; updateMutation.mutate({ id: editItem.id, dto: { name: form.name!, companyName: form.companyName || undefined, phone: form.phone || undefined, email: form.email || undefined, commissionRate: form.commissionRate ?? undefined, isActive: form.isActive } as CreateBrokerDto }, { onSuccess: () => { setErrors({}); showToast("Broker updated"); setEditItem(null); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update broker"), "error") }); } }} disabled={updateMutation.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="Delete Broker"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) {
            deleteMutation.mutate(confirmDelete, { onSuccess: () => showToast("Broker deleted"), onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete broker"), "error") });
          }
          setConfirmDelete(null);
        }}
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this broker?
      </ConfirmDialog>
    </div>
  );
}
