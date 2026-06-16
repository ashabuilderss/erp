"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, ShieldCheck, LogIn, LogOut } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAttendance, useCreateAttendance, useUpdateAttendance, useDeleteAttendance, useVerifyAttendance, useMyAttendance, useCheckIn, useCheckOut } from "@/hooks/api";
import { useCurrentUser } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import type { Attendance, AttendanceStatus, CreateAttendanceDto, QueryAttendanceDto, UpdateAttendanceDto } from "@/lib/types";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-800", ABSENT: "bg-red-100 text-red-800",
  HALF_DAY: "bg-yellow-100 text-yellow-800", LEAVE: "bg-blue-100 text-blue-800",
};

function EmployeeAttendanceView() {
  const { showToast } = useToast();
  const { data: myAttendance, isLoading } = useMyAttendance();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const todayRecord = myAttendance?.find((a) => {
    const today = new Date().toISOString().slice(0, 10);
    return a.date?.slice(0, 10) === today;
  });
  const isCheckedIn = todayRecord?.checkIn && !todayRecord?.checkOut;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">My Attendance</h2>
        <p className="text-sm text-muted-foreground">Mark your attendance and view history</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Today</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {todayRecord?.checkIn && (
              <p className="text-sm text-muted-foreground">Check-in: <span className="font-medium text-foreground">{format(new Date(todayRecord.checkIn), "HH:mm")}</span></p>
            )}
            {todayRecord?.checkOut && (
              <p className="text-sm text-muted-foreground">Check-out: <span className="font-medium text-foreground">{format(new Date(todayRecord.checkOut), "HH:mm")}</span></p>
            )}
            {todayRecord?.status && (
              <Badge variant="outline" className={statusColors[todayRecord.status]}>
                {todayRecord.status}
              </Badge>
            )}
            {todayRecord && (
              todayRecord.verified
                ? <Badge variant="outline" className="bg-green-100 text-green-800">Verified</Badge>
                : <Badge variant="outline" className="bg-gray-100 text-gray-800">Pending Verification</Badge>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            {!todayRecord?.checkIn && (
              <Button onClick={() => checkIn.mutate(undefined, {
                onSuccess: () => showToast("Checked in successfully"),
                onError: (err: Error) => showToast(err.message || "Check-in failed", "error"),
              })} disabled={checkIn.isPending}>
                <LogIn className="h-4 w-4 mr-1" />
                {checkIn.isPending ? "Checking in..." : "Check In"}
              </Button>
            )}
            {isCheckedIn && (
              <Button variant="outline" onClick={() => checkOut.mutate(undefined, {
                onSuccess: () => showToast("Checked out successfully"),
                onError: (err: Error) => showToast(err.message || "Check-out failed", "error"),
              })} disabled={checkOut.isPending}>
                <LogOut className="h-4 w-4 mr-1" />
                {checkOut.isPending ? "Checking out..." : "Check Out"}
              </Button>
            )}
            {todayRecord?.checkIn && todayRecord?.checkOut && (
              <p className="text-sm text-green-600 font-medium">Completed</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>History</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : myAttendance && myAttendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Check In</th>
                    <th className="pb-2 font-medium">Check Out</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {myAttendance.map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2">{format(new Date(a.date), "MMM dd, yyyy")}</td>
                      <td className="py-2">{a.checkIn ? format(new Date(a.checkIn), "HH:mm") : "-"}</td>
                      <td className="py-2">{a.checkOut ? format(new Date(a.checkOut), "HH:mm") : "-"}</td>
                      <td className="py-2"><Badge variant="outline" className={statusColors[a.status]}>{a.status}</Badge></td>
                      <td className="py-2">{a.verified ? <Badge variant="outline" className="bg-green-100 text-green-800">Verified</Badge> : <Badge variant="outline" className="bg-gray-100 text-gray-800">Pending</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No attendance records yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminAttendanceView({ role }: { role: string | undefined }) {
  const [query, setQuery] = useState<QueryAttendanceDto>({ page: 1, limit: 10, sortBy: "date", sortOrder: "desc", search: "" });
  const { data, isLoading } = useAttendance(query);
  const createMutation = useCreateAttendance();
  const updateMutation = useUpdateAttendance();
  const deleteMutation = useDeleteAttendance();
  const verifyMutation = useVerifyAttendance();
  const canVerify = role === "ADMIN" || role === "HR_MANAGER";
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Attendance | null>(null);
  const [form, setForm] = useState<Partial<CreateAttendanceDto & UpdateAttendanceDto>>({});

  const resetForm = () => setForm({ employeeId: "", date: "", checkIn: "", checkOut: "", status: "PRESENT" });

  const columns: ColumnDef<Attendance>[] = [
    { accessorKey: "employee", header: "Employee", cell: ({ row }) => <span className="font-medium">{row.original.employee ? `${row.original.employee.employeeCode}` : row.original.employeeId}</span> },
    { accessorKey: "date", header: "Date", cell: ({ row }) => <span>{format(new Date(row.original.date), "MMM dd, yyyy")}</span> },
    { accessorKey: "checkIn", header: "Check In", cell: ({ row }) => <span>{row.original.checkIn ? format(new Date(row.original.checkIn), "HH:mm") : "-"}</span> },
    { accessorKey: "checkOut", header: "Check Out", cell: ({ row }) => <span>{row.original.checkOut ? format(new Date(row.original.checkOut), "HH:mm") : "-"}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="outline" className={statusColors[row.original.status]}>{row.original.status}</Badge> },
    { accessorKey: "verified", header: "Verified", cell: ({ row }) => row.original.verified ? <Badge variant="outline" className="bg-green-100 text-green-800">Verified</Badge> : <Badge variant="outline" className="bg-gray-100 text-gray-800">Pending</Badge> },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {canVerify && !row.original.verified && (
          <Button variant="ghost" size="icon-sm" onClick={() => verifyMutation.mutate(row.original.id)}><ShieldCheck className="h-4 w-4 text-green-600" /></Button>
        )}
        <Button variant="ghost" size="icon-sm" onClick={() => {
          setEditItem(row.original);
          setForm({
            employeeId: row.original.employeeId,
            date: row.original.date.slice(0, 10),
            checkIn: row.original.checkIn ?? undefined,
            checkOut: row.original.checkOut ?? undefined,
            status: row.original.status,
          });
        }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Delete this record?")) deleteMutation.mutate(row.original.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Attendance</h2><p className="text-sm text-muted-foreground">Track employee attendance</p></div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Record</DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Add Attendance Record</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-sm font-medium">Employee ID</label><Input value={form.employeeId || ""} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Date</label><Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Check In</label><Input type="time" value={form.checkIn || ""} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Check Out</label><Input type="time" value={form.checkOut || ""} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Status</label><Select value={form.status || "PRESENT"} onValueChange={(v) => setForm({ ...form, status: (v ?? "PRESENT") as AttendanceStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PRESENT">Present</SelectItem><SelectItem value="ABSENT">Absent</SelectItem><SelectItem value="HALF_DAY">Half Day</SelectItem><SelectItem value="LEAVE">Leave</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter showCloseButton><Button onClick={() => {
              if (!form.employeeId || !form.date) return;
              createMutation.mutate({
                employeeId: form.employeeId,
                date: new Date(form.date).toISOString(),
                checkIn: form.checkIn,
                checkOut: form.checkOut,
                status: form.status as AttendanceStatus | undefined,
              });
              setCreateOpen(false);
              resetForm();
            }} disabled={createMutation.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="attendance" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Attendance</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Check In</label><Input type="time" value={form.checkIn || ""} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Check Out</label><Input type="time" value={form.checkOut || ""} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Status</label><Select value={form.status || "PRESENT"} onValueChange={(v) => setForm({ ...form, status: (v ?? "PRESENT") as AttendanceStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PRESENT">Present</SelectItem><SelectItem value="ABSENT">Absent</SelectItem><SelectItem value="HALF_DAY">Half Day</SelectItem><SelectItem value="LEAVE">Leave</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter showCloseButton><Button onClick={() => { if (editItem) { updateMutation.mutate({ id: editItem.id, dto: form }); setEditItem(null); } }} disabled={updateMutation.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AttendancePage() {
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role;

  if (role === "EMPLOYEE") return <EmployeeAttendanceView />;

  return <AdminAttendanceView role={role} />;
}
