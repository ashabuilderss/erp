"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useCurrentUser, useMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial, useMaterialInward, useCreateMaterialInward, useVendors, useSites } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { Material, MaterialInward, Vendor, CreateMaterialDto, CreateMaterialInwardDto } from "@/lib/types";
import { TableSkeleton } from "@/components/ui/skeleton-variants";

export default function MaterialsPage() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role;
  const canWrite = role === "OWNER" || role === "ADMIN";

  const { data: materialsData, isLoading: matsLoading } = useMaterials();
  const { data: inwardData, isLoading: inwardLoading } = useMaterialInward();
  const { data: vendorsData } = useVendors();
  const { data: sitesData } = useSites();
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();
  const createInward = useCreateMaterialInward();

  const materials = materialsData?.data ?? [];
  const inward = inwardData?.data ?? [];
  const vendors = vendorsData?.data ?? [];
  const sites = sitesData?.data ?? [];

  const [matDialog, setMatDialog] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Material | null>(null);
  const [matForm, setMatForm] = useState<CreateMaterialDto>({ name: "", category: "", unit: "", unitPrice: undefined });
  const [inwardOpen, setInwardOpen] = useState(false);
  const [inwardForm, setInwardForm] = useState<CreateMaterialInwardDto>({ materialId: "", vendorId: "", siteId: "", quantity: 0, unitPrice: 0, receivedDate: "", notes: "" });
  const [confirmDeleteMaterial, setConfirmDeleteMaterial] = useState<Material | null>(null);

  function resetMatForm() { setMatForm({ name: "", category: "", unit: "", unitPrice: undefined }); }
  function resetInwardForm() { setInwardForm({ materialId: "", vendorId: "", siteId: "", quantity: 0, unitPrice: 0, receivedDate: "", notes: "" }); }

  function openCreate() { resetMatForm(); setEditTarget(null); setMatDialog("create"); }
  function openEdit(m: Material) { setEditTarget(m); setMatForm({ name: m.name, category: m.category, unit: m.unit, unitPrice: m.unitPrice ?? undefined }); setMatDialog("edit"); }

  function handleSaveMaterial() {
    if (!matForm.name || !matForm.category || !matForm.unit) return;
    if (matDialog === "create") {
      createMaterial.mutate(matForm, {
        onSuccess: () => { showToast("Material created"); setMatDialog(null); resetMatForm(); },
        onError: (e: Error) => showToast(e.message || "Failed to create", "error"),
      });
    } else if (editTarget) {
      updateMaterial.mutate({ id: editTarget.id, dto: matForm }, {
        onSuccess: () => { showToast("Material updated"); setMatDialog(null); setEditTarget(null); resetMatForm(); },
        onError: (e: Error) => showToast(e.message || "Failed to update", "error"),
      });
    }
  }

  function handleDelete(m: Material) {
    setConfirmDeleteMaterial(m);
  }

  function handleCreateInward() {
    if (!inwardForm.materialId || !inwardForm.vendorId || !inwardForm.siteId || !inwardForm.quantity || !inwardForm.receivedDate) return;
    createInward.mutate({ ...inwardForm, quantity: Number(inwardForm.quantity), unitPrice: Number(inwardForm.unitPrice) }, {
      onSuccess: () => { showToast("Material inward recorded"); setInwardOpen(false); resetInwardForm(); },
      onError: (e: Error) => showToast(e.message || "Failed to record inward", "error"),
    });
  }

  return (
    <div className="space-y-8">
      {/* Materials Catalog */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Materials Catalog</CardTitle>
            <p className="text-sm text-muted-foreground">Manage material master data</p>
          </div>
          {canWrite && (
            <Dialog open={matDialog === "create"} onOpenChange={(o) => { if (!o) setMatDialog(null); }}>
              <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Material</DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Add Material</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><label className="text-sm font-medium">Name</label><Input value={matForm.name} onChange={(e) => setMatForm({ ...matForm, name: e.target.value })} /></div>
                  <div><label className="text-sm font-medium">Category</label><Input value={matForm.category} onChange={(e) => setMatForm({ ...matForm, category: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm font-medium">Unit</label><Input value={matForm.unit} onChange={(e) => setMatForm({ ...matForm, unit: e.target.value })} placeholder="e.g. kg, pcs" /></div>
                    <div><label className="text-sm font-medium">Unit Price</label><Input type="number" value={matForm.unitPrice ?? ""} onChange={(e) => setMatForm({ ...matForm, unitPrice: e.target.value ? parseFloat(e.target.value) : undefined })} /></div>
                  </div>
                </div>
                <DialogFooter showCloseButton>
                  <Button onClick={handleSaveMaterial} disabled={createMaterial.isPending}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {matsLoading ? (
            <TableSkeleton rows={4} columns={4} />
          ) : materials.length === 0 ? (
<EmptyState icon={<Package className="h-12 w-12" />} title="No materials yet" description="Add materials to get started" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Unit Price</TableHead>
                  {canWrite && <TableHead className="w-24" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m: Material) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell><Badge variant="outline">{m.category}</Badge></TableCell>
                    <TableCell>{m.unit}</TableCell>
                    <TableCell>{m.unitPrice != null ? `₹${m.unitPrice}` : "—"}</TableCell>
                    {canWrite && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(m)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Material Dialog */}
      <Dialog open={matDialog === "edit"} onOpenChange={(o) => { if (!o) { setMatDialog(null); setEditTarget(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Material</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Name</label><Input value={matForm.name} onChange={(e) => setMatForm({ ...matForm, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Category</label><Input value={matForm.category} onChange={(e) => setMatForm({ ...matForm, category: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Unit</label><Input value={matForm.unit} onChange={(e) => setMatForm({ ...matForm, unit: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Unit Price</label><Input type="number" value={matForm.unitPrice ?? ""} onChange={(e) => setMatForm({ ...matForm, unitPrice: e.target.value ? parseFloat(e.target.value) : undefined })} /></div>
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleSaveMaterial} disabled={updateMaterial.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Inward */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Material Inward</CardTitle>
            <p className="text-sm text-muted-foreground">Record material received at sites</p>
          </div>
          {canWrite && (
            <Dialog open={inwardOpen} onOpenChange={(o) => { setInwardOpen(o); if (!o) resetInwardForm(); }}>
              <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Record Inward</DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Record Material Inward</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Material</label>
                    <Select value={inwardForm.materialId || null} onValueChange={(v) => setInwardForm({ ...inwardForm, materialId: v ?? "" })}>
                      <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                      <SelectContent>
                        {materials.map((m: Material) => (
                          <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Vendor</label>
                    <Select value={inwardForm.vendorId || null} onValueChange={(v) => setInwardForm({ ...inwardForm, vendorId: v ?? "" })}>
                      <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                      <SelectContent>
                        {vendors.map((v: Vendor) => (
                          <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Site</label>
                    <Select value={inwardForm.siteId || null} onValueChange={(v) => setInwardForm({ ...inwardForm, siteId: v ?? "" })}>
                      <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                      <SelectContent>
                        {sites.map((s: { id: string; name: string }) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm font-medium">Quantity</label><Input type="number" value={inwardForm.quantity || ""} onChange={(e) => setInwardForm({ ...inwardForm, quantity: parseFloat(e.target.value) || 0 })} /></div>
                    <div><label className="text-sm font-medium">Unit Price</label><Input type="number" value={inwardForm.unitPrice || ""} onChange={(e) => setInwardForm({ ...inwardForm, unitPrice: parseFloat(e.target.value) || 0 })} /></div>
                  </div>
                  <div><label className="text-sm font-medium">Received Date</label><Input type="date" value={inwardForm.receivedDate} onChange={(e) => setInwardForm({ ...inwardForm, receivedDate: e.target.value })} /></div>
                  <div><label className="text-sm font-medium">Notes</label><Input value={inwardForm.notes ?? ""} onChange={(e) => setInwardForm({ ...inwardForm, notes: e.target.value })} /></div>
                </div>
                <DialogFooter showCloseButton>
                  <Button onClick={handleCreateInward} disabled={createInward.isPending}>Record</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {inwardLoading ? (
            <TableSkeleton rows={4} columns={4} />
          ) : inward.length === 0 ? (
<EmptyState icon={<Package className="h-12 w-12" />} title="No inward records yet" description="Inward records will appear here once materials are received" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Received Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inward.map((r: MaterialInward) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.material?.name ?? r.materialId}</TableCell>
                    <TableCell>{r.vendor?.name ?? r.vendorId}</TableCell>
                    <TableCell>{r.site?.name ?? r.siteId}</TableCell>
                    <TableCell>{r.quantity} {r.material?.unit}</TableCell>
                    <TableCell>₹{r.unitPrice}</TableCell>
                    <TableCell>₹{r.totalAmount}</TableCell>
                    <TableCell>{format(new Date(r.receivedDate), "dd MMM yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmDeleteMaterial}
        onOpenChange={(o) => { if (!o) setConfirmDeleteMaterial(null); }}
        title={`Delete ${confirmDeleteMaterial?.name || "Material"}`}
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteMaterial) {
            deleteMaterial.mutate(confirmDeleteMaterial.id, {
              onSuccess: () => showToast("Material deleted"),
              onError: (e: Error) => showToast(e.message || "Failed to delete", "error"),
            });
          }
          setConfirmDeleteMaterial(null);
        }}
        loading={deleteMaterial.isPending}
      >
        Are you sure you want to delete {'"'}{confirmDeleteMaterial?.name}{'"'}?
      </ConfirmDialog>
    </div>
  );
}
