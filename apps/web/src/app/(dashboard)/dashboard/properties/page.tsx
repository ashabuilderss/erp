"use client";

import { useState } from "react";
import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useProperties, useCreateProperty, useUpdateProperty, useDeleteProperty, useEmployees, useCurrentUser } from "@/hooks/api";
import { useUpload } from "@/hooks/api/useUpload";
import { useToast } from "@/components/ui/toast";
import type { CreatePropertyDto, Property, UpdatePropertyDto } from "@/lib/types";
import { getApiErrorMessage } from "@/lib/api";
import { FieldError } from "@/components/shared/field-error";
import { validateForm, clearFieldError } from "@/components/shared/form-validation";
import type { ValidationRules } from "@/components/shared/form-validation";

type PropertyForm = Partial<CreatePropertyDto>;

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800 border-green-200",
  RESERVED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  BOOKED: "bg-blue-100 text-blue-800 border-blue-200",
  SOLD: "bg-purple-100 text-purple-800 border-purple-200",
};

const typeColors: Record<string, string> = {
  APARTMENT: "bg-blue-100 text-blue-800", HOUSE: "bg-indigo-100 text-indigo-800",
  COMMERCIAL: "bg-orange-100 text-orange-800", LAND: "bg-green-100 text-green-800", VILLA: "bg-pink-100 text-pink-800",
};

export default function PropertiesPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const, search: "" });
  const { data, isLoading } = useProperties(query);
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role;
  const canManage = role === "OWNER" || role === "ADMIN";
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Property | null>(null);
  const { data: empData } = useEmployees({ limit: 200 }, { enabled: createOpen || !!editItem });
  const { showToast } = useToast();
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const deleteMutation = useDeleteProperty();
  const { uploadPropertyImages, uploading } = useUpload();
  const [form, setForm] = useState<PropertyForm>({});
  const [errors, setErrors] = useState<Partial<Record<"title" | "price" | "location" | "city" | "state", string>>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const employees = empData?.data || [];

  const resetForm = () => setForm({ title: "", type: "APARTMENT", status: "AVAILABLE", price: 0, location: "", city: "", state: "", description: "", bedrooms: 0, bathrooms: 0, area: 0, assignedToEmployeeId: "" });

  const columns: ColumnDef<Property>[] = [
    { accessorKey: "title", header: "Title", cell: ({ row }) => <span className="font-medium">{row.original.title}</span> },
    { accessorKey: "type", header: "Type", cell: ({ row }) => <Badge variant="outline" className={typeColors[row.original.type]}>{row.original.type}</Badge> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="outline" className={statusColors[row.original.status]}>{row.original.status}</Badge> },
    { accessorKey: "price", header: "Price", cell: ({ row }) => <span>₹{Number(row.original.price).toLocaleString()}</span> },
    { accessorKey: "city", header: "City" },
    { accessorKey: "state", header: "State" },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {canManage && (
          <>
            <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ title: row.original.title, type: row.original.type, status: row.original.status, price: row.original.price, location: row.original.location, city: row.original.city, state: row.original.state, propertyCode: row.original.propertyCode ?? undefined, description: row.original.description ?? undefined, area: row.original.area ?? undefined, bedrooms: row.original.bedrooms ?? undefined, bathrooms: row.original.bathrooms ?? undefined, locality: row.original.locality ?? undefined, images: row.original.images ?? undefined, amenities: row.original.amenities ?? undefined, assignedToEmployeeId: row.original.assignedToEmployeeId ?? undefined } as PropertyForm); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(row.original.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Properties</h2><p className="text-sm text-muted-foreground">Manage your property listings</p></div>
        {canManage && (
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (o) resetForm(); }}>
            <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Property</DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Add Property</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-sm font-medium">Title</label><Input value={form.title || ""} onChange={(e) => { setForm({ ...form, title: e.target.value } as PropertyForm); clearFieldError("title", setErrors); }} className={errors.title ? "border-red-500" : ""} /><FieldError error={errors.title} /></div>
              <div><label className="text-sm font-medium">Type</label><Select value={form.type || "APARTMENT"} onValueChange={(v) => setForm({ ...form, type: v } as PropertyForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{"APARTMENT,HOUSE,COMMERCIAL,LAND,VILLA".split(",").map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium">Status</label><Select value={form.status || "AVAILABLE"} onValueChange={(v) => setForm({ ...form, status: v } as PropertyForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{"AVAILABLE,RESERVED,BOOKED,SOLD".split(",").map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium">Price</label><Input type="number" value={form.price || 0} onChange={(e) => { setForm({ ...form, price: Number(e.target.value) } as PropertyForm); clearFieldError("price", setErrors); }} className={errors.price ? "border-red-500" : ""} /><FieldError error={errors.price} /></div>
              <div><label className="text-sm font-medium">Area (sqft)</label><Input type="number" value={form.area || ""} onChange={(e) => setForm({ ...form, area: Number(e.target.value) } as PropertyForm)} /></div>
              <div><label className="text-sm font-medium">Bedrooms</label><Input type="number" value={form.bedrooms || 0} onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) } as PropertyForm)} /></div>
              <div><label className="text-sm font-medium">Bathrooms</label><Input type="number" value={form.bathrooms || 0} onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) } as PropertyForm)} /></div>
              <div><label className="text-sm font-medium">Location</label><Input value={form.location || ""} onChange={(e) => { setForm({ ...form, location: e.target.value } as PropertyForm); clearFieldError("location", setErrors); }} className={errors.location ? "border-red-500" : ""} /><FieldError error={errors.location} /></div>
              <div><label className="text-sm font-medium">City</label><Input value={form.city || ""} onChange={(e) => { setForm({ ...form, city: e.target.value } as PropertyForm); clearFieldError("city", setErrors); }} className={errors.city ? "border-red-500" : ""} /><FieldError error={errors.city} /></div>
              <div><label className="text-sm font-medium">State</label><Input value={form.state || ""} onChange={(e) => { setForm({ ...form, state: e.target.value } as PropertyForm); clearFieldError("state", setErrors); }} className={errors.state ? "border-red-500" : ""} /><FieldError error={errors.state} /></div>
              <div className="col-span-2"><label className="text-sm font-medium">Description</label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value } as PropertyForm)} /></div>
              <div><label className="text-sm font-medium">Assigned To</label><Select value={form.assignedToEmployeeId || ""} onValueChange={(v) => setForm({ ...form, assignedToEmployeeId: v || undefined } as PropertyForm)}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.user ? `${e.user.firstName} ${e.user.lastName}` : e.employeeCode}</SelectItem>)}</SelectContent></Select></div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Images</label>
                <Input type="file" multiple accept="image/*" disabled={uploading} onChange={async (e) => {
                  if (e.target.files?.length) {
                    const urls = await uploadPropertyImages(e.target.files);
                    setForm({ ...form, images: [...(form.images || []), ...urls] } as PropertyForm);
                    e.target.value = "";
                  }
                }} />
                {(form.images?.length ?? 0) > 0 && <div className="flex flex-wrap gap-2 mt-2">{(form.images ?? []).map((u: string, i: number) => <div key={i} className="relative group"><Image src={u} alt="" width={64} height={64} unoptimized className="h-16 w-16 object-cover rounded border" /><button type="button" className="absolute -top-1 -right-1 bg-destructive text-white rounded-full h-4 w-4 text-xs leading-none" onClick={() => setForm({ ...form, images: (form.images ?? []).filter((_, j: number) => j !== i) } as PropertyForm)}>x</button></div>)}</div>}
              </div>
            </div>
            <DialogFooter showCloseButton><Button onClick={() => { const rules: ValidationRules<PropertyForm> = { title: { required: "Title is required" }, price: { required: "Price is required" }, location: { required: "Location is required" }, city: { required: "City is required" }, state: { required: "State is required" } }; const fieldErrors = validateForm(form, rules); setErrors(fieldErrors); if (Object.keys(fieldErrors).length > 0) return; const dto: CreatePropertyDto = { title: form.title!, price: form.price!, location: form.location!, city: form.city!, state: form.state!, type: form.type!, status: form.status!, description: form.description || undefined, area: form.area ?? undefined, bedrooms: form.bedrooms ?? undefined, bathrooms: form.bathrooms ?? undefined, locality: form.locality || undefined, propertyCode: form.propertyCode || undefined, images: form.images || undefined, amenities: form.amenities || undefined, assignedToEmployeeId: form.assignedToEmployeeId || undefined }; createMutation.mutate(dto, { onSuccess: () => { showToast("Property created"); setCreateOpen(false); resetForm(); setErrors({}); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create property"), "error") }); }} disabled={createMutation.isPending || uploading}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="properties" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Property</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-sm font-medium">Title</label><Input value={form.title || ""} onChange={(e) => { setForm({ ...form, title: e.target.value } as PropertyForm); clearFieldError("title", setErrors); }} className={errors.title ? "border-red-500" : ""} /><FieldError error={errors.title} /></div>
            <div><label className="text-sm font-medium">Type</label><Select value={form.type || "APARTMENT"} onValueChange={(v) => setForm({ ...form, type: v } as PropertyForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{"APARTMENT,HOUSE,COMMERCIAL,LAND,VILLA".split(",").map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Status</label><Select value={form.status || "AVAILABLE"} onValueChange={(v) => setForm({ ...form, status: v } as PropertyForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{"AVAILABLE,RESERVED,BOOKED,SOLD".split(",").map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Price</label><Input type="number" value={form.price || 0} onChange={(e) => { setForm({ ...form, price: Number(e.target.value) } as PropertyForm); clearFieldError("price", setErrors); }} className={errors.price ? "border-red-500" : ""} /><FieldError error={errors.price} /></div>
            <div><label className="text-sm font-medium">Location</label><Input value={form.location || ""} onChange={(e) => { setForm({ ...form, location: e.target.value } as PropertyForm); clearFieldError("location", setErrors); }} className={errors.location ? "border-red-500" : ""} /><FieldError error={errors.location} /></div>
            <div><label className="text-sm font-medium">City</label><Input value={form.city || ""} onChange={(e) => { setForm({ ...form, city: e.target.value } as PropertyForm); clearFieldError("city", setErrors); }} className={errors.city ? "border-red-500" : ""} /><FieldError error={errors.city} /></div>
            <div><label className="text-sm font-medium">State</label><Input value={form.state || ""} onChange={(e) => { setForm({ ...form, state: e.target.value } as PropertyForm); clearFieldError("state", setErrors); }} className={errors.state ? "border-red-500" : ""} /><FieldError error={errors.state} /></div>
            <div><label className="text-sm font-medium">Area (sqft)</label><Input type="number" value={form.area || ""} onChange={(e) => setForm({ ...form, area: Number(e.target.value) } as PropertyForm)} /></div>
            <div><label className="text-sm font-medium">Bedrooms</label><Input type="number" value={form.bedrooms || 0} onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) } as PropertyForm)} /></div>
            <div><label className="text-sm font-medium">Bathrooms</label><Input type="number" value={form.bathrooms || 0} onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) } as PropertyForm)} /></div>
            <div className="col-span-2"><label className="text-sm font-medium">Description</label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value } as PropertyForm)} /></div>
            <div><label className="text-sm font-medium">Assigned To</label><Select value={form.assignedToEmployeeId || ""} onValueChange={(v) => setForm({ ...form, assignedToEmployeeId: v || undefined } as PropertyForm)}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.user ? `${e.user.firstName} ${e.user.lastName}` : e.employeeCode}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Images</label>
              <Input type="file" multiple accept="image/*" disabled={uploading} onChange={async (e) => {
                if (e.target.files?.length) {
                  const urls = await uploadPropertyImages(e.target.files);
                  setForm({ ...form, images: [...(form.images || []), ...urls] } as PropertyForm);
                  e.target.value = "";
                }
              }} />
              {(form.images?.length ?? 0) > 0 && <div className="flex flex-wrap gap-2 mt-2">{(form.images ?? []).map((u: string, i: number) => <div key={i} className="relative group"><Image src={u} alt="" width={64} height={64} unoptimized className="h-16 w-16 object-cover rounded border" /><button type="button" className="absolute -top-1 -right-1 bg-destructive text-white rounded-full h-4 w-4 text-xs leading-none" onClick={() => setForm({ ...form, images: (form.images ?? []).filter((_, j: number) => j !== i) } as PropertyForm)}>x</button></div>)}</div>}
            </div>
          </div>
          <DialogFooter showCloseButton><Button onClick={() => { if (editItem) { const rules: ValidationRules<PropertyForm> = { title: { required: "Title is required" }, price: { required: "Price is required" }, location: { required: "Location is required" }, city: { required: "City is required" }, state: { required: "State is required" } }; const fieldErrors = validateForm(form, rules); setErrors(fieldErrors); if (Object.keys(fieldErrors).length > 0) return; const dto: UpdatePropertyDto = { title: form.title!, price: form.price!, location: form.location!, city: form.city!, state: form.state!, type: form.type!, status: form.status!, description: form.description || undefined, area: form.area ?? undefined, bedrooms: form.bedrooms ?? undefined, bathrooms: form.bathrooms ?? undefined, locality: form.locality || undefined, propertyCode: form.propertyCode || undefined, images: form.images || undefined, amenities: form.amenities || undefined, assignedToEmployeeId: form.assignedToEmployeeId || undefined }; updateMutation.mutate({ id: editItem.id, dto }, { onSuccess: () => { showToast("Property updated"); setEditItem(null); setErrors({}); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update property"), "error") }); } }} disabled={updateMutation.isPending || uploading}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="Delete Property"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) {
            deleteMutation.mutate(confirmDelete, { onSuccess: () => showToast("Property deleted"), onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete property"), "error") });
          }
          setConfirmDelete(null);
        }}
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this property?
      </ConfirmDialog>
    </div>
  );
}
