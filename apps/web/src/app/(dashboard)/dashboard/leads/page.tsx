"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, ArrowRight, LayoutGrid, Table } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useLeads, useCreateLead, useUpdateLead, useUpdateLeadStatus, useConvertLead, useDeleteLead, useProperties, useEmployees, useCustomers, useCurrentUser } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import type { CreateLeadDto, Lead, UpdateLeadDto } from "@/lib/types";
import { LeadsKanban } from "@/components/crm/leads-kanban";
import { FieldError } from "@/components/shared/field-error";
import { validateForm, clearFieldError } from "@/components/shared/form-validation";
import type { ValidationRules } from "@/components/shared/form-validation";

type LeadForm = Partial<CreateLeadDto> & {
  customerId?: string;
};

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800", CONVERTED: "bg-green-100 text-green-800", DECLINED: "bg-red-100 text-red-800",
};
const statusGroups = ["NEW", "CONTACTED", "INTERESTED", "SITE_VISIT_SCHEDULED", "NEGOTIATION"];
const allStatuses = ["NEW", "CONTACTED", "INTERESTED", "SITE_VISIT_SCHEDULED", "NEGOTIATION", "CONVERTED", "LOST"];
const statusLabels: Record<string, string> = { NEW: "New", CONTACTED: "Contacted", INTERESTED: "Interested", SITE_VISIT_SCHEDULED: "Site Visit", NEGOTIATION: "Negotiation", CONVERTED: "Converted", LOST: "Lost" };

export default function LeadsPage() {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
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
  const updateStatusMutation = useUpdateLeadStatus();
  const { showToast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role;
  const canManage = role === "OWNER" || role === "ADMIN";
  const [form, setForm] = useState<LeadForm>({});
  const [errors, setErrors] = useState<Partial<Record<"customerName", string>>>({});
  const [confirmAction, setConfirmAction] = useState<{ type: "delete" | "convert"; leadId: string } | null>(null);

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
      if (row.original.status === "CONVERTED") {
        return <Badge variant="outline" className={statusColors["CONVERTED"]}>Converted</Badge>;
      }
      return (
        <Select value={st} onValueChange={(v) => {
          if (!v) return;
          updateStatusMutation.mutate({ id: row.original.id, status: v }, {
            onError: (err) => showToast(getApiErrorMessage(err, "Failed to update status"), "error"),
          });
        }}>
          <SelectTrigger className="h-7 w-auto text-xs border-0 bg-transparent"><SelectValue /></SelectTrigger>
          <SelectContent>{allStatuses.filter(s => s !== "CONVERTED").map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent>
        </Select>
      );
    }},
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {row.original.status !== "CONVERTED" && <Button variant="ghost" size="icon-sm" onClick={() => setConfirmAction({ type: "convert", leadId: row.original.id })}><ArrowRight className="h-4 w-4 text-green-600" /></Button>}
        {canManage && (<>
          <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ customerName: row.original.customerName, customerEmail: row.original.customerEmail ?? undefined, customerPhone: row.original.customerPhone ?? undefined, source: row.original.source, status: row.original.status, notes: row.original.notes ?? undefined, propertyId: row.original.propertyId ?? undefined, assignedToEmployeeId: row.original.assignedToEmployeeId ?? undefined, customerId: row.original.convertedToCustomerId ?? undefined } as LeadForm); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setConfirmAction({ type: "delete", leadId: row.original.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </>)}
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Leads</h2><p className="text-sm text-muted-foreground">Track and manage your leads</p></div>
        {canManage && (
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Lead</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add Lead</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="text-sm font-medium">Customer Name</label><Input value={form.customerName || ""} onChange={(e) => { setForm({ ...form, customerName: e.target.value } as LeadForm); clearFieldError("customerName", setErrors); }} className={errors.customerName ? "border-red-500" : ""} /><FieldError error={errors.customerName} /></div>
                <div><label className="text-sm font-medium">Email</label><Input value={form.customerEmail || ""} onChange={(e) => setForm({ ...form, customerEmail: e.target.value } as LeadForm)} /></div>
                <div><label className="text-sm font-medium">Phone</label><Input value={form.customerPhone || ""} onChange={(e) => setForm({ ...form, customerPhone: e.target.value } as LeadForm)} /></div>
                <div><label className="text-sm font-medium">Source</label><Select value={form.source || "WEBSITE"} onValueChange={(v) => setForm({ ...form, source: v } as LeadForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{"WEBSITE,REFERRAL,SOCIAL_MEDIA,PHONE_INQUIRY,WALK_IN,OTHER".split(",").map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div><label className="text-sm font-medium">Status</label><Select value={form.status || "NEW"} onValueChange={(v) => setForm({ ...form, status: v } as LeadForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{allStatuses.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent></Select></div>
                <div><label className="text-sm font-medium">Customer</label><Select value={form.customerId || ""} onValueChange={(v) => setForm({ ...form, customerId: v || undefined } as LeadForm)}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                <div><label className="text-sm font-medium">Property</label><Select value={form.propertyId || ""} onValueChange={(v) => setForm({ ...form, propertyId: v || undefined } as LeadForm)}><SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div>
                <div><label className="text-sm font-medium">Assigned To</label><Select value={form.assignedToEmployeeId || ""} onValueChange={(v) => setForm({ ...form, assignedToEmployeeId: v || undefined } as LeadForm)}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.user ? `${e.user.firstName} ${e.user.lastName}` : e.employeeCode}</SelectItem>)}</SelectContent></Select></div>
                <div className="col-span-2"><label className="text-sm font-medium">Notes</label><Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value } as LeadForm)} /></div>
              </div>
            <DialogFooter showCloseButton><Button onClick={() => { const rules: ValidationRules<LeadForm> = { customerName: { required: "Customer name is required" } }; const fieldErrors = validateForm(form, rules); setErrors(fieldErrors); if (Object.keys(fieldErrors).length > 0) return; const dto: CreateLeadDto = { customerName: form.customerName!, customerEmail: form.customerEmail || undefined, customerPhone: form.customerPhone || undefined, source: form.source!, status: form.status!, notes: form.notes || undefined, propertyId: form.propertyId || undefined, assignedToEmployeeId: form.assignedToEmployeeId || undefined, customerId: form.customerId || undefined }; createMutation.mutate(dto, { onSuccess: () => { setCreateOpen(false); resetForm(); setErrors({}); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create lead"), "error") }); }} disabled={createMutation.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        )}
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

      <div className="flex items-center gap-2">
        <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("table")}>
          <Table className="h-4 w-4" /> Table
        </Button>
        <Button variant={viewMode === "kanban" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("kanban")}>
          <LayoutGrid className="h-4 w-4" /> Board
        </Button>
      </div>

      {viewMode === "kanban" ? (
        <LeadsKanban />
      ) : (
        <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="leads" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />
      )}

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Lead</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-sm font-medium">Customer Name</label><Input value={form.customerName || ""} onChange={(e) => { setForm({ ...form, customerName: e.target.value } as LeadForm); clearFieldError("customerName", setErrors); }} className={errors.customerName ? "border-red-500" : ""} /><FieldError error={errors.customerName} /></div>
            <div><label className="text-sm font-medium">Email</label><Input value={form.customerEmail || ""} onChange={(e) => setForm({ ...form, customerEmail: e.target.value } as LeadForm)} /></div>
            <div><label className="text-sm font-medium">Phone</label><Input value={form.customerPhone || ""} onChange={(e) => setForm({ ...form, customerPhone: e.target.value } as LeadForm)} /></div>
            <div><label className="text-sm font-medium">Status</label><Select value={form.status || "NEW"} onValueChange={(v) => setForm({ ...form, status: v } as LeadForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{allStatuses.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Source</label><Select value={form.source || "WEBSITE"} onValueChange={(v) => setForm({ ...form, source: v } as LeadForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{"WEBSITE,REFERRAL,SOCIAL_MEDIA,PHONE_INQUIRY,WALK_IN,OTHER".split(",").map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Customer</label><Select value={form.customerId || ""} onValueChange={(v) => setForm({ ...form, customerId: v || undefined } as LeadForm)}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Property</label><Select value={form.propertyId || ""} onValueChange={(v) => setForm({ ...form, propertyId: v || undefined } as LeadForm)}><SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Assigned To</label><Select value={form.assignedToEmployeeId || ""} onValueChange={(v) => setForm({ ...form, assignedToEmployeeId: v || undefined } as LeadForm)}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.user ? `${e.user.firstName} ${e.user.lastName}` : e.employeeCode}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter showCloseButton><Button onClick={() => { if (editItem) { const rules: ValidationRules<LeadForm> = { customerName: { required: "Customer name is required" } }; const fieldErrors = validateForm(form, rules); setErrors(fieldErrors); if (Object.keys(fieldErrors).length > 0) return; const dto: UpdateLeadDto = { customerName: form.customerName!, customerEmail: form.customerEmail || undefined, customerPhone: form.customerPhone || undefined, source: form.source!, notes: form.notes || undefined, propertyId: form.propertyId || undefined, assignedToEmployeeId: form.assignedToEmployeeId || undefined, customerId: form.customerId || undefined }; const onEditDone = () => { setEditItem(null); setErrors({}); }; const doUpdate = () => updateMutation.mutate({ id: editItem.id, dto }, { onSuccess: onEditDone, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update lead"), "error") }); if (form.status && form.status !== editItem.status) { updateStatusMutation.mutate({ id: editItem.id, status: form.status }, { onSuccess: doUpdate, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update status"), "error") }); } else { doUpdate(); } } } } disabled={updateMutation.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmAction?.type === "delete"}
        onOpenChange={(o) => { if (!o) setConfirmAction(null); }}
        title="Delete Lead"
        variant="destructive"
        onConfirm={() => {
          if (confirmAction) {
            deleteMutation.mutate(confirmAction.leadId, {
              onSuccess: () => { setConfirmAction(null); showToast("Lead deleted"); },
              onError: (err) => { setConfirmAction(null); showToast(getApiErrorMessage(err, "Failed to delete lead"), "error"); },
            });
          } else {
            setConfirmAction(null);
          }
        }}
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this lead?
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmAction?.type === "convert"}
        onOpenChange={(o) => { if (!o) setConfirmAction(null); }}
        title="Convert Lead"
        onConfirm={() => {
          if (confirmAction) {
            convertMutation.mutate(confirmAction.leadId, {
              onSuccess: () => { setConfirmAction(null); showToast("Lead converted"); },
              onError: (err) => { setConfirmAction(null); showToast(getApiErrorMessage(err, "Failed to convert lead"), "error"); },
            });
          } else {
            setConfirmAction(null);
          }
        }}
        loading={convertMutation.isPending}
      >
        Convert this lead to a customer?
      </ConfirmDialog>
    </div>
  );
}
