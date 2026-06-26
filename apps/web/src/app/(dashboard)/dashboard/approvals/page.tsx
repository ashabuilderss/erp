"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLeaveRequests, useApproveLeaveRequest, useCurrentUser, useEmployees, useUpdateUser, useAttendanceCorrections, useApproveCorrection, useRejectCorrection } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { CalendarRange, ClipboardCheck, FileText, UserCheck, ShieldCheck, ShieldX, Clock } from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeleton-variants";
import type { LeaveStatus } from "@/lib/types";

export default function ApprovalsPage() {
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role;
  const canApprove = role === "OWNER" || role === "ADMIN" || role === "HR_MANAGER";
  const { data: leavesData, isLoading } = useLeaveRequests({ status: "PENDING" as LeaveStatus, limit: 50 });
  const approveLeave = useApproveLeaveRequest();
  const { showToast } = useToast();
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const pendingLeaves = leavesData?.data ?? [];

  const handleLeaveAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    setLoadingIds((prev) => new Set(prev).add(id));
    try {
      await approveLeave.mutateAsync({ id, dto: { status: status as LeaveStatus } });
      showToast(`Leave ${status.toLowerCase()} successfully`);
    } catch (err) {
      showToast(getApiErrorMessage(err, `Failed to ${status.toLowerCase()} leave`), "error");
    } finally {
      setLoadingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Approval Center</h2>
        <p className="text-sm text-muted-foreground">Review and manage pending approvals</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarRange className="h-5 w-5" />
            Leave Requests
            {pendingLeaves.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingLeaves.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ListSkeleton rows={3} />
          ) : pendingLeaves.length > 0 ? (
            <div className="space-y-3">
              {pendingLeaves.map((leave) => (
                <div key={leave.id} className="flex items-start justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {leave.employee?.user?.firstName} {leave.employee?.user?.lastName}
                      </span>
                      <Badge variant="outline">{leave.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                    {leave.reason && (
                      <p className="text-sm text-muted-foreground">{leave.reason}</p>
                    )}
                  </div>
                  {canApprove ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleLeaveAction(leave.id, "APPROVED")}
                        disabled={loadingIds.has(leave.id)}
                      >
                        <ClipboardCheck className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleLeaveAction(leave.id, "REJECTED")}
                        disabled={loadingIds.has(leave.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mb-3" />
              <p className="font-medium">No pending approvals</p>
              <p className="text-sm">All requests have been reviewed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {canApprove && <AttendanceCorrectionsSection />}

      {canApprove && <EmployeeApprovalsSection />}
    </div>
  );
}

function AttendanceCorrectionsSection() {
  const { data: correctionsData, isLoading } = useAttendanceCorrections({ status: "PENDING", limit: 50 });
  const approveCorrection = useApproveCorrection();
  const rejectCorrection = useRejectCorrection();
  const { showToast } = useToast();
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const pendingCorrections = correctionsData?.data ?? [];

  const handleCorrectionAction = async (id: string, action: "approve" | "reject") => {
    setLoadingIds((prev) => new Set(prev).add(id));
    try {
      if (action === "approve") {
        await approveCorrection.mutateAsync({ id });
        showToast("Correction approved successfully");
      } else {
        await rejectCorrection.mutateAsync({ id });
        showToast("Correction rejected successfully");
      }
    } catch (err) {
      showToast(getApiErrorMessage(err, `Failed to ${action} correction`), "error");
    } finally {
      setLoadingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Attendance Corrections
          {pendingCorrections.length > 0 && (
            <Badge variant="secondary" className="ml-1">{pendingCorrections.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ListSkeleton rows={2} />
        ) : pendingCorrections.length > 0 ? (
          <div className="space-y-3">
            {pendingCorrections.map((correction) => (
              <div key={correction.id} className="flex items-start justify-between rounded-lg border p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {correction.employee?.user?.firstName} {correction.employee?.user?.lastName}
                    </span>
                    <Badge variant="outline">
                      {new Date(correction.date).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground font-medium">Current</p>
                      <p>Status: {correction.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Requested</p>
                      <p>In: {correction.requestedCheckIn ?? "—"}</p>
                      <p>Out: {correction.requestedCheckOut ?? "—"}</p>
                    </div>
                  </div>
                  {correction.reason && (
                    <p className="text-sm text-muted-foreground">Reason: {correction.reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleCorrectionAction(correction.id, "approve")}
                    disabled={loadingIds.has(correction.id)}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleCorrectionAction(correction.id, "reject")}
                    disabled={loadingIds.has(correction.id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mb-3" />
            <p className="font-medium">No pending corrections</p>
            <p className="text-sm">All corrections have been reviewed</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmployeeApprovalsSection() {
  const { data: employeesData, isLoading } = useEmployees({ limit: 50 });
  const updateUser = useUpdateUser();
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [employeeLoadingIds, setEmployeeLoadingIds] = useState<Set<string>>(new Set());
  const employees = employeesData?.data ?? [];

  const pendingEmployees = employees.filter((e) => !e.user?.isActive && e.user);
  const activeEmployees = employees.filter((e) => e.user?.isActive);

  const displayed = statusFilter === "PENDING" ? pendingEmployees : activeEmployees;

  const handleEmployeeAction = async (id: string, isActive: boolean) => {
    setEmployeeLoadingIds((prev) => new Set(prev).add(id));
    try {
      await updateUser.mutateAsync({ id, dto: { isActive } });
    } catch {
      // error handled by mutation
    } finally {
      setEmployeeLoadingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="h-5 w-5" />
            Employee Approvals
            <Badge variant="secondary" className="ml-1">{pendingEmployees.length}</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant={statusFilter === "PENDING" ? "default" : "outline"} onClick={() => setStatusFilter("PENDING")}>Pending</Button>
            <Button size="sm" variant={statusFilter === "ACTIVE" ? "default" : "outline"} onClick={() => setStatusFilter("ACTIVE")}>Active</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : displayed.length > 0 ? (
          <div className="space-y-2">
            {displayed.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{emp.user?.firstName} {emp.user?.lastName}</p>
                    <p className="text-sm text-muted-foreground">{emp.employeeCode} — {emp.department?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {emp.user && !emp.user.isActive ? (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleEmployeeAction(emp.user!.id, true)} disabled={employeeLoadingIds.has(emp.user!.id)}>
                      <ShieldCheck className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => handleEmployeeAction(emp.user!.id, false)} disabled={employeeLoadingIds.has(emp.user!.id)}>
                      <ShieldX className="h-4 w-4 mr-1" /> Revoke
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ShieldCheck className="h-12 w-12 mb-3" />
            <p className="font-medium">All employees approved</p>
            <p className="text-sm">No pending approvals</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
