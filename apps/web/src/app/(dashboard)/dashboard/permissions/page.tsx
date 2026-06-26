"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUsers } from "@/hooks/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Search, Save } from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeleton-variants";

type PermissionGrant = { permission: string; granted: boolean };

interface UserGrantsData {
  userId: string;
  role: string;
  allPermissions: string[];
  grants: PermissionGrant[];
}

const PERMISSION_LABELS: Record<string, string> = {
  "user:read": "View Users",
  "user:create": "Create Users",
  "user:update": "Update Users",
  "user:delete": "Delete Users",
  "employee:read": "View Employees",
  "employee:create": "Create Employees",
  "employee:update": "Update Employees",
  "employee:delete": "Delete Employees",
  "employee:view-salary": "View Salaries",
  "department:read": "View Departments",
  "department:create": "Create Departments",
  "department:update": "Update Departments",
  "department:delete": "Delete Departments",
  "property:read": "View Properties",
  "property:create": "Create Properties",
  "property:update": "Update Properties",
  "property:delete": "Delete Properties",
  "lead:read": "View Leads",
  "lead:create": "Create Leads",
  "lead:update": "Update Leads",
  "lead:delete": "Delete Leads",
  "lead:convert": "Convert Leads",
  "customer:read": "View Customers",
  "customer:create": "Create Customers",
  "customer:update": "Update Customers",
  "customer:delete": "Delete Customers",
  "site-visit:read": "View Site Visits",
  "site-visit:create": "Create Site Visits",
  "site-visit:update": "Update Site Visits",
  "site-visit:delete": "Delete Site Visits",
  "booking:read": "View Bookings",
  "booking:create": "Create Bookings",
  "booking:update": "Update Bookings",
  "booking:delete": "Delete Bookings",
  "attendance:read": "View Attendance",
  "attendance:create": "Create Attendance",
  "attendance:verify": "Verify Attendance",
  "leave:read": "View Leaves",
  "leave:create": "Create Leaves",
  "leave:approve": "Approve Leaves",
  "notification:read": "View Notifications",
  "notification:send": "Send Notifications",
  "audit-log:read": "View Audit Logs",
  "dashboard:view": "View Dashboard",
  "report:view": "View Reports",
};

function categorizePermissions(perms: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {};
  for (const p of perms) {
    const cat = p.split(":")[0] || "other";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(p);
  }
  return categories;
}

const CATEGORY_LABELS: Record<string, string> = {
  user: "Users",
  employee: "Employees",
  department: "Departments",
  property: "Properties",
  lead: "Leads",
  customer: "Customers",
  "site-visit": "Site Visits",
  booking: "Bookings",
  attendance: "Attendance",
  leave: "Leave",
  notification: "Notifications",
  "audit-log": "Audit Logs",
  dashboard: "Dashboard",
  report: "Reports",
};

function PermissionEditor({
  grants,
  allPermissions,
  selectedUser,
  onSave,
  isSaving,
}: {
  grants: PermissionGrant[];
  allPermissions: string[];
  selectedUser: { firstName: string; lastName: string; role: string } | null;
  onSave: (grants: { permission: string; granted: boolean }[]) => void;
  isSaving: boolean;
}) {
  const [localGrants, setLocalGrants] = useState<Map<string, boolean>>(
    () => new Map(grants.map((g) => [g.permission, g.granted]))
  );
  const [dirty, setDirty] = useState(false);

  const grantMap = new Map(grants.map((g) => [g.permission, g.granted]));

  const isGranted = (perm: string) => {
    if (localGrants.has(perm)) return localGrants.get(perm)!;
    return grantMap.get(perm) ?? false;
  };

  const togglePermission = (perm: string) => {
    const current = isGranted(perm);
    const next = new Map(localGrants);
    next.set(perm, !current);
    setLocalGrants(next);
    setDirty(true);
  };

  const handleSave = () => {
    const changedGrants = Array.from(localGrants.entries()).map(([permission, granted]) => ({
      permission,
      granted,
    }));
    onSave(changedGrants);
    setDirty(false);
  };

  const categories = categorizePermissions(allPermissions);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {selectedUser ? (
              <>
                {selectedUser.firstName} {selectedUser.lastName}
                <Badge variant="secondary" className="ml-2">
                  {selectedUser.role}
                </Badge>
              </>
            ) : (
              "Select a user"
            )}
          </span>
          {dirty && (
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedUser ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ShieldCheck className="h-12 w-12 mb-3" />
            <p className="font-medium">Select a user to manage permissions</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[500px] overflow-y-auto">
            {Object.entries(categories).map(([cat, perms]) => (
              <div key={cat}>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {CATEGORY_LABELS[cat] || cat}
                </h4>
                <div className="space-y-1">
                  {perms.map((perm) => (
                    <label
                      key={perm}
                      className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <span className="text-sm">{PERMISSION_LABELS[perm] || perm}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isGranted(perm)}
                        onClick={() => togglePermission(perm)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          isGranted(perm) ? "bg-green-500" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition-transform ${
                            isGranted(perm) ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PermissionsPage() {
  const qc = useQueryClient();
  const { data: usersData, isLoading: usersLoading } = useUsers({ limit: 100 });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const {
    data: userGrants,
    isLoading: grantsLoading,
  } = useQuery({
    queryKey: ["permission-grants", selectedUserId],
    queryFn: () => api.get<UserGrantsData>(`/permission-grants/user/${selectedUserId}`),
    enabled: !!selectedUserId,
  });

  const saveMutation = useMutation({
    mutationFn: (grants: { permission: string; granted: boolean }[]) =>
      api.patch(`/permission-grants/user/${selectedUserId}`, { grants }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["permission-grants"] });
    },
  });

  const users = usersData?.data ?? [];
  const filteredUsers = users.filter(
    (u) =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.role}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Permission Manager</h2>
        <p className="text-sm text-muted-foreground">Override role-based permissions per user</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Users
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {usersLoading ? (
              <ListSkeleton rows={4} />
            ) : (
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                      selectedUserId === user.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="font-medium text-sm">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                      <Badge variant="outline" className="text-xs">{user.role}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {grantsLoading ? (
          <Card>
            <CardContent>
              <ListSkeleton rows={3} />
            </CardContent>
          </Card>
        ) : selectedUserId ? (
          <PermissionEditor
            key={selectedUserId}
            grants={userGrants?.grants ?? []}
            allPermissions={userGrants?.allPermissions ?? []}
            selectedUser={
              users.find((u) => u.id === selectedUserId)
                ? { firstName: users.find((u) => u.id === selectedUserId)!.firstName, lastName: users.find((u) => u.id === selectedUserId)!.lastName, role: users.find((u) => u.id === selectedUserId)!.role }
                : null
            }
            onSave={(grants) => saveMutation.mutate(grants)}
            isSaving={saveMutation.isPending}
          />
        ) : (
          <Card>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShieldCheck className="h-12 w-12 mb-3" />
                <p className="font-medium">Select a user to manage permissions</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
