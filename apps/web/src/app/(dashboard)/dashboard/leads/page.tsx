"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useLeads, useCreateLead, useUpdateLead, useConvertLead, useDeleteLead, useProperties, useEmployees, useCustomers } from "@/hooks/api";
import type { CreateLeadDto, Lead, UpdateLeadDto } from "@/lib/types";

type LeadForm = Partial<CreateLeadDto> & {
  customerId?: string;
};

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800", CONVERTED: "bg-green-100 text-green-800", DECLINED: "bg-red-100 text-red-800",
};
const statusGroups = ["NEW", "CONTACTED", "INTERESTED", "SITE_VISIT_SCHEDULED", "NEGOTIATION"];
const displayStatuses = [
  { value: "NEW", label: "Open" },
  { value: "CONVERTED", label: "Converted" },
  { value: "LOST", label: "Declined" },
];

export default function LeadsPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const, search: "" });
  const { data, isLoading } = useLeads(query);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Lead | null>(null);
  const dialogOpen = createOpen || !!editItem;
  const { data: propData } = useProperties({ limit: 200 }, { enabled: dialogOpen });
  const { data: empData } = useEmployees({ limit: 200 }, { enabled: dialogOpen });
  const { data: custData } = useCustomers({ limit: 200 }, { enabled: dialogOpen });
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();
  const deleteMutation = useDeleteLead();
  const convertMutation = useConvertLead();
  const [form, setForm] = useState<LeadForm>({});

  const properties = propData?.data || [];
  const employees = empData?.data || [];
  const customers = custData?.data || [];

  const resetForm = () => setForm({ customerName: "", customerEmail: "", customerPhone: "", source: "WEBSITE", status: "NEW", notes: "" });

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (data?.data || []).forEach((l: Lead) => { c[l.status] = (c[l.status] || 0) + 1; });
    return c;
  }, [data]);

  const columns: ColumnDef<Lead>[] = [
    { accessorKey: "customerName", header: "Name", cell: ({ row }) => <span className="font-medium">{row.original.customerName}</span> },
    { accessorKey: "customerEmail", header: "Email" },
    { accessorKey: "customerPhone", header: "Phone" },
    { accessorKey: "source", header: "Source", cell: ({ row }) => <Badge variant="outline">{row.original.source}</Badge> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => {
      const st = row.original.status;
      const isOpen = statusGroups.includes(st);
      const display = isOpen ? "OPEN" : st === "LOST" ? "DECLINED" : "CONVERTED";
      return <Badge variant="outline" className={statusColors[display]}>{isOpen ? "Open" : st === "LOST" ? "Declined" : "Converted"}</Badge>;
    }},
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {row.original.status !== "CONVERTED" && <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Convert this lead to customer?")) convertMutation.mutate(row.original.id); }}><ArrowRight className="h-4 w-4 text-green-600" /></Button>}
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ ...row.original, customerId: row.original.convertedToCustomerId || undefined } as LeadForm); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Delete this lead?")) deleteMutation.mutate(row.original.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Leads</h2><p className="text-sm text-muted-foreground">Track and manage your leads</p></div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Lead</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add Lead</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="text-sm font-medium">Customer Name</label><Input value={form.customerName || ""} onChange={(e) => setForm({ ...form, customerName: e.target.value } as LeadForm)} /></div>
                <div><label className="text-sm font-medium">Email</label><Input value={form.customerEmail || ""} onChange={(e) => setForm({ ...form, customerEmail: e.target.value } as LeadForm)} /></div>
                <div><label className="text-sm font-medium">Phone</label><Input value={form.customerPhone || ""} onChange={(e) => setForm({ ...form, customerPhone: e.target.value } as LeadForm)} /></div>
                <div><label className="text-sm font-medium">Source</label><Select value={form.source || "WEBSITE"} onValueChange={(v) => setForm({ ...form, source: v } as LeadForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{"WEBSITE,REFERRAL,SOCIAL_MEDIA,PHONE_INQUIRY,WALK_IN,OTHER".split(",").map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div><label className="text-sm font-medium">Status</label><Select value={form.status || "NEW"} onValueChange={(v) => setForm({ ...form, status: v } as LeadForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{displayStatuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
                <div><label className="text-sm font-medium">Customer</label><Select value={form.customerId || ""} onValueChange={(v) => setForm({ ...form, customerId: v || undefined } as LeadForm)}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                <div><label className="text-sm font-medium">Property</label><Select value={form.propertyId || ""} onValueChange={(v) => setForm({ ...form, propertyId: v || undefined } as LeadForm)}><SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div>
                <div><label className="text-sm font-medium">Assigned To</label><Select value={form.assignedToEmployeeId || ""} onValueChange={(v) => setForm({ ...form, assignedToEmployeeId: v || undefined } as LeadForm)}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.user ? `${e.user.firstName} ${e.user.lastName}` : e.employeeCode}</SelectItem>)}</SelectContent></Select></div>
                <div className="col-span-2"><label className="text-sm font-medium">Notes</label><Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value } as LeadForm)} /></div>
              </div>
            <DialogFooter showCloseButton><Button onClick={() => { if (!form.customerName) { alert("Customer name is required"); return; } createMutation.mutate(form as CreateLeadDto); setCreateOpen(false); resetForm(); }} disabled={createMutation.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { key: "OPEN", label: "Open", color: "bg-blue-100 text-blue-800", count: statusGroups.reduce((sum, s) => sum + (counts[s] || 0), 0) },
          { key: "CONVERTED", label: "Converted", color: "bg-green-100 text-green-800", count: counts["CONVERTED"] || 0 },
          { key: "DECLINED", label: "Declined", color: "bg-red-100 text-red-800", count: counts["LOST"] || 0 },
        ].map((s) => (
          <Card key={s.key}>
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <Badge variant="outline" className={s.color}>{s.count}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="leads" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Lead</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-sm font-medium">Customer Name</label><Input value={form.customerName || ""} onChange={(e) => setForm({ ...form, customerName: e.target.value } as LeadForm)} /></div>
            <div><label className="text-sm font-medium">Email</label><Input value={form.customerEmail || ""} onChange={(e) => setForm({ ...form, customerEmail: e.target.value } as LeadForm)} /></div>
            <div><label className="text-sm font-medium">Phone</label><Input value={form.customerPhone || ""} onChange={(e) => setForm({ ...form, customerPhone: e.target.value } as LeadForm)} /></div>
            <div><label className="text-sm font-medium">Status</label><Select value={form.status || "NEW"} onValueChange={(v) => setForm({ ...form, status: v } as LeadForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{displayStatuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Source</label><Select value={form.source || "WEBSITE"} onValueChange={(v) => setForm({ ...form, source: v } as LeadForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{"WEBSITE,REFERRAL,SOCIAL_MEDIA,PHONE_INQUIRY,WALK_IN,OTHER".split(",").map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Customer</label><Select value={form.customerId || ""} onValueChange={(v) => setForm({ ...form, customerId: v || undefined } as LeadForm)}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Property</label><Select value={form.propertyId || ""} onValueChange={(v) => setForm({ ...form, propertyId: v || undefined } as LeadForm)}><SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Assigned To</label><Select value={form.assignedToEmployeeId || ""} onValueChange={(v) => setForm({ ...form, assignedToEmployeeId: v || undefined } as LeadForm)}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.user ? `${e.user.firstName} ${e.user.lastName}` : e.employeeCode}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter showCloseButton><Button onClick={() => { if (editItem) { updateMutation.mutate({ id: editItem.id, dto: form as UpdateLeadDto }); setEditItem(null); } }} disabled={updateMutation.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
