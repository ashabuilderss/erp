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
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, useInviteEmployee, useCreateEmployeeWithUser, useRevokeEmployeeAccess } from "@/hooks/api";
import type { CreateEmployeeWithUserDto } from "@/hooks/api";
import { useDepartments } from "@/hooks/api";
import { useDesignations } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import type { CreateEmployeeDto, Employee, EmployeeStatus, UpdateEmployeeDto } from "@/lib/types";
import { getApiErrorMessage } from "@/lib/api";

type EmployeeForm = Partial<Employee> & {
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
            <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ ...row.original, userId: "", phone: row.original.phone ?? undefined, dateOfJoining: row.original.dateOfJoining ?? undefined, salary: row.original.salary ?? undefined, address: row.original.address ?? undefined }); }} title="Link user"><UserPlus className="h-4 w-4" /></Button>
          </>
        )}
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(row.original); setForm({ ...row.original, phone: row.original.phone ?? undefined, dateOfJoining: row.original.dateOfJoining ?? undefined, salary: row.original.salary ?? undefined, address: row.original.address ?? undefined }); }}><Pencil className="h-4 w-4" /></Button>
        {row.original.status === "ACTIVE" && (
          <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Terminate this employee? This will revoke user access.")) { updateMutation.mutate({ id: row.original.id, dto: { status: "TERMINATED" } as UpdateEmployeeDto }); revokeAccessMutation.mutate(row.original.id); } }} title="Terminate"><Ban className="h-4 w-4 text-destructive" /></Button>
        )}
        <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Delete this employee?")) deleteMutation.mutate(row.original.id, { onSuccess: () => showToast("Employee deleted"), onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete employee"), "error") }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                <div className="col-span-2"><Label>Email</Label><Input value={userForm.email || ""} onChange={(e) => setUserForm({ ...userForm, email: e.target.value } as Partial<CreateEmployeeWithUserDto>)} placeholder="email@company.com" /></div>
                <div><Label>First Name</Label><Input value={userForm.firstName || ""} onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value } as Partial<CreateEmployeeWithUserDto>)} /></div>
                <div><Label>Last Name</Label><Input value={userForm.lastName || ""} onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value } as Partial<CreateEmployeeWithUserDto>)} /></div>
                <div><Label>Employee Code <span className="text-xs text-muted-foreground">(auto-generate if empty)</span></Label><Input value={userForm.employeeCode || ""} onChange={(e) => setUserForm({ ...userForm, employeeCode: e.target.value } as Partial<CreateEmployeeWithUserDto>)} placeholder="Auto: SE-001" /></div>
                <div><Label>Password</Label><Input type="password" value={userForm.password || ""} onChange={(e) => setUserForm({ ...userForm, password: e.target.value } as Partial<CreateEmployeeWithUserDto>)} placeholder="Min 8 chars" /></div>
                <div><Label>Department</Label><Select value={userForm.departmentId || ""} onValueChange={(v) => setUserForm({ ...userForm, departmentId: v, designationId: "" } as Partial<CreateEmployeeWithUserDto>)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Designation</Label><Select value={userForm.designationId || ""} onValueChange={(v) => setUserForm({ ...userForm, designationId: v } as Partial<CreateEmployeeWithUserDto>)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{desigData?.data?.filter((d) => d.departmentId === userForm.departmentId).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Phone</Label><Input value={userForm.phone || ""} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value } as Partial<CreateEmployeeWithUserDto>)} /></div>
                <div><Label>Salary</Label><Input type="number" value={userForm.salary || 0} onChange={(e) => setUserForm({ ...userForm, salary: Number(e.target.value) } as Partial<CreateEmployeeWithUserDto>)} /></div>
              </div>
              <DialogFooter><Button onClick={() => { if (!userForm.email || !userForm.firstName || !userForm.lastName || !userForm.departmentId || !userForm.designationId || !userForm.password) { showToast("Please fill all required fields (Email, Name, Department, Designation, Password)", "error"); return; } createWithUserMutation.mutate(userForm as CreateEmployeeWithUserDto, { onSuccess: () => { showToast("Employee created with user"); setCreateWithUserOpen(false); resetUserForm(); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create employee"), "error") }); }} disabled={createWithUserMutation.isPending}>Create Employee</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Employee</DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Add Employee</DialogTitle><DialogDescription>Create an employee record (without login access)</DialogDescription></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Employee Code <span className="text-xs text-muted-foreground">(leave empty to auto-generate)</span></Label><Input value={form.employeeCode || ""} onChange={(e) => setForm({ ...form, employeeCode: e.target.value } as EmployeeForm)} placeholder="Auto: SE-001" /></div>
                <div><Label>Department</Label><Select value={form.departmentId || ""} onValueChange={(v) => setForm({ ...form, departmentId: v, designationId: "" } as EmployeeForm)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Designation</Label><Select value={form.designationId || ""} onValueChange={(v) => setForm({ ...form, designationId: v } as EmployeeForm)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{desigData?.data?.filter((d) => d.departmentId === form.departmentId).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value } as EmployeeForm)} /></div>
                <div><Label>Salary</Label><Input type="number" value={form.salary || 0} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) } as EmployeeForm)} /></div>
                <div><Label>Status</Label><Select value={form.status || "ACTIVE"} onValueChange={(v) => setForm({ ...form, status: v } as EmployeeForm)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem><SelectItem value="TERMINATED">Terminated</SelectItem></SelectContent></Select></div>
              </div>
              <DialogFooter><Button onClick={() => { if (!form.departmentId || !form.designationId) { showToast("Please fill Department and Designation", "error"); return; } createMutation.mutate(form as CreateEmployeeDto, { onSuccess: () => { showToast("Employee created"); setCreateOpen(false); resetForm(); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create employee"), "error") }); }} disabled={createMutation.isPending}>Save</Button></DialogFooter>
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
          <DialogFooter><Button onClick={() => { if (editItem) { updateMutation.mutate({ id: editItem.id, dto: form as UpdateEmployeeDto }, { onSuccess: () => { showToast("Employee updated"); setEditItem(null); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update employee"), "error") }); } }} disabled={updateMutation.isPending}>Save</Button></DialogFooter>
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
    </div>
  );
}
