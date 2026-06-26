"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Send, UserPlus, Mail, Ban } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, useInviteEmployee, useCreateEmployeeWithUser, useRevokeEmployeeAccess } from "@/hooks/api";
import type { CreateEmployeeWithUserDto } from "@/hooks/api";
import { useDepartments } from "@/hooks/api";
import { useDesignations } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import type { CreateEmployeeDto, Employee, EmployeeStatus, UpdateEmployeeDto } from "@/lib/types";
import { getApiErrorMessage } from "@/lib/api";
import { FieldError } from "@/components/shared/field-error";
import { validateForm, clearFieldError } from "@/components/shared/form-validation";
import type { ValidationRules } from "@/components/shared/form-validation";

type EmployeeForm = {
  employeeCode?: string;
  departmentId?: string;
  designationId?: string;
  phone?: string;
  dateOfJoining?: string;
  salary?: number;
  address?: string;
  status?: EmployeeStatus;
  userId?: string;
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800", INACTIVE: "bg-yellow-100 text-yellow-800", TERMINATED: "bg-red-100 text-red-800",
};

export default function EmployeesPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const, search: "" });
  const { data, isLoading } = useEmployees(query);
  const { data: deptData } = useDepartments({ limit: 50 });
  const { data: desigData } = useDesignations({ limit: 50 });
  const { showToast } = useToast();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();
  const inviteMutation = useInviteEmployee();
  const createWithUserMutation = useCreateEmployeeWithUser();
  const revokeAccessMutation = useRevokeEmployeeAccess();

  const departments = deptData?.data || [];

  const [createOpen, setCreateOpen] = useState(false);
  const [createWithUserOpen, setCreateWithUserOpen] = useState(false);
  const [editItem, setEditItem] = useState<Employee | null>(null);
  const [inviteItem, setInviteItem] = useState<Employee | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [form, setForm] = useState<EmployeeForm>({});
  const [userForm, setUserForm] = useState<Partial<CreateEmployeeWithUserDto>>({});
  const [errors, setErrors] = useState<Partial<Record<"departmentId" | "designationId", string>>>({});
  const [userFormErrors, setUserFormErrors] = useState<Partial<Record<"email" | "firstName" | "lastName" | "departmentId" | "designationId" | "password", string>>>({});
  const [confirmAction, setConfirmAction] = useState<{ type: "delete" | "terminate"; employeeId: string } | null>(null);

  const resetForm = () => setForm({ employeeCode: "", departmentId: "", designationId: "", phone: "", status: "ACTIVE", salary: 0 });
  const resetUserForm = () => setUserForm({ employeeCode: "", email: "", firstName: "", lastName: "", password: "", departmentId: "", designationId: "", phone: "", salary: 0 });

  const columns: ColumnDef<Employee>[] = [
    { accessorKey: "employeeCode", header: "Code", cell: ({ row }) => <span className="font-medium">{row.original.employeeCode}</span> },
    { accessorKey: "user", header: "Name", cell: ({ row }) => <span>{row.original.user ? `${row.original.user.firstName} ${row.original.user.lastName}` : "-"}</span> },
    { accessorKey: "department", header: "Department", cell: ({ row }) => <span>{row.original.department?.name || "-"}</span> },
    { accessorKey: "designation", header: "Designation", cell: ({ row }) => <span>{row.original.designation?.name || "-"}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="outline" className={statusColors[row.original.status]}>{row.original.status}</Badge> },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => <span>{row.original.phone || "-"}</span> },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {!row.original.userId && (
          <>
            <Button variant="ghost" size="icon-sm" onClick={() => { setInviteItem(row.original); setInviteEmail(""); }} title="Send invite"><Mail className="h-4 w-4" /></Button>
          </>
        )}
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ employeeCode: row.original.employeeCode, departmentId: row.original.departmentId, designationId: row.original.designationId, status: row.original.status, phone: row.original.phone ?? undefined, dateOfJoining: row.original.dateOfJoining ?? undefined, salary: row.original.salary ?? undefined, address: row.original.address ?? undefined }); }}><Pencil className="h-4 w-4" /></Button>
        {row.original.status === "ACTIVE" && (
          <Button variant="ghost" size="icon-sm" onClick={() => setConfirmAction({ type: "terminate", employeeId: row.original.id })} title="Terminate"><Ban className="h-4 w-4 text-destructive" /></Button>
        )}
        <Button variant="ghost" size="icon-sm" onClick={() => setConfirmAction({ type: "delete", employeeId: row.original.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Employees</h2><p className="text-sm text-muted-foreground">Manage your workforce</p></div>
        <div className="flex items-center gap-2">
          <Dialog open={createWithUserOpen} onOpenChange={(o) => { setCreateWithUserOpen(o); if (!o) resetUserForm(); }}>
            <DialogTrigger render={<Button variant="outline" />}><UserPlus className="h-4 w-4" /> Create with Login</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Create Employee with Login</DialogTitle><DialogDescription>Creates a user account and employee profile in one go</DialogDescription></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Email</Label><Input value={userForm.email || ""} onChange={(e) => { setUserForm({ ...userForm, email: e.target.value } as Partial<CreateEmployeeWithUserDto>); clearFieldError("email", setUserFormErrors); }} placeholder="email@company.com" className={userFormErrors.email ? "border-red-500" : ""} /><FieldError error={userFormErrors.email} /></div>
                <div><Label>First Name</Label><Input value={userForm.firstName || ""} onChange={(e) => { setUserForm({ ...userForm, firstName: e.target.value } as Partial<CreateEmployeeWithUserDto>); clearFieldError("firstName", setUserFormErrors); }} placeholder="First name" className={userFormErrors.firstName ? "border-red-500" : ""} /><FieldError error={userFormErrors.firstName} /></div>
                <div><Label>Last Name</Label><Input value={userForm.lastName || ""} onChange={(e) => { setUserForm({ ...userForm, lastName: e.target.value } as Partial<CreateEmployeeWithUserDto>); clearFieldError("lastName", setUserFormErrors); }} placeholder="Last name" className={userFormErrors.lastName ? "border-red-500" : ""} /><FieldError error={userFormErrors.lastName} /></div>
                <div><Label>Employee Code <span className="text-xs text-muted-foreground">(auto-generate if empty)</span></Label><Input value={userForm.employeeCode || ""} onChange={(e) => setUserForm({ ...userForm, employeeCode: e.target.value } as Partial<CreateEmployeeWithUserDto>)} placeholder="Auto: SE-001" /></div>
                <div><Label>Password</Label><Input type="password" value={userForm.password || ""} onChange={(e) => { setUserForm({ ...userForm, password: e.target.value } as Partial<CreateEmployeeWithUserDto>); clearFieldError("password", setUserFormErrors); }} placeholder="Min 8 chars" className={userFormErrors.password ? "border-red-500" : ""} /><FieldError error={userFormErrors.password} /></div>
                <div><Label>Department</Label><Select value={userForm.departmentId || ""} onValueChange={(v) => { setUserForm({ ...userForm, departmentId: v, designationId: "" } as Partial<CreateEmployeeWithUserDto>); clearFieldError("departmentId", setUserFormErrors); }}><SelectTrigger className={userFormErrors.departmentId ? "border-red-500" : ""}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select><FieldError error={userFormErrors.departmentId} /></div>
                <div><Label>Designation</Label><Select value={userForm.designationId || ""} onValueChange={(v) => { setUserForm({ ...userForm, designationId: v } as Partial<CreateEmployeeWithUserDto>); clearFieldError("designationId", setUserFormErrors); }}><SelectTrigger className={userFormErrors.designationId ? "border-red-500" : ""}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{desigData?.data?.filter((d) => d.departmentId === userForm.departmentId).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select><FieldError error={userFormErrors.designationId} /></div>
                <div><Label>Phone</Label><Input value={userForm.phone || ""} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value } as Partial<CreateEmployeeWithUserDto>)} /></div>
                <div><Label>Salary</Label><Input type="number" value={userForm.salary || 0} onChange={(e) => setUserForm({ ...userForm, salary: Number(e.target.value) } as Partial<CreateEmployeeWithUserDto>)} /></div>
              </div>
              <DialogFooter><Button onClick={() => { const rules: ValidationRules<CreateEmployeeWithUserDto> = { email: { required: "Email is required" }, firstName: { required: "First name is required" }, lastName: { required: "Last name is required" }, departmentId: { required: "Department is required" }, designationId: { required: "Designation is required" }, password: { required: "Password is required" } }; const fieldErrors = validateForm(userForm, rules); setUserFormErrors(fieldErrors); if (Object.keys(fieldErrors).length > 0) return; const dto = { email: userForm.email, firstName: userForm.firstName, lastName: userForm.lastName, password: userForm.password, departmentId: userForm.departmentId, designationId: userForm.designationId, employeeCode: userForm.employeeCode || undefined, phone: userForm.phone || undefined, salary: userForm.salary || undefined, address: userForm.address || undefined, dateOfJoining: userForm.dateOfJoining || undefined } as CreateEmployeeWithUserDto; createWithUserMutation.mutate(dto, { onSuccess: () => { showToast("Employee created with user"); setCreateWithUserOpen(false); resetUserForm(); setUserFormErrors({}); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create employee"), "error") }); }} disabled={createWithUserMutation.isPending}>Create Employee</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (o) resetForm(); }}>
            <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Employee</DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Add Employee</DialogTitle><DialogDescription>Create an employee record (without login access)</DialogDescription></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Employee Code <span className="text-xs text-muted-foreground">(leave empty to auto-generate)</span></Label><Input value={form.employeeCode || ""} onChange={(e) => setForm({ ...form, employeeCode: e.target.value } as EmployeeForm)} placeholder="Auto: SE-001" /></div>
                <div><Label>Department</Label><Select value={form.departmentId || ""} onValueChange={(v) => { setForm({ ...form, departmentId: v, designationId: "" } as EmployeeForm); clearFieldError("departmentId", setErrors); }}><SelectTrigger className={errors.departmentId ? "border-red-500" : ""}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select><FieldError error={errors.departmentId} /></div>
                <div><Label>Designation</Label><Select value={form.designationId || ""} onValueChange={(v) => { setForm({ ...form, designationId: v } as EmployeeForm); clearFieldError("designationId", setErrors); }}><SelectTrigger className={errors.designationId ? "border-red-500" : ""}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{desigData?.data?.filter((d) => d.departmentId === form.departmentId).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select><FieldError error={errors.designationId} /></div>
                <div><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value } as EmployeeForm)} /></div>
                <div><Label>Salary</Label><Input type="number" value={form.salary || 0} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) } as EmployeeForm)} /></div>
                <div><Label>Status</Label><Select value={form.status || "ACTIVE"} onValueChange={(v) => setForm({ ...form, status: v } as EmployeeForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem><SelectItem value="TERMINATED">Terminated</SelectItem></SelectContent></Select></div>
              </div>
              <DialogFooter><Button onClick={() => { const rules: ValidationRules<EmployeeForm> = { departmentId: { required: "Department is required" }, designationId: { required: "Designation is required" } }; const fieldErrors = validateForm(form, rules); setErrors(fieldErrors); if (Object.keys(fieldErrors).length > 0) return; const dto: CreateEmployeeDto = { employeeCode: form.employeeCode || undefined, departmentId: form.departmentId!, designationId: form.designationId!, phone: form.phone || undefined, status: form.status, salary: form.salary || undefined, address: form.address || undefined, dateOfJoining: form.dateOfJoining || undefined }; createMutation.mutate(dto, { onSuccess: () => { showToast("Employee created"); setCreateOpen(false); resetForm(); setErrors({}); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create employee"), "error") }); }} disabled={createMutation.isPending}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="employees" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Employee</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Employee Code</Label><Input value={form.employeeCode || ""} onChange={(e) => setForm({ ...form, employeeCode: e.target.value } as EmployeeForm)} /></div>
            <div><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value } as EmployeeForm)} /></div>
            <div><Label>Salary</Label><Input type="number" value={form.salary || 0} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) } as EmployeeForm)} /></div>
            <div><Label>Status</Label><Select value={form.status || "ACTIVE"} onValueChange={(v) => setForm({ ...form, status: v } as EmployeeForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem><SelectItem value="TERMINATED">Terminated</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button onClick={() => { if (editItem) { const dto: UpdateEmployeeDto = { employeeCode: form.employeeCode || undefined, departmentId: form.departmentId || undefined, designationId: form.designationId || undefined, phone: form.phone || undefined, status: form.status, salary: form.salary || undefined, address: form.address || undefined, dateOfJoining: form.dateOfJoining || undefined }; updateMutation.mutate({ id: editItem.id, dto }, { onSuccess: () => { showToast("Employee updated"); setEditItem(null); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update employee"), "error") }); } }} disabled={updateMutation.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!inviteItem} onOpenChange={(o) => { if (!o) setInviteItem(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Send Invitation</DialogTitle><DialogDescription>Send an email invite to {inviteItem?.employeeCode}</DialogDescription></DialogHeader>
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@company.com" />
          </div>
          <DialogFooter><Button onClick={() => { if (inviteItem) { inviteMutation.mutate({ id: inviteItem.id, email: inviteEmail }, { onSuccess: () => { showToast("Invitation sent"); setInviteItem(null); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to send invitation"), "error") }); } }} disabled={inviteMutation.isPending}><Send className="h-4 w-4" /> Send Invite</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmAction?.type === "delete"}
        onOpenChange={(o) => { if (!o) setConfirmAction(null); }}
        title="Delete Employee"
        variant="destructive"
        onConfirm={() => {
          if (confirmAction) {
            deleteMutation.mutate(confirmAction.employeeId, { onSuccess: () => showToast("Employee deleted"), onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete employee"), "error") });
          }
          setConfirmAction(null);
        }}
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this employee?
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmAction?.type === "terminate"}
        onOpenChange={(o) => { if (!o) setConfirmAction(null); }}
        title="Terminate Employee"
        variant="destructive"
        onConfirm={() => {
          if (confirmAction) {
            updateMutation.mutate(
              { id: confirmAction.employeeId, dto: { status: "TERMINATED" } as UpdateEmployeeDto },
              {
                onSuccess: () => {
                  revokeAccessMutation.mutate(confirmAction.employeeId, {
                    onSuccess: () => { setConfirmAction(null); showToast("Employee terminated"); },
                    onError: () => { setConfirmAction(null); showToast("Employee terminated (access revocation failed)", "error"); },
                  });
                },
                onError: (err) => { setConfirmAction(null); showToast(getApiErrorMessage(err, "Failed to terminate employee"), "error"); },
              }
            );
          } else {
            setConfirmAction(null);
          }
        }}
        loading={updateMutation.isPending}
      >
        Are you sure you want to terminate this employee? This will revoke user access.
      </ConfirmDialog>
    </div>
  );
}
