"use client";

import { useState, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, ShieldCheck, LogIn, LogOut, MapPin, ClipboardList, Camera } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton-variants";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAttendance, useCreateAttendance, useUpdateAttendance, useDeleteAttendance, useVerifyAttendance, useMyAttendance, useCheckIn, useCheckOut, useUpload, useEmployees, useEvidenceReviews, useReviewEvidence, useEvidenceReview } from "@/hooks/api";
import { useCurrentUser } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import type { Attendance, AttendanceStatus, CreateAttendanceDto, QueryAttendanceDto, UpdateAttendanceDto, EvidenceReview, EvidenceReviewStatus } from "@/lib/types";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
};

function EmployeeAttendanceView() {
  const { showToast } = useToast();
  const { data: myAttendanceRes, isLoading } = useMyAttendance();
  const myAttendance = myAttendanceRes?.records;
  const todayStr = myAttendanceRes?.today ?? new Date().toISOString().slice(0, 10);
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const { uploadGeneral, uploading: uploadLoading } = useUpload();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState<string>("");

  const todayRecord = myAttendance?.find((a) => {
    const d = a.date ? (typeof a.date === 'string' ? a.date.slice(0, 10) : '') : '';
    return d === todayStr;
  });
  const isCheckedIn = todayRecord?.checkIn && !todayRecord?.checkOut;

  const getPosition = useCallback((): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000, enableHighAccuracy: true },
      );
    });
  }, []);

  const handleSelfieUpload = useCallback(async (file: File) => {
    try {
      const result = await uploadGeneral(file);
      setSelfieUrl(result.url);
      showToast("Selfie uploaded");
    } catch {
      showToast("Selfie upload failed", "error");
    }
  }, [uploadGeneral, showToast]);

  const handleCheckIn = useCallback(async () => {
    setGpsLoading(true);
    const coords = await getPosition();
    if (!coords) {
      showToast("Location unavailable. Check-in will proceed without GPS coordinates.", "error");
    }
    checkIn.mutate({
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      checkInPhoto: selfieUrl || undefined,
    }, {
      onSuccess: () => { showToast("Checked in successfully"); setSelfieUrl(""); },
      onError: (err: Error) => showToast(err.message || "Check-in failed", "error"),
      onSettled: () => setGpsLoading(false),
    });
  }, [checkIn, getPosition, showToast, selfieUrl]);

  const handleCheckOut = useCallback(async () => {
    setGpsLoading(true);
    const coords = await getPosition();
    if (!coords) {
      showToast("Location unavailable. Check-out will proceed without GPS coordinates.", "error");
    }
    checkOut.mutate({
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      checkOutPhoto: selfieUrl || undefined,
    }, {
      onSuccess: () => { showToast("Checked out successfully"); setSelfieUrl(""); },
      onError: (err: Error) => showToast(err.message || "Check-out failed", "error"),
      onSettled: () => setGpsLoading(false),
    });
  }, [checkOut, getPosition, showToast, selfieUrl]);

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
            {todayRecord?.latitude && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {Number(todayRecord.latitude).toFixed(4)}, {Number(todayRecord.longitude).toFixed(4)}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {!todayRecord?.checkIn && (
              <>
                <div className="flex items-center gap-1">
                  <Input key={`checkin-${selfieUrl}`} type="file" accept="image/*" capture="environment" className="w-40 text-xs" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) await handleSelfieUpload(f);
                  }} />
                  {uploadLoading && <span className="text-xs text-muted-foreground">...</span>}
                  {selfieUrl && <Camera className="h-4 w-4 text-green-600" />}
                </div>
                <Button onClick={handleCheckIn} disabled={checkIn.isPending || gpsLoading || uploadLoading}>
                  <LogIn className="h-4 w-4 mr-1" />
                  {gpsLoading ? "Getting location..." : checkIn.isPending ? "Checking in..." : "Check In"}
                </Button>              </>
            )}
            {isCheckedIn && (
              <>
                <div className="flex items-center gap-1">
                  <Input key={`checkout-${selfieUrl}`} type="file" accept="image/*" capture="environment" className="w-40 text-xs" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) await handleSelfieUpload(f);
                  }} />
                  {uploadLoading && <span className="text-xs text-muted-foreground">...</span>}
                  {selfieUrl && <Camera className="h-4 w-4 text-green-600" />}
                </div>
                <Button variant="outline" onClick={handleCheckOut} disabled={checkOut.isPending || gpsLoading || uploadLoading}>
                  <LogOut className="h-4 w-4 mr-1" />
                  {gpsLoading ? "Getting location..." : checkOut.isPending ? "Checking out..." : "Check Out"}
                </Button>
              </>
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
            <TableSkeleton rows={5} columns={4} />
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
            <EmptyState icon={<ClipboardList className="h-12 w-12" />} title="No attendance records yet" description="Attendance records will appear here once marked" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EvidenceReviewQueue({ role }: { role: string | undefined }) {
  const canReview = role === "OWNER" || role === "ADMIN" || role === "HR_MANAGER" || role === "MANAGER";
  const { data, isLoading, refetch } = useEvidenceReviews({ status: "PENDING" });
  const reviewMutation = useReviewEvidence();
  const [viewId, setViewId] = useState<string | null>(null);

  const handleReview = (id: string, status: EvidenceReviewStatus, remarks?: string) => {
    reviewMutation.mutate({ id, status, remarks }, {
      onSuccess: () => refetch(),
    });
  };

  const columns: ColumnDef<EvidenceReview>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => row.getValue("id"),
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ row }) => format(new Date(row.original.createdAt), "PPpp"),
    },
    {
      accessorKey: "punch",
      header: "Punch",
      cell: ({ row }) => {
        const punch = row.original.punch;
        return punch
          ? `${punch.punchType} @ ${format(new Date(punch.timestamp), "HH:mm")} (${punch.latitude?.toFixed(5) ?? "-"}, ${punch.longitude?.toFixed(5) ?? "-"})`
          : "—";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={statusColors[row.original.status] as string}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setViewId(row.original.id)}
          >
            <Camera className="h-4 w-4" />
          </Button>
          {canReview && row.original.status === "PENDING" && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleReview(row.original.id, "APPROVED")}
                disabled={reviewMutation.isPending}
              >
                <ShieldCheck className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleReview(row.original.id, "FLAGGED", "Needs follow-up")}
                disabled={reviewMutation.isPending}
              >
                <ClipboardList className="h-4 w-4 text-amber-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleReview(row.original.id, "REJECTED", "Insufficient evidence")}
                disabled={reviewMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Evidence Awaiting Review</h3>
        <p className="text-sm text-muted-foreground">
          Review employee punch-in/out selfies with GPS evidence. Approve marks the day
          VERIFIED; Flag/Rejection keeps it UNDER_REVIEW.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        searchKey="id"
        totalRecords={data?.total ?? 0}
      />

      <EvidenceViewDialog
        open={!!viewId}
        onClose={() => setViewId(null)}
        reviewId={viewId}
      />
    </div>
  );
}

function EvidenceViewDialog({
  open,
  onClose,
  reviewId,
}: {
  open: boolean;
  onClose: () => void;
  reviewId: string | null;
}) {
  const { data: view, isLoading } = useEvidenceReview(reviewId ?? "");
  const selfieProxyUrl = view?.selfieUrl?.replace(/^\/uploads\//, "/api/uploads/") ?? null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Evidence Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : view ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Status:</span> {view.status}
              </div>
              <div>
                <span className="font-medium">Evidence Type:</span> {view.evidence?.type}
              </div>
              <div>
                <span className="font-medium">Punch:</span> {view.punch?.punchType}
              </div>
              <div>
                <span className="font-medium">Time:</span>{" "}
                {view.punch?.timestamp ? format(new Date(view.punch.timestamp), "PPpp") : "—"}
              </div>
              {view.punch?.latitude != null && view.punch?.longitude != null && (
                <div className="col-span-2">
                  <span className="font-medium">GPS:</span>{" "}
                  {view.punch.latitude.toFixed(6)}, {view.punch.longitude.toFixed(6)}
                </div>
              )}
              {view.punch?.deviceId && (
                <div>
                  <span className="font-medium">Device:</span> {view.punch.deviceId}
                </div>
              )}
              <div>
                <span className="font-medium">Mock location:</span>{" "}
                {view.evidence?.mockLocationDetected ? "Yes ⚠️" : "No"}
              </div>
              <div>
                <span className="font-medium">Developer mode:</span>{" "}
                {view.evidence?.developerModeActive ? "Yes ⚠️" : "No"}
              </div>
              {view.remarks && (
                <div className="col-span-2">
                  <span className="font-medium">Remarks:</span> {view.remarks}
                </div>
              )}
            </div>
            {selfieProxyUrl && (
              <div>
                <span className="font-medium text-sm">Selfie:</span>
                <img
                  src={selfieProxyUrl}
                  alt="Selfie evidence"
                  className="mt-1 rounded border max-w-full h-auto"
                />
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No evidence found.</p>
        )}
        <DialogFooter showCloseButton>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminAttendanceView({ role }: { role: string | undefined }) {
  const [query, setQuery] = useState<QueryAttendanceDto>({ page: 1, limit: 10, sortBy: "date", sortOrder: "desc", search: "" });
  const { data, isLoading } = useAttendance(query);
  const createMutation = useCreateAttendance();
  const updateMutation = useUpdateAttendance();
  const deleteMutation = useDeleteAttendance();
  const verifyMutation = useVerifyAttendance();
  const { showToast } = useToast();
  const canVerify = role === "OWNER" || role === "ADMIN" || role === "HR_MANAGER" || role === "MANAGER";
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Attendance | null>(null);
  const [form, setForm] = useState<Partial<CreateAttendanceDto & UpdateAttendanceDto>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [tab, setTab] = useState<"records" | "evidence">("records");
  const canReview = role === "OWNER" || role === "ADMIN" || role === "HR_MANAGER" || role === "MANAGER";

  const { data: empData } = useEmployees({ limit: 200 });
  const employees = empData?.data || [];

  const resetForm = () => setForm({ employeeId: "", date: "", checkIn: "", checkOut: "", status: "UNDER_REVIEW" });

  const columns: ColumnDef<Attendance>[] = [
    { accessorKey: "employee", header: "Employee", cell: ({ row }) => {
      const emp = (row.original as any).employees || row.original.employee;
      return <span className="font-medium">{emp ? `${emp.employeeCode}` : row.original.employeeId}</span>;
    } },
    { accessorKey: "date", header: "Date", cell: ({ row }) => <span>{format(new Date(row.original.date), "MMM dd, yyyy")}</span> },
    { accessorKey: "checkIn", header: "Check In", cell: ({ row }) => <span>{row.original.checkIn ? format(new Date(row.original.checkIn), "HH:mm") : "-"}</span> },
    { accessorKey: "checkOut", header: "Check Out", cell: ({ row }) => <span>{row.original.checkOut ? format(new Date(row.original.checkOut), "HH:mm") : "-"}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="outline" className={statusColors[row.original.status]}>{row.original.status}</Badge> },
    { accessorKey: "verified", header: "Verified", cell: ({ row }) => row.original.verified ? <Badge variant="outline" className="bg-green-100 text-green-800">Verified</Badge> : <Badge variant="outline" className="bg-gray-100 text-gray-800">Pending</Badge> },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {canVerify && !row.original.verified && (
          <Button variant="ghost" size="icon-sm" onClick={() => verifyMutation.mutate(row.original.id, { onSuccess: () => showToast("Attendance verified"), onError: (err) => showToast(err?.message || "Failed to verify attendance", "error") })}><ShieldCheck className="h-4 w-4 text-green-600" /></Button>
        )}
        <Button variant="ghost" size="icon-sm" onClick={() => {
          setEditItem(row.original);
          setForm({
            employeeId: row.original.employeeId,
            date: row.original.date.slice(0, 10),
              checkIn: row.original.checkIn ? format(new Date(row.original.checkIn), "HH:mm") : undefined,
              checkOut: row.original.checkOut ? format(new Date(row.original.checkOut), "HH:mm") : undefined,
            status: row.original.status,
          });
        }}><Pencil className="h-4 w-4" /></Button>
        {(role === "OWNER" || role === "ADMIN") && (
          <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(row.original.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Attendance</h2>
          <p className="text-sm text-muted-foreground">Track employee attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs defaultValue="records" value={tab} onValueChange={(v) => setTab(v as "records" | "evidence")}>
            <TabsList>
              <TabsTrigger value="records">Records</TabsTrigger>
              {canReview && <TabsTrigger value="evidence">Evidence Review</TabsTrigger>}
            </TabsList>
          </Tabs>
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (o) resetForm(); }}>
            <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Record</DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle>Add Attendance Record</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><label className="text-sm font-medium">Employee</label><Select value={form.employeeId || ""} onValueChange={(v) => setForm({ ...form, employeeId: v ?? "" })}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.user ? `${e.user.firstName} ${e.user.lastName}` : e.employeeCode}</SelectItem>)}</SelectContent></Select></div>
                <div><label className="text-sm font-medium">Date</label><Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><label className="text-sm font-medium">Check In</label><Input type="time" value={form.checkIn || ""} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} /></div>
                <div><label className="text-sm font-medium">Check Out</label><Input type="time" value={form.checkOut || ""} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} /></div>
                <div><label className="text-sm font-medium">Status</label><Select value={form.status || "UNDER_REVIEW"} onValueChange={(v) => setForm({ ...form, status: (v ?? "UNDER_REVIEW") as AttendanceStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="COMPLETED">Completed</SelectItem><SelectItem value="UNDER_REVIEW">Under Review</SelectItem></SelectContent></Select></div>
              </div>
              <DialogFooter showCloseButton><Button onClick={() => {
                if (!form.employeeId || !form.date) { showToast("Employee ID and Date are required", "error"); return; }
                createMutation.mutate({
                  employeeId: form.employeeId,
                  date: form.date,
                  checkIn: form.checkIn && form.date ? `${form.date}T${form.checkIn}:00.000Z` : undefined,
                  checkOut: form.checkOut && form.date ? `${form.date}T${form.checkOut}:00.000Z` : undefined,
                  status: form.status as AttendanceStatus | undefined,
                }, {
                  onSuccess: () => { setCreateOpen(false); resetForm(); },
                  onError: (err) => showToast(err?.message || "Failed to create attendance", "error"),
                });
              }} disabled={createMutation.isPending}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {tab === "records" && (
        <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="attendance" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />
      )}

      {tab === "evidence" && <EvidenceReviewQueue role={role} />}

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Attendance</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Check In</label><Input type="time" value={form.checkIn || ""} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Check Out</label><Input type="time" value={form.checkOut || ""} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Status</label><Select value={form.status || "UNDER_REVIEW"} onValueChange={(v) => setForm({ ...form, status: (v ?? "UNDER_REVIEW") as AttendanceStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="COMPLETED">Completed</SelectItem><SelectItem value="UNDER_REVIEW">Under Review</SelectItem></SelectContent></Select></div>
          </div>
            <DialogFooter showCloseButton><Button onClick={() => { if (editItem) { updateMutation.mutate({ id: editItem.id, dto: { ...form, checkIn: form.checkIn && form.date ? `${form.date}T${form.checkIn}:00.000Z` : undefined, checkOut: form.checkOut && form.date ? `${form.date}T${form.checkOut}:00.000Z` : undefined } }, { onSuccess: () => { setEditItem(null); }, onError: (err) => showToast(err?.message || "Failed to update attendance", "error") }); } }} disabled={updateMutation.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="Delete Attendance Record"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) {
            deleteMutation.mutate(confirmDelete, { onError: (err) => showToast(err?.message || "Failed to delete", "error"), onSettled: () => setConfirmDelete(null) });
          } else {
            setConfirmDelete(null);
          }
        }}
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this attendance record?
      </ConfirmDialog>
    </div>
  );
}

export default function AttendancePage() {
  const { data: currentUser, isLoading } = useCurrentUser();
  const role = currentUser?.user?.role;

  if (isLoading) return <CardSkeleton count={4} />;

  if (role === "EMPLOYEE") return <EmployeeAttendanceView />;

  return <AdminAttendanceView role={role} />;
}
