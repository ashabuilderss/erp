"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor, useCurrentUser } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { FieldError } from "@/components/shared/field-error";
import { validateForm, clearFieldError } from "@/components/shared/form-validation";
import type { ValidationRules } from "@/components/shared/form-validation";
import type { Vendor, CreateVendorDto } from "@/lib/types";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800", INACTIVE: "bg-gray-100 text-gray-800",
};

export default function VendorsPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const, search: "" });
  const { data, isLoading } = useVendors(query);
  const { showToast } = useToast();
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();
  const deleteMutation = useDeleteVendor();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Vendor | null>(null);
  const [form, setForm] = useState<Partial<Vendor>>({});
  const [errors, setErrors] = useState<Partial<Record<"name", string>>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { data: currentUser } = useCurrentUser();
  const canManage = ["OWNER", "ADMIN"].includes(currentUser?.user?.role || "");

  const resetForm = () => setForm({ name: "", contactPerson: "", phone: "", email: "", address: "", gstin: "", status: "ACTIVE" });

  const columns: ColumnDef<Vendor>[] = [
    { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "contactPerson", header: "Contact Person", cell: ({ row }) => <span>{row.original.contactPerson || "-"}</span> },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => <span>{row.original.phone || "-"}</span> },
    { accessorKey: "email", header: "Email", cell: ({ row }) => <span>{row.original.email || "-"}</span> },
    { accessorKey: "gstin", header: "GSTIN", cell: ({ row }) => <span>{row.original.gstin || "-"}</span> },
    { accessorKey: "rating", header: "Rating", cell: ({ row }) => <span>{row.original.rating ? `${row.original.rating} / 5` : "-"}</span> },
    { accessorKey: "isBlacklisted", header: "Blacklisted", cell: ({ row }) => <Badge variant="outline" className={row.original.isBlacklisted ? "bg-red-100 text-red-800" : ""}>{row.original.isBlacklisted ? "YES" : "NO"}</Badge> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="outline" className={statusColors[row.original.status]}>{row.original.status}</Badge> },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {canManage && (
          <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ name: row.original.name, status: row.original.status, contactPerson: row.original.contactPerson ?? undefined, phone: row.original.phone ?? undefined, email: row.original.email ?? undefined, address: row.original.address ?? undefined, gstin: row.original.gstin ?? undefined }); }}><Pencil className="h-4 w-4" /></Button>
        )}
        {canManage && (
          <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(row.original.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Vendors</h2><p className="text-sm text-muted-foreground">Manage your vendors and contractors</p></div>
        {canManage && (
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Vendor</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Vendor Name</Label><Input value={form.name || ""} onChange={(e) => { setForm({ ...form, name: e.target.value } as Partial<Vendor>); clearFieldError("name", setErrors); }} className={errors.name ? "border-red-500" : ""} /><FieldError error={errors.name} /></div>
              <div><Label>Contact Person</Label><Input value={form.contactPerson || ""} onChange={(e) => setForm({ ...form, contactPerson: e.target.value } as Partial<Vendor>)} /></div>
              <div><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value } as Partial<Vendor>)} /></div>
              <div><Label>Email</Label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value } as Partial<Vendor>)} /></div>
              <div className="col-span-2"><Label>Address</Label><Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value } as Partial<Vendor>)} /></div>
              <div><Label>GSTIN</Label><Input value={form.gstin || ""} onChange={(e) => setForm({ ...form, gstin: e.target.value } as Partial<Vendor>)} /></div>
              <div><Label>Status</Label><Select value={form.status || "ACTIVE"} onValueChange={(v) => setForm({ ...form, status: v } as Partial<Vendor>)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter><Button onClick={() => { const rules: ValidationRules<CreateVendorDto> = { name: { required: "Name is required" } }; const errs = validateForm(form, rules); setErrors(errs); if (Object.keys(errs).length > 0) return; createMutation.mutate({ name: form.name!, contactPerson: form.contactPerson || undefined, phone: form.phone || undefined, email: form.email || undefined, address: form.address || undefined, gstin: form.gstin || undefined, status: form.status || "ACTIVE" } as CreateVendorDto, { onSuccess: () => { setErrors({}); showToast("Vendor created"); setCreateOpen(false); resetForm(); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create vendor"), "error") }); }} disabled={createMutation.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="vendors" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Vendor</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Vendor Name</Label><Input value={form.name || ""} onChange={(e) => { setForm({ ...form, name: e.target.value } as Partial<Vendor>); clearFieldError("name", setErrors); }} className={errors.name ? "border-red-500" : ""} /><FieldError error={errors.name} /></div>
            <div><Label>Contact Person</Label><Input value={form.contactPerson || ""} onChange={(e) => setForm({ ...form, contactPerson: e.target.value } as Partial<Vendor>)} /></div>
            <div><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value } as Partial<Vendor>)} /></div>
            <div><Label>Email</Label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value } as Partial<Vendor>)} /></div>
            <div className="col-span-2"><Label>Address</Label><Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value } as Partial<Vendor>)} /></div>
            <div><Label>GSTIN</Label><Input value={form.gstin || ""} onChange={(e) => setForm({ ...form, gstin: e.target.value } as Partial<Vendor>)} /></div>
            <div><Label>Status</Label><Select value={form.status || "ACTIVE"} onValueChange={(v) => setForm({ ...form, status: v } as Partial<Vendor>)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button onClick={() => { if (editItem) { const rules: ValidationRules<CreateVendorDto> = { name: { required: "Name is required" } }; const errs = validateForm(form, rules); setErrors(errs); if (Object.keys(errs).length > 0) return; updateMutation.mutate({ id: editItem.id, dto: { name: form.name!, contactPerson: form.contactPerson || undefined, phone: form.phone || undefined, email: form.email || undefined, address: form.address || undefined, gstin: form.gstin || undefined, status: form.status } as CreateVendorDto }, { onSuccess: () => { setErrors({}); showToast("Vendor updated"); setEditItem(null); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update vendor"), "error") }); } }} disabled={updateMutation.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="Delete Vendor"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) {
            deleteMutation.mutate(confirmDelete, { onSuccess: () => showToast("Vendor deleted"), onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete vendor"), "error") });
          }
          setConfirmDelete(null);
        }}
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this vendor?
      </ConfirmDialog>
    </div>
  );
}
