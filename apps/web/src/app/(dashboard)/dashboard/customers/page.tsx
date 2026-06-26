"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { FieldError } from "@/components/shared/field-error";
import { validateForm, clearFieldError } from "@/components/shared/form-validation";
import type { ValidationRules } from "@/components/shared/form-validation";
import type { CreateCustomerDto, Customer, UpdateCustomerDto } from "@/lib/types";

const typeColors: Record<string, string> = {
  BUYER: "bg-blue-100 text-blue-800", SELLER: "bg-orange-100 text-orange-800", BOTH: "bg-purple-100 text-purple-800",
};

export default function CustomersPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const, search: "" });
  const { data, isLoading } = useCustomers(query);
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();
  const { showToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [form, setForm] = useState<Partial<CreateCustomerDto>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "phone" | "type", string>>>({});

  const resetForm = () => setForm({ name: "", email: "", phone: "", type: "BUYER", source: "", notes: "" });

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (data?.data || []).forEach((cust: Customer) => { c[cust.type] = (c[cust.type] || 0) + 1; });
    return c;
  }, [data]);

  const columns: ColumnDef<Customer>[] = [
    { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "type", header: "Type", cell: ({ row }) => <Badge variant="outline" className={typeColors[row.original.type]}>{row.original.type}</Badge> },
    { accessorKey: "source", header: "Source", cell: ({ row }) => row.original.source || "-" },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ name: row.original.name, type: row.original.type, email: row.original.email ?? undefined, phone: row.original.phone ?? undefined, address: row.original.address ?? undefined, source: row.original.source ?? undefined, notes: row.original.notes ?? undefined }); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(row.original.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Customers</h2><p className="text-sm text-muted-foreground">Manage your customer records</p></div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Customer</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-sm font-medium">Name *</label><Input value={form.name || ""} onChange={(e) => { setForm({ ...form, name: e.target.value } as Partial<CreateCustomerDto>); clearFieldError("name", setErrors); }} className={errors.name ? "border-red-500" : ""} /><FieldError error={errors.name} /></div>
              <div><label className="text-sm font-medium">Email</label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value } as Partial<CreateCustomerDto>)} /></div>
              <div><label className="text-sm font-medium">Phone *</label><Input value={form.phone || ""} onChange={(e) => { setForm({ ...form, phone: e.target.value } as Partial<CreateCustomerDto>); clearFieldError("phone", setErrors); }} className={errors.phone ? "border-red-500" : ""} /><FieldError error={errors.phone} /></div>
              <div><label className="text-sm font-medium">Type</label><Select value={form.type || "BUYER"} onValueChange={(v) => setForm({ ...form, type: v } as Partial<CreateCustomerDto>)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BUYER">Buyer</SelectItem><SelectItem value="SELLER">Seller</SelectItem><SelectItem value="BOTH">Both</SelectItem></SelectContent></Select></div>
              <div><label className="text-sm font-medium">Source</label><Input value={form.source || ""} onChange={(e) => setForm({ ...form, source: e.target.value } as Partial<CreateCustomerDto>)} /></div>
              <div className="col-span-2"><label className="text-sm font-medium">Notes</label><Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value } as Partial<CreateCustomerDto>)} /></div>
            </div>
             <DialogFooter showCloseButton><Button onClick={() => { const rules: ValidationRules<{ name: string; phone: string; type: string }> = { name: { required: "Name is required" }, phone: { required: "Phone is required" } }; const errs = validateForm(form, rules); setErrors(errs); if (Object.keys(errs).length > 0) return; const dto: CreateCustomerDto = { name: form.name || "", email: form.email || undefined, phone: form.phone || undefined, type: form.type, source: form.source || undefined, notes: form.notes || undefined, address: form.address || undefined }; createMutation.mutate(dto, { onSuccess: () => { setCreateOpen(false); resetForm(); setErrors({}); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create customer"), "error") }); }} disabled={createMutation.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[{ type: "BUYER", label: "Buyers", color: "bg-blue-100 text-blue-800" },
          { type: "SELLER", label: "Sellers", color: "bg-green-100 text-green-800" },
          { type: "BOTH", label: "Both", color: "bg-purple-100 text-purple-800" },
        ].map((t) => (
          <Card key={t.type}>
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.label}</span>
              <Badge variant="outline" className={t.color}>{counts[t.type] || 0}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="customers" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-sm font-medium">Name</label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value } as Partial<CreateCustomerDto>)} /></div>
            <div><label className="text-sm font-medium">Email</label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value } as Partial<CreateCustomerDto>)} /></div>
            <div><label className="text-sm font-medium">Phone</label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value } as Partial<CreateCustomerDto>)} /></div>
            <div><label className="text-sm font-medium">Type</label><Select value={form.type || "BUYER"} onValueChange={(v) => setForm({ ...form, type: v } as Partial<CreateCustomerDto>)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BUYER">Buyer</SelectItem><SelectItem value="SELLER">Seller</SelectItem><SelectItem value="BOTH">Both</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter showCloseButton><Button onClick={() => { if (editItem) { const dto: UpdateCustomerDto = { name: form.name || undefined, email: form.email || undefined, phone: form.phone || undefined, type: form.type, source: form.source || undefined, notes: form.notes || undefined, address: form.address || undefined }; updateMutation.mutate({ id: editItem.id, dto }, { onSuccess: () => { setEditItem(null); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update customer"), "error") }); } }} disabled={updateMutation.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="Delete Customer"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) {
            deleteMutation.mutate(confirmDelete, { onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete"), "error") });
          }
          setConfirmDelete(null);
        }}
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this customer?
      </ConfirmDialog>
    </div>
  );
}
