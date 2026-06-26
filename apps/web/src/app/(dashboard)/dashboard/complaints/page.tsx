"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, CheckCircle2, MessageSquare } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useComplaints, useCreateComplaint, useUpdateComplaint, useDeleteComplaint, useResolveComplaint, useCustomers } from "@/hooks/api";
import { useCurrentUser } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { format } from "date-fns";
import type { Complaint, CreateComplaintDto, ComplaintStatus } from "@/lib/types";

const statusColors: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

const statuses: ComplaintStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function ComplaintsPage() {
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "ALL">("ALL");
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const, search: "" });
  const { data, isLoading } = useComplaints({ ...query, status: statusFilter === "ALL" ? undefined : statusFilter });
  const createMutation = useCreateComplaint();
  const updateMutation = useUpdateComplaint();
  const deleteMutation = useDeleteComplaint();
  const resolveMutation = useResolveComplaint();
  const { showToast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Complaint | null>(null);
  const [resolveItem, setResolveItem] = useState<Complaint | null>(null);
  const [form, setForm] = useState<CreateComplaintDto>({ customerId: "", subject: "", description: "" });
  const [resolution, setResolution] = useState("");
  const dialogOpen = createOpen || !!editItem || !!resolveItem;
  const { data: custData } = useCustomers({ limit: 200 }, { enabled: dialogOpen });
  const customers = custData?.data || [];

  const resetForm = () => setForm({ customerId: "", propertyId: "", subject: "", description: "" });

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (data?.data || []).forEach((comp: Complaint) => { c[comp.status] = (c[comp.status] || 0) + 1; });
    return c;
  }, [data]);

  const columns: ColumnDef<Complaint>[] = [
    { accessorKey: "subject", header: "Subject", cell: ({ row }) => <span className="font-medium">{row.original.subject}</span> },
    { accessorKey: "customer", header: "Customer", cell: ({ row }) => <span>{row.original.customer?.name || row.original.customerId}</span> },
    { accessorKey: "property", header: "Property", cell: ({ row }) => <span>{row.original.property?.title || row.original.propertyId || "-"}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="outline" className={statusColors[row.original.status]}>{row.original.status}</Badge> },
    { accessorKey: "createdAt", header: "Created", cell: ({ row }) => <span>{format(new Date(row.original.createdAt), "MMM dd, yyyy")}</span> },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {(row.original.status === "OPEN" || row.original.status === "IN_PROGRESS") && (
          <Button variant="ghost" size="icon-sm" onClick={() => { setResolveItem(row.original); setResolution(""); }}><CheckCircle2 className="h-4 w-4 text-green-600" /></Button>
        )}
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ customerId: row.original.customerId, propertyId: row.original.propertyId || "", subject: row.original.subject, description: row.original.description }); }}>✏️</Button>
        <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Delete this complaint?")) deleteMutation.mutate(row.original.id, { onSuccess: () => showToast("Complaint deleted"), onError: (e) => showToast(getApiErrorMessage(e, "Failed to delete"), "error") }); }}>🗑️</Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Complaints</h2><p className="text-sm text-muted-foreground">Manage customer complaints and tickets</p></div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Complaint</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add Complaint</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-sm font-medium">Customer</label><Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v ?? "" })}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.email || c.phone || c.id.slice(0, 8)})</SelectItem>)}</SelectContent></Select></div>
              <div className="col-span-2"><label className="text-sm font-medium">Property ID (optional)</label><Input value={form.propertyId || ""} onChange={(e) => setForm({ ...form, propertyId: e.target.value || undefined })} /></div>
              <div className="col-span-2"><label className="text-sm font-medium">Subject *</label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
              <div className="col-span-2"><label className="text-sm font-medium">Description *</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter showCloseButton><Button onClick={() => { if (!form.customerId || !form.subject || !form.description) { showToast("Please fill Customer ID, Subject, and Description", "error"); return; } createMutation.mutate(form, { onSuccess: () => { setCreateOpen(false); resetForm(); showToast("Complaint created"); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create complaint"), "error"), }); }} disabled={createMutation.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status:</span>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ComplaintStatus | "ALL")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ALL</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {statuses.map((s) => (
          <Card key={s}>
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s}</span>
              <Badge variant="outline" className={statusColors[s]}>{counts[s] || 0}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="complaints" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      <Dialog open={!!resolveItem} onOpenChange={(o) => { if (!o) setResolveItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Resolve Complaint</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Resolution Notes</label><Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Describe the resolution..." /></div>
          </div>
          <DialogFooter showCloseButton><Button onClick={() => { if (!resolveItem) return; if (!resolution) { showToast("Please provide resolution notes", "error"); return; } resolveMutation.mutate({ id: resolveItem.id, resolution }, { onSuccess: () => { setResolveItem(null); setResolution(""); showToast("Complaint resolved"); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to resolve complaint"), "error"), }); }} disabled={resolveMutation.isPending}>Resolve</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
