"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useDealers, useCreateDealer, useUpdateDealer, useDeleteDealer } from "@/hooks/api";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { format } from "date-fns";
import type { Dealer, CreateDealerDto } from "@/lib/types";

export default function DealersPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "" });
  const { data, isLoading } = useDealers(query);
  const createMutation = useCreateDealer();
  const updateMutation = useUpdateDealer();
  const deleteMutation = useDeleteDealer();
  const { showToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Dealer | null>(null);
  const [deleteItem, setDeleteItem] = useState<Dealer | null>(null);
  const [form, setForm] = useState<CreateDealerDto>({ companyName: "", contactPerson: "", phone: "", email: "", gstin: "", address: "" });

  const resetForm = () => setForm({ companyName: "", contactPerson: "", phone: "", email: "", gstin: "", address: "" });

  const openEdit = (item: Dealer) => {
    setEditItem(item);
    setForm({ companyName: item.companyName, contactPerson: item.contactPerson || "", phone: item.phone || "", email: item.email || "", gstin: item.gstin || "", address: item.address || "" });
  };

  const isFormValid = form.companyName.trim().length > 0;

  const handleSave = () => {
    if (!isFormValid) { showToast("Company name is required", "error"); return; }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, dto: form }, {
        onSuccess: () => { setEditItem(null); resetForm(); showToast("Dealer updated"); },
        onError: (err) => showToast(getApiErrorMessage(err, "Failed to update"), "error"),
      });
    } else {
      createMutation.mutate(form, {
        onSuccess: () => { setCreateOpen(false); resetForm(); showToast("Dealer created"); },
        onError: (err) => showToast(getApiErrorMessage(err, "Failed to create"), "error"),
      });
    }
  };

  const dialogOpen = createOpen || !!editItem;

  const columns: ColumnDef<Dealer>[] = [
    { accessorKey: "companyName", header: "Company Name", cell: ({ row }) => <span className="font-medium">{row.original.companyName}</span> },
    { accessorKey: "contactPerson", header: "Contact" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "gstin", header: "GSTIN" },
    { accessorKey: "isActive", header: "Status", cell: ({ row }) => <Badge variant={row.original.isActive ? "default" : "secondary"}>{row.original.isActive ? "Active" : "Inactive"}</Badge> },
    { accessorKey: "createdAt", header: "Created", cell: ({ row }) => <span>{format(new Date(row.original.createdAt), "MMM dd, yyyy")}</span> },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row.original)}>✏️</Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteItem(row.original)}>🗑️</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Dealers</h2><p className="text-sm text-muted-foreground">Manage dealer partners</p></div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Dealer</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add Dealer</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-sm font-medium">Company Name *</label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
              <div className="col-span-2"><label className="text-sm font-medium">Contact Person</label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Phone</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Email</label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="text-sm font-medium">GSTIN</label><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
              <div className="col-span-2"><label className="text-sm font-medium">Address</label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
            <DialogFooter showCloseButton><Button onClick={handleSave} disabled={createMutation.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="dealers" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) { setEditItem(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Dealer</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-sm font-medium">Company Name *</label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-sm font-medium">Contact Person</label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Phone</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Email</label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="text-sm font-medium">GSTIN</label><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-sm font-medium">Address</label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <DialogFooter showCloseButton><Button onClick={handleSave} disabled={updateMutation.isPending}>Update</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(o) => { if (!o) setDeleteItem(null); }}
        title="Delete Dealer"
        onConfirm={() => {
          if (!deleteItem) return;
          deleteMutation.mutate(deleteItem.id, {
            onSuccess: () => { setDeleteItem(null); showToast("Dealer deleted"); },
            onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete"), "error"),
          });
        }}
        loading={deleteMutation.isPending}
      >Are you sure you want to delete {deleteItem?.companyName}?</ConfirmDialog>
    </div>
  );
}
