"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Download, Eye, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuotations, useCreateQuotation, useUpdateQuotationStatus, useQuotationAccessLogs, useDownloadQuotationPdf, useProperties, useCustomers, useLeads, useCurrentUser } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { FieldError } from "@/components/shared/field-error";
import { validateForm, clearFieldError } from "@/components/shared/form-validation";
import type { ValidationRules } from "@/components/shared/form-validation";
import type { Quotation, QuotationStatus, QuotationItem, CreateQuotationDto } from "@/lib/types";
import { format } from "date-fns";

const STATUS_CONFIG: Record<QuotationStatus, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-800" },
  SENT: { label: "Sent", color: "bg-blue-100 text-blue-800" },
  ACCEPTED: { label: "Accepted", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
  EXPIRED: { label: "Expired", color: "bg-yellow-100 text-yellow-800" },
};

type QuotationForm = {
  referenceNumber: string;
  leadId: string;
  propertyId: string;
  customerId: string;
  totalAmount: number;
  breakdown: QuotationItem[];
  validUntil: string;
  notes: string;
};

function getNextStatuses(status: QuotationStatus): QuotationStatus[] {
  switch (status) {
    case "DRAFT": return ["SENT"];
    case "SENT": return ["ACCEPTED", "REJECTED"];
    case "ACCEPTED": return ["EXPIRED"];
    default: return [];
  }
}

export default function QuotationsPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const });
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data, isLoading } = useQuotations({ ...query, status: (statusFilter as QuotationStatus) || undefined });

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Quotation | null>(null);
  const [accessLogsId, setAccessLogsId] = useState<string | null>(null);
  const dialogOpen = createOpen || !!editItem;

  const { data: propData } = useProperties({ limit: 200 }, { enabled: dialogOpen });
  const { data: custData } = useCustomers({ limit: 200 }, { enabled: dialogOpen });
  const { data: leadData } = useLeads({ limit: 200 }, { enabled: dialogOpen });

  const createMutation = useCreateQuotation();
  const updateStatusMutation = useUpdateQuotationStatus();
  const downloadPdf = useDownloadQuotationPdf();
  const { data: currentUser } = useCurrentUser();
  const { showToast } = useToast();

  const role = currentUser?.user?.role;
  const canManage = role === "OWNER" || role === "ADMIN";
  const canViewLogs = role === "OWNER" || role === "ADMIN" || role === "HR_MANAGER";

  const properties = propData?.data || [];
  const customers = custData?.data || [];
  const leads = leadData?.data || [];

  const [form, setForm] = useState<QuotationForm>(() => ({
    referenceNumber: `Q-${Date.now().toString(36).toUpperCase()}`,
    leadId: "", propertyId: "", customerId: "",
    totalAmount: 0,
    breakdown: [{ label: "", quantity: 1, rate: 0, amount: 0 }],
    validUntil: "", notes: "",
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof QuotationForm, string>>>({});

  const resetForm = () => {
    setForm({
      referenceNumber: `Q-${Date.now().toString(36).toUpperCase()}`,
      leadId: "", propertyId: "", customerId: "",
      totalAmount: 0,
      breakdown: [{ label: "", quantity: 1, rate: 0, amount: 0 }],
      validUntil: "", notes: "",
    });
    setErrors({});
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (data?.data || []).forEach((q: Quotation) => { c[q.status] = (c[q.status] || 0) + 1; });
    return c;
  }, [data]);

  const updateBreakdownItem = (index: number, field: keyof QuotationItem, value: string | number) => {
    const updated = [...form.breakdown];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "rate") {
      updated[index].amount = updated[index].quantity * updated[index].rate;
    }
    setForm({ ...form, breakdown: updated });
  };

  const addBreakdownItem = () => {
    setForm({ ...form, breakdown: [...form.breakdown, { label: "", quantity: 1, rate: 0, amount: 0 }] });
  };

  const removeBreakdownItem = (index: number) => {
    if (form.breakdown.length <= 1) return;
    setForm({ ...form, breakdown: form.breakdown.filter((_, i) => i !== index) });
  };

  const computedTotal = useMemo(() => form.breakdown.reduce((sum, item) => sum + item.quantity * item.rate, 0), [form.breakdown]);

  const handleCreate = () => {
    const rules: ValidationRules<QuotationForm> = {
      referenceNumber: { required: "Reference number is required" },
      validUntil: { required: "Valid until date is required" },
    };
    const fieldErrors = validateForm(form, rules);
    if (form.totalAmount <= 0 && computedTotal <= 0) {
      fieldErrors.totalAmount = "Total amount must be greater than 0";
    }
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    const dto: CreateQuotationDto = {
      referenceNumber: form.referenceNumber,
      totalAmount: computedTotal > 0 ? computedTotal : form.totalAmount,
      breakdown: form.breakdown.filter((item) => item.label.trim() !== ""),
      validUntil: new Date(form.validUntil).toISOString(),
      leadId: form.leadId || undefined,
      propertyId: form.propertyId || undefined,
      customerId: form.customerId || undefined,
      notes: form.notes || undefined,
    };

    createMutation.mutate(dto, {
      onSuccess: () => { showToast("Quotation created successfully", "success"); setCreateOpen(false); resetForm(); },
      onError: (err) => showToast(getApiErrorMessage(err, "Failed to create quotation"), "error"),
    });
  };

  const handleUpdateStatus = (id: string, status: QuotationStatus) => {
    updateStatusMutation.mutate({ id, dto: { status } }, {
      onSuccess: () => showToast(`Quotation status updated to ${STATUS_CONFIG[status].label}`, "success"),
      onError: (err) => showToast(getApiErrorMessage(err, "Failed to update status"), "error"),
    });
  };

  const handleDownloadPdf = (id: string) => {
    downloadPdf.mutate(id, {
      onError: (err) => showToast(getApiErrorMessage(err, "Failed to download PDF"), "error"),
    });
  };

  const columns: ColumnDef<Quotation>[] = [
    {
      accessorKey: "referenceNumber", header: "Reference",
      cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.original.referenceNumber}</span>,
    },
    {
      accessorKey: "customer", header: "Customer",
      cell: ({ row }) => <span>{row.original.customer?.name || row.original.customerId || "—"}</span>,
    },
    {
      accessorKey: "property", header: "Property",
      cell: ({ row }) => <span>{row.original.property?.title || row.original.propertyId || "—"}</span>,
    },
    {
      accessorKey: "totalAmount", header: "Amount",
      cell: ({ row }) => <span>₹{Number(row.original.totalAmount).toLocaleString()}</span>,
    },
    {
      accessorKey: "validUntil", header: "Valid Until",
      cell: ({ row }) => <span>{format(new Date(row.original.validUntil), "MMM dd, yyyy")}</span>,
    },
    {
      accessorKey: "status", header: "Status",
      cell: ({ row }) => {
        const config = STATUS_CONFIG[row.original.status];
        return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "createdAt", header: "Created",
      cell: ({ row }) => <span>{format(new Date(row.original.createdAt), "MMM dd, yyyy")}</span>,
    },
    {
      id: "actions", header: "",
      cell: ({ row }) => {
        const q = row.original;
        const nextStatuses = getNextStatuses(q.status);
        return (
          <div className="flex items-center gap-1">
            {canManage && nextStatuses.length > 0 && (
              <Select value="" onValueChange={(v) => handleUpdateStatus(q.id, v as QuotationStatus)}>
                <SelectTrigger className="h-8 w-auto text-xs px-2">
                  <Pencil className="h-3 w-3 mr-1" /><ChevronDown className="h-3 w-3" />
                </SelectTrigger>
                <SelectContent>
                  {nextStatuses.map((s) => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button variant="ghost" size="icon-sm" onClick={() => handleDownloadPdf(q.id)} disabled={downloadPdf.isPending}>
              <Download className="h-4 w-4" />
            </Button>
            {canViewLogs && (
              <Button variant="ghost" size="icon-sm" onClick={() => setAccessLogsId(accessLogsId === q.id ? null : q.id)}>
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Quotations</h2>
          <p className="text-sm text-muted-foreground">Manage quotations with secure PDF generation and access logging</p>
        </div>
        {canManage && (
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger render={<Button />}><Plus className="h-4 w-4 mr-2" />Create Quotation</DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Quotation</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Reference Number</label>
                  <Input value={form.referenceNumber} onChange={(e) => { setForm({ ...form, referenceNumber: e.target.value }); clearFieldError("referenceNumber", setErrors); }} className={errors.referenceNumber ? "border-red-500" : ""} />
                  <FieldError error={errors.referenceNumber} />
                </div>
                <div>
                  <label className="text-sm font-medium">Valid Until</label>
                  <Input type="date" value={form.validUntil} onChange={(e) => { setForm({ ...form, validUntil: e.target.value }); clearFieldError("validUntil", setErrors); }} className={errors.validUntil ? "border-red-500" : ""} />
                  <FieldError error={errors.validUntil} />
                </div>
                <div>
                  <label className="text-sm font-medium">Lead (optional)</label>
                  <Select value={form.leadId} onValueChange={(v) => setForm({ ...form, leadId: v || "" })}>
                    <SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger>
                    <SelectContent>{leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.customerName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Property (optional)</label>
                  <Select value={form.propertyId} onValueChange={(v) => setForm({ ...form, propertyId: v || "" })}>
                    <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                    <SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Customer (optional)</label>
                  <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v || "" })}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium">Breakdown Items</label>
                  <div className="space-y-2 mt-2">
                    {form.breakdown.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input placeholder="Label" value={item.label} onChange={(e) => updateBreakdownItem(index, "label", e.target.value)} className="flex-1" />
                        <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateBreakdownItem(index, "quantity", Number(e.target.value))} className="w-20" />
                        <Input type="number" placeholder="Rate" value={item.rate} onChange={(e) => updateBreakdownItem(index, "rate", Number(e.target.value))} className="w-24" />
                        <span className="text-sm text-muted-foreground w-24 text-right">₹{(item.quantity * item.rate).toLocaleString()}</span>
                        {form.breakdown.length > 1 && (
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeBreakdownItem(index)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addBreakdownItem}><Plus className="h-3 w-3 mr-1" />Add Item</Button>
                  </div>
                  {computedTotal > 0 && <p className="text-sm text-muted-foreground mt-1">Computed Total: ₹{computedTotal.toLocaleString()}</p>}
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
                </div>
              </div>
              <DialogFooter showCloseButton>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "ALL" ? "" : (v ?? "")); setQuery((prev) => ({ ...prev, page: 1 })); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => <SelectItem key={key} value={key}>{config.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <Card key={key}><CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{config.label}</span>
            <Badge variant="outline" className={config.color}>{counts[key] || 0}</Badge>
          </CardContent></Card>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        searchKey="quotations"
        pageCount={data?.meta?.totalPages}
        totalRecords={data?.meta?.total}
        onPaginationChange={(pageIndex, pageSize) => setQuery((prev) => ({ ...prev, page: pageIndex + 1, limit: pageSize }))}
      />

      {accessLogsId && canViewLogs && (
        <AccessLogsPanel quotationId={accessLogsId} onClose={() => setAccessLogsId(null)} />
      )}
    </div>
  );
}

function AccessLogsPanel({ quotationId, onClose }: { quotationId: string; onClose: () => void }) {
  const { data: logs, isLoading } = useQuotationAccessLogs(quotationId);

  return (
    <div className="border rounded-lg p-4 bg-muted/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Access Logs</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Tracking secure PDF downloads and watermarks.</p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading access logs...</p>
      ) : logs && logs.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{log.action}</Badge>
              <span>{log.user ? `${log.user.firstName} ${log.user.lastName}` : "Unknown User"}</span>
              <span className="text-muted-foreground">—</span>
              <span className="text-muted-foreground">{format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")}</span>
              {log.ipAddress && <span className="text-muted-foreground text-xs">({log.ipAddress})</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No access logs found for this quotation.</p>
      )}
    </div>
  );
}
