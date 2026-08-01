"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, Package } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useConsumptions, useCreateConsumption, useDeleteConsumption, useSites, useMaterials, useCurrentUser } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import type { MaterialConsumption, CreateConsumptionDto } from "@/lib/types";
import { format } from "date-fns";

export default function ConsumptionPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "consumedDate", sortOrder: "desc" as const, siteId: "" });
  const { data, isLoading } = useConsumptions(query);
  const { data: sitesData } = useSites();
  const { data: materialsData } = useMaterials();
  const { data: currentUser } = useCurrentUser();
  const createMutation = useCreateConsumption();
  const deleteMutation = useDeleteConsumption();
  const { showToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateConsumptionDto>({ siteId: "", materialId: "", quantity: 0, consumedDate: "", notes: "" });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const sites = sitesData?.data || [];
  const materials = materialsData?.data || [];
  const role = currentUser?.user?.role;
  const canManage = ["OWNER", "ADMIN"].includes(role || "");

  const resetForm = () => setForm({ siteId: "", materialId: "", quantity: 0, consumedDate: "", notes: "" });

  const columns: ColumnDef<MaterialConsumption>[] = [
    { accessorKey: "consumedDate", header: "Date", cell: ({ row }) => <span>{format(new Date(row.original.consumedDate), "MMM dd, yyyy")}</span> },
    { accessorKey: "constructionSites", header: "Site", cell: ({ row }) => <span className="font-medium">{row.original.constructionSites?.name ?? "-"}</span> },
    { accessorKey: "materials", header: "Material", cell: ({ row }) => <span>{row.original.materials?.name ?? "-"}</span> },
    { accessorKey: "quantity", header: "Qty Consumed", cell: ({ row }) => <Badge variant="outline" className="font-mono">{row.original.quantity} {row.original.materials?.unit || ""}</Badge> },
    { accessorKey: "sitePhases", header: "Phase", cell: ({ row }) => <span className="text-muted-foreground">{row.original.sitePhases?.name || "-"}</span> },
    { accessorKey: "notes", header: "Notes", cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.notes || "-"}</span> },
    ...(canManage ? [{
      id: "actions" as const,
      header: "" as const,
      cell: ({ row }: { row: { original: MaterialConsumption } }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(row.original.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Material Consumption</h2><p className="text-sm text-muted-foreground">Track material usage across construction sites</p></div>
        {canManage && (
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Record Consumption</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Record Material Consumption</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Site</Label>
                <Select value={form.siteId ?? ""} onValueChange={(v) => setForm({ ...form, siteId: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                  <SelectContent>
                    {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Material</Label>
                <Select value={form.materialId ?? ""} onValueChange={(v) => setForm({ ...form, materialId: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" step="0.01" min="0.01" value={form.quantity || ""} onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Consumed Date</Label>
                <Input type="date" value={form.consumedDate} onChange={(e) => setForm({ ...form, consumedDate: e.target.value })} />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => {
                if (!form.siteId || !form.materialId || !form.quantity || !form.consumedDate) {
                  showToast("Fill all required fields", "error");
                  return;
                }
                createMutation.mutate(form, {
                  onSuccess: () => { showToast("Consumption recorded"); setCreateOpen(false); resetForm(); },
                  onError: (err) => showToast(getApiErrorMessage(err, "Failed to record consumption"), "error"),
                });
              }} disabled={createMutation.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm whitespace-nowrap">Filter by Site</Label>
        <div className="w-64">
          <Select value={query.siteId} onValueChange={(v) => setQuery(prev => ({ ...prev, siteId: v ?? "", page: 1 }))}>
            <SelectTrigger><SelectValue placeholder="All sites" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All sites</SelectItem>
              {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="Delete Consumption Record"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) {
            deleteMutation.mutate(confirmDelete, {
              onSuccess: () => showToast("Consumption record deleted"),
              onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete"), "error"),
            });
          }
          setConfirmDelete(null);
        }}
        loading={deleteMutation.isPending}
      >
        Delete this consumption record and restore inventory?
      </ConfirmDialog>
    </div>
  );
}
