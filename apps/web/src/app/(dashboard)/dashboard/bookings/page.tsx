"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useBookings, useCreateBooking, useUpdateBooking, useDeleteBooking, useProperties, useCustomers, useEmployees, useLeads } from "@/hooks/api";
import type { Booking, BookingStatus, CreateBookingDto, PaymentStatus, UpdateBookingDto } from "@/lib/types";
import { format } from "date-fns";

type BookingForm = Partial<Booking> & {
  bookingDate?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800", CONFIRMED: "bg-green-100 text-green-800", CANCELLED: "bg-red-100 text-red-800",
};

const paymentColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800", PARTIAL: "bg-blue-100 text-blue-800", COMPLETED: "bg-green-100 text-green-800",
};

export default function BookingsPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const, search: "" });
  const { data, isLoading } = useBookings(query);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Booking | null>(null);
  const dialogOpen = createOpen || !!editItem;
  const { data: propData } = useProperties({ limit: 200 }, { enabled: dialogOpen });
  const { data: custData } = useCustomers({ limit: 200 }, { enabled: dialogOpen });
  const { data: empData } = useEmployees({ limit: 200 }, { enabled: dialogOpen });
  const { data: leadData } = useLeads({ limit: 200 }, { enabled: dialogOpen });
  const createMutation = useCreateBooking();
  const updateMutation = useUpdateBooking();
  const deleteMutation = useDeleteBooking();
  const [form, setForm] = useState<BookingForm>({});

  const properties = propData?.data || [];
  const customers = custData?.data || [];
  const employees = empData?.data || [];
  const leads = leadData?.data || [];

  const resetForm = () => setForm({ propertyId: "", customerId: "", bookingDate: "", amount: 0, status: "PENDING", paymentStatus: "PENDING", notes: "", assignedToEmployeeId: "" });

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (data?.data || []).forEach((b: Booking) => { c[b.status] = (c[b.status] || 0) + 1; });
    return c;
  }, [data]);

  const columns: ColumnDef<Booking>[] = [
    { accessorKey: "property", header: "Property", cell: ({ row }) => <span className="font-medium">{row.original.property?.title || row.original.propertyId}</span> },
    { accessorKey: "customer", header: "Customer", cell: ({ row }) => <span>{row.original.customer?.name || row.original.customerId}</span> },
    { accessorKey: "bookingDate", header: "Date", cell: ({ row }) => <span>{format(new Date(row.original.bookingDate), "MMM dd, yyyy")}</span> },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => <span>${Number(row.original.amount).toLocaleString()}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="outline" className={statusColors[row.original.status]}>{row.original.status}</Badge> },
    { accessorKey: "paymentStatus", header: "Payment", cell: ({ row }) => <Badge variant="outline" className={paymentColors[row.original.paymentStatus]}>{row.original.paymentStatus}</Badge> },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ ...row.original, bookingDate: row.original.bookingDate.slice(0, 10), leadId: row.original.leadId ?? undefined, notes: row.original.notes ?? undefined } as BookingForm); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Delete this booking?")) deleteMutation.mutate(row.original.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Bookings</h2><p className="text-sm text-muted-foreground">Manage property bookings</p></div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Booking</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add Booking</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Property</label><Select value={form.propertyId || ""} onValueChange={(v) => setForm({ ...form, propertyId: v } as BookingForm)}><SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium">Customer</label><Select value={form.customerId || ""} onValueChange={(v) => setForm({ ...form, customerId: v } as BookingForm)}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium">Lead (optional)</label><Select value={form.leadId || ""} onValueChange={(v) => setForm({ ...form, leadId: v || undefined } as BookingForm)}><SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger><SelectContent>{leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.customerName}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium">Assigned To</label><Select value={form.assignedToEmployeeId || ""} onValueChange={(v) => setForm({ ...form, assignedToEmployeeId: v } as BookingForm)}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.user ? `${e.user.firstName} ${e.user.lastName}` : e.employeeCode}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium">Booking Date</label><Input type="date" value={form.bookingDate || ""} onChange={(e) => setForm({ ...form, bookingDate: e.target.value } as BookingForm)} /></div>
              <div><label className="text-sm font-medium">Amount</label><Input type="number" value={form.amount || 0} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) } as BookingForm)} /></div>
              <div><label className="text-sm font-medium">Status</label><Select value={form.status || "PENDING"} onValueChange={(v) => setForm({ ...form, status: v } as BookingForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="CONFIRMED">Confirmed</SelectItem><SelectItem value="CANCELLED">Cancelled</SelectItem></SelectContent></Select></div>
              <div><label className="text-sm font-medium">Payment</label><Select value={form.paymentStatus || "PENDING"} onValueChange={(v) => setForm({ ...form, paymentStatus: v } as BookingForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="PARTIAL">Partial</SelectItem><SelectItem value="COMPLETED">Completed</SelectItem></SelectContent></Select></div>
              <div className="col-span-2"><label className="text-sm font-medium">Notes</label><Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value } as BookingForm)} /></div>
            </div>
            <DialogFooter showCloseButton><Button onClick={() => { if (!form.propertyId || !form.customerId || !form.bookingDate || !form.assignedToEmployeeId || !form.amount) { alert("Please fill Property, Customer, Date, Assigned To, and Amount"); return; } createMutation.mutate({ ...form, bookingDate: new Date(form.bookingDate).toISOString() } as CreateBookingDto); setCreateOpen(false); resetForm(); }} disabled={createMutation.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[{ status: "PENDING", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
          { status: "CONFIRMED", label: "Confirmed", color: "bg-green-100 text-green-800" },
          { status: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-800" },
        ].map((s) => (
          <Card key={s.status}>
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <Badge variant="outline" className={s.color}>{counts[s.status] || 0}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="bookings" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Booking</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium">Property</label><Select value={form.propertyId || ""} onValueChange={(v) => setForm({ ...form, propertyId: v } as BookingForm)}><SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Customer</label><Select value={form.customerId || ""} onValueChange={(v) => setForm({ ...form, customerId: v } as BookingForm)}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Lead (optional)</label><Select value={form.leadId || ""} onValueChange={(v) => setForm({ ...form, leadId: v || undefined } as BookingForm)}><SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger><SelectContent>{leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.customerName}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Assigned To</label><Select value={form.assignedToEmployeeId || ""} onValueChange={(v) => setForm({ ...form, assignedToEmployeeId: v } as BookingForm)}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.user ? `${e.user.firstName} ${e.user.lastName}` : e.employeeCode}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Booking Date</label><Input type="date" value={form.bookingDate || ""} onChange={(e) => setForm({ ...form, bookingDate: e.target.value } as BookingForm)} /></div>
            <div><label className="text-sm font-medium">Amount</label><Input type="number" value={form.amount || 0} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) } as BookingForm)} /></div>
            <div><label className="text-sm font-medium">Status</label><Select value={form.status || "PENDING"} onValueChange={(v) => setForm({ ...form, status: v } as BookingForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="CONFIRMED">Confirmed</SelectItem><SelectItem value="CANCELLED">Cancelled</SelectItem></SelectContent></Select></div>
            <div><label className="text-sm font-medium">Payment</label><Select value={form.paymentStatus || "PENDING"} onValueChange={(v) => setForm({ ...form, paymentStatus: v } as BookingForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="PARTIAL">Partial</SelectItem><SelectItem value="COMPLETED">Completed</SelectItem></SelectContent></Select></div>
            <div className="col-span-2"><label className="text-sm font-medium">Notes</label><Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value } as BookingForm)} /></div>
          </div>
          <DialogFooter showCloseButton><Button onClick={() => { if (editItem && form.bookingDate) { updateMutation.mutate({ id: editItem.id, dto: { ...form, bookingDate: new Date(form.bookingDate).toISOString() } as UpdateBookingDto }); setEditItem(null); } }} disabled={updateMutation.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
