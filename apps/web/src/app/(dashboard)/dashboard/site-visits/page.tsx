"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useSiteVisits, useCreateSiteVisit, useUpdateSiteVisit, useDeleteSiteVisit, useCreateBooking, useProperties, useCustomers, useEmployees, useLeads } from "@/hooks/api";
import { useQueryClient } from "@tanstack/react-query";
import type { CreateBookingDto, CreateSiteVisitDto, SiteVisit, SiteVisitStatus, UpdateSiteVisitDto } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { FieldError } from "@/components/shared/field-error";
import { validateForm, clearFieldError } from "@/components/shared/form-validation";
import type { ValidationRules } from "@/components/shared/form-validation";
import { format } from "date-fns";

type SiteVisitForm = Partial<CreateSiteVisitDto> & {
  scheduledDate?: string;
  status?: SiteVisitStatus;
};

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800", COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800", RESCHEDULED: "bg-yellow-100 text-yellow-800",
};

export default function SiteVisitsPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const, search: "" });
  const { data, isLoading } = useSiteVisits(query);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<SiteVisit | null>(null);
  const dialogOpen = createOpen || !!editItem;
  const { data: propData } = useProperties({ limit: 100 }, { enabled: dialogOpen });
  const { data: custData } = useCustomers({ limit: 100 }, { enabled: dialogOpen });
  const { data: empData } = useEmployees({ limit: 100 }, { enabled: dialogOpen });
  const { data: leadData } = useLeads({ limit: 100 }, { enabled: dialogOpen });
  const queryClient = useQueryClient();
  const createMutation = useCreateSiteVisit();
  const updateMutation = useUpdateSiteVisit();
  const deleteMutation = useDeleteSiteVisit();
  const createBookingMutation = useCreateBooking();
  const { showToast } = useToast();
  const [form, setForm] = useState<SiteVisitForm>({});
  const [errors, setErrors] = useState<Partial<Record<"propertyId" | "customerId" | "assignedToEmployeeId" | "scheduledDate", string>>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const properties = propData?.data || [];
  const customers = custData?.data || [];
  const employees = empData?.data || [];
  const leads = leadData?.data || [];

  const resetForm = () => setForm({ propertyId: "", customerId: "", scheduledDate: "", status: "SCHEDULED", notes: "", assignedToEmployeeId: "" });

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (data?.data || []).forEach((sv: SiteVisit) => { c[sv.status] = (c[sv.status] || 0) + 1; });
    return c;
  }, [data]);

  const columns: ColumnDef<SiteVisit>[] = [
    { accessorKey: "property", header: "Property", cell: ({ row }) => <span className="font-medium">{row.original.property?.title || row.original.propertyId}</span> },
    { accessorKey: "customer", header: "Customer", cell: ({ row }) => <span>{row.original.customer?.name || row.original.customerId}</span> },
    { accessorKey: "scheduledDate", header: "Scheduled", cell: ({ row }) => <span>{format(new Date(row.original.scheduledDate), "MMM dd, yyyy HH:mm")}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="outline" className={statusColors[row.original.status]}>{row.original.status}</Badge> },
    { accessorKey: "notes", header: "Notes", cell: ({ row }) => <span className="text-muted-foreground">{row.original.notes || "-"}</span> },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {row.original.status === "COMPLETED" && (
          <Button variant="ghost" size="icon-sm" disabled={createBookingMutation.isPending} onClick={() => {
            createBookingMutation.mutate({
              propertyId: row.original.propertyId,
              customerId: row.original.customerId,
              leadId: row.original.leadId || undefined,
              assignedToEmployeeId: row.original.assignedToEmployeeId,
              bookingDate: new Date().toISOString(),
              amount: 0,
              notes: `Booking from site visit ${row.original.id}`,
            } as CreateBookingDto, {
              onSuccess: () => {
                showToast("Booking created from site visit");
                queryClient.invalidateQueries({ queryKey: ["bookings"] });
              },
              onError: (err) => showToast(getApiErrorMessage(err, "Failed to create booking"), "error"),
            });
          }}><FileText className="h-4 w-4 text-blue-600" /></Button>
        )}
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ propertyId: row.original.propertyId, customerId: row.original.customerId, status: row.original.status, assignedToEmployeeId: row.original.assignedToEmployeeId, leadId: row.original.leadId ?? undefined, notes: row.original.notes ?? undefined, feedback: row.original.feedback ?? undefined, scheduledDate: row.original.scheduledDate.slice(0, 16) } as SiteVisitForm); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(row.original.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Site Visits</h2><p className="text-sm text-muted-foreground">Manage scheduled site visits</p></div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Site Visit</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add Site Visit</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Property</label><Select value={form.propertyId || ""} onValueChange={(v) => { setForm({ ...form, propertyId: v } as SiteVisitForm); clearFieldError("propertyId", setErrors); }}><SelectTrigger className={errors.propertyId ? "border-red-500" : ""}><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select><FieldError error={errors.propertyId} /></div>
              <div><label className="text-sm font-medium">Customer</label><Select value={form.customerId || ""} onValueChange={(v) => { setForm({ ...form, customerId: v } as SiteVisitForm); clearFieldError("customerId", setErrors); }}><SelectTrigger className={errors.customerId ? "border-red-500" : ""}><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FieldError error={errors.customerId} /></div>
              <div><label className="text-sm font-medium">Lead (optional)</label><Select value={form.leadId || ""} onValueChange={(v) => setForm({ ...form, leadId: v || undefined } as SiteVisitForm)}><SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger><SelectContent>{leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.customerName}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium">Assigned To</label><Select value={form.assignedToEmployeeId || ""} onValueChange={(v) => { setForm({ ...form, assignedToEmployeeId: v } as SiteVisitForm); clearFieldError("assignedToEmployeeId", setErrors); }}><SelectTrigger className={errors.assignedToEmployeeId ? "border-red-500" : ""}><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.user ? `${e.user.firstName} ${e.user.lastName}` : e.employeeCode}</SelectItem>)}</SelectContent></Select><FieldError error={errors.assignedToEmployeeId} /></div>
              <div className="col-span-2"><label className="text-sm font-medium">Scheduled Date</label><Input type="datetime-local" value={form.scheduledDate || ""} onChange={(e) => { setForm({ ...form, scheduledDate: e.target.value } as SiteVisitForm); clearFieldError("scheduledDate", setErrors); }} className={errors.scheduledDate ? "border-red-500" : ""} /><FieldError error={errors.scheduledDate} /></div>
              <div><label className="text-sm font-medium">Status</label><Select value={form.status || "SCHEDULED"} onValueChange={(v) => setForm({ ...form, status: v } as SiteVisitForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SCHEDULED">Scheduled</SelectItem><SelectItem value="COMPLETED">Completed</SelectItem><SelectItem value="CANCELLED">Cancelled</SelectItem><SelectItem value="RESCHEDULED">Rescheduled</SelectItem></SelectContent></Select></div>
              <div className="col-span-2"><label className="text-sm font-medium">Notes</label><Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value } as SiteVisitForm)} /></div>
            </div>
            <DialogFooter showCloseButton><Button onClick={() => { const rules: ValidationRules<CreateSiteVisitDto> = { propertyId: { required: "Property is required" }, customerId: { required: "Customer is required" }, assignedToEmployeeId: { required: "Assigned employee is required" }, scheduledDate: { required: "Date is required" } }; const errs = validateForm(form, rules); setErrors(errs); if (Object.keys(errs).length > 0) return; createMutation.mutate({ propertyId: form.propertyId!, customerId: form.customerId!, leadId: form.leadId || undefined, assignedToEmployeeId: form.assignedToEmployeeId!, scheduledDate: new Date(form.scheduledDate!).toISOString(), status: form.status || "SCHEDULED", notes: form.notes || undefined } as CreateSiteVisitDto, { onSuccess: () => { setErrors({}); setCreateOpen(false); resetForm(); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create site visit"), "error") }); }} disabled={createMutation.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[{ status: "SCHEDULED", label: "Scheduled", color: "bg-blue-100 text-blue-800" },
          { status: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-800" },
          { status: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-800" },
          { status: "RESCHEDULED", label: "Rescheduled", color: "bg-yellow-100 text-yellow-800" },
        ].map((s) => (
          <Card key={s.status}>
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <Badge variant="outline" className={s.color}>{counts[s.status] || 0}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="site visits" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Site Visit</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium">Property</label><Select value={form.propertyId || ""} onValueChange={(v) => { setForm({ ...form, propertyId: v } as SiteVisitForm); clearFieldError("propertyId", setErrors); }}><SelectTrigger className={errors.propertyId ? "border-red-500" : ""}><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select><FieldError error={errors.propertyId} /></div>
            <div><label className="text-sm font-medium">Customer</label><Select value={form.customerId || ""} onValueChange={(v) => { setForm({ ...form, customerId: v } as SiteVisitForm); clearFieldError("customerId", setErrors); }}><SelectTrigger className={errors.customerId ? "border-red-500" : ""}><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FieldError error={errors.customerId} /></div>
            <div><label className="text-sm font-medium">Lead (optional)</label><Select value={form.leadId || ""} onValueChange={(v) => setForm({ ...form, leadId: v || undefined } as SiteVisitForm)}><SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger><SelectContent>{leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.customerName}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Assigned To</label><Select value={form.assignedToEmployeeId || ""} onValueChange={(v) => { setForm({ ...form, assignedToEmployeeId: v } as SiteVisitForm); clearFieldError("assignedToEmployeeId", setErrors); }}><SelectTrigger className={errors.assignedToEmployeeId ? "border-red-500" : ""}><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.user ? `${e.user.firstName} ${e.user.lastName}` : e.employeeCode}</SelectItem>)}</SelectContent></Select><FieldError error={errors.assignedToEmployeeId} /></div>
            <div className="col-span-2"><label className="text-sm font-medium">Scheduled Date</label><Input type="datetime-local" value={form.scheduledDate || ""} onChange={(e) => { setForm({ ...form, scheduledDate: e.target.value } as SiteVisitForm); clearFieldError("scheduledDate", setErrors); }} className={errors.scheduledDate ? "border-red-500" : ""} /><FieldError error={errors.scheduledDate} /></div>
            <div><label className="text-sm font-medium">Status</label><Select value={form.status || "SCHEDULED"} onValueChange={(v) => setForm({ ...form, status: v } as SiteVisitForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SCHEDULED">Scheduled</SelectItem><SelectItem value="COMPLETED">Completed</SelectItem><SelectItem value="CANCELLED">Cancelled</SelectItem><SelectItem value="RESCHEDULED">Rescheduled</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter showCloseButton><Button onClick={() => { if (editItem) { const rules: ValidationRules<CreateSiteVisitDto> = { propertyId: { required: "Property is required" }, customerId: { required: "Customer is required" }, assignedToEmployeeId: { required: "Assigned employee is required" }, scheduledDate: { required: "Date is required" } }; const errs = validateForm(form, rules); setErrors(errs); if (Object.keys(errs).length > 0) return; updateMutation.mutate({ id: editItem.id, dto: { propertyId: form.propertyId!, customerId: form.customerId!, leadId: form.leadId || undefined, assignedToEmployeeId: form.assignedToEmployeeId!, scheduledDate: new Date(form.scheduledDate!).toISOString(), status: form.status || undefined, notes: form.notes || undefined } as UpdateSiteVisitDto }, { onSuccess: () => { setErrors({}); setEditItem(null); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update site visit"), "error") }); } }} disabled={updateMutation.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="Delete Site Visit"
        variant="destructive"
         onConfirm={() => {
          if (confirmDelete) {
            deleteMutation.mutate(confirmDelete, { onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete site visit"), "error") });
          }
          setConfirmDelete(null);
        }}
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this site visit?
      </ConfirmDialog>
    </div>
  );
}
