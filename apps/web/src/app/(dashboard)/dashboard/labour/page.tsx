"use client";

import { useState } from "react";
import { useLabourEntries, useCreateLabourEntry, useDeleteLabourEntry, useSites } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Plus, Trash2, Users, HardHat } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton-variants";
import { EmptyState } from "@/components/shared/empty-state";
import { format } from "date-fns";
import type { LabourEntry, CreateLabourEntryDto, LabourType } from "@/lib/types";

const labourTypeStyles: Record<LabourType, string> = {
  SKILLED: "bg-blue-100 text-blue-800",
  UNSKILLED: "bg-gray-100 text-gray-800",
  SUPERVISOR: "bg-purple-100 text-purple-800",
};

function LabourForm({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { showToast } = useToast();
  const { data: sitesData } = useSites();
  const createMutation = useCreateLabourEntry();
  const sites = sitesData?.data ?? [];
  const [form, setForm] = useState<CreateLabourEntryDto>({
    siteId: "",
    labourName: "",
    labourType: "SKILLED",
    date: new Date().toISOString().slice(0, 10),
    hoursWorked: undefined,
    wagesAmount: 0,
    notes: "",
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setForm({ siteId: "", labourName: "", labourType: "SKILLED", date: new Date().toISOString().slice(0, 10), hoursWorked: undefined, wagesAmount: 0, notes: "" }); }}>
      <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Labour</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Add Labour Entry</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Site *</label>
            <Select value={form.siteId} onValueChange={(v) => setForm({ ...form, siteId: v || "" })}>
              <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
              <SelectContent>
                {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Labour Name *</label>
            <Input value={form.labourName} onChange={(e) => setForm({ ...form, labourName: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Labour Type *</label>
            <Select value={form.labourType} onValueChange={(v) => setForm({ ...form, labourType: (v || "SKILLED") as LabourType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SKILLED">Skilled</SelectItem>
                <SelectItem value="UNSKILLED">Unskilled</SelectItem>
                <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Date *</label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Hours Worked</label>
            <Input type="number" value={form.hoursWorked ?? ""} onChange={(e) => setForm({ ...form, hoursWorked: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div>
            <label className="text-sm font-medium">Wages Amount *</label>
            <Input type="number" value={form.wagesAmount || ""} onChange={(e) => setForm({ ...form, wagesAmount: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button onClick={() => {
            if (!form.siteId || !form.labourName || !form.date || !form.wagesAmount) return;
            createMutation.mutate(form, {
              onSuccess: () => { showToast("Labour entry added"); onOpenChange(false); },
              onError: (err: Error) => showToast(err.message || "Failed", "error"),
            });
          }} disabled={createMutation.isPending}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LabourPage() {
  const { showToast } = useToast();
  const { data, isLoading } = useLabourEntries();
  const deleteMutation = useDeleteLabourEntry();
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const entries = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2"><Users className="h-6 w-6" /> Site Labour</h2>
          <p className="text-sm text-muted-foreground">Track labour entries across construction sites</p>
        </div>
        <LabourForm open={createOpen} onOpenChange={setCreateOpen} />
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Site</th>
                    <th className="pb-2 font-medium">Labour Name</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Hours</th>
                    <th className="pb-2 font-medium">Wages</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry: LabourEntry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{entry.site?.name ?? entry.siteId}</td>
                      <td className="py-2">{entry.labourName}</td>
                      <td className="py-2"><Badge variant="outline" className={labourTypeStyles[entry.labourType]}>{entry.labourType}</Badge></td>
                      <td className="py-2">{format(new Date(entry.date), "MMM dd, yyyy")}</td>
                      <td className="py-2">{entry.hoursWorked ?? "-"}</td>
                      <td className="py-2">₹{Number(entry.wagesAmount).toLocaleString()}</td>
                      <td className="py-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(entry.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={<HardHat className="h-12 w-12" />} title="No labour entries yet" description="Labour entries will appear here once added" />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="Delete Labour Entry"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) {
            deleteMutation.mutate(confirmDelete, {
              onSuccess: () => showToast("Labour entry deleted"),
              onError: (err: Error) => showToast(err.message || "Failed", "error"),
            });
          }
          setConfirmDelete(null);
        }}
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this labour entry?
      </ConfirmDialog>
    </div>
  );
}
