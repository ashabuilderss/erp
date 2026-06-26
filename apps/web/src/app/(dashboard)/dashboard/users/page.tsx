"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useUsers, useUpdateUser } from "@/hooks/api";
import { ROLE_LABELS } from "@/lib/constants";
import type { User } from "@/lib/types";

const roleColors: Record<string, string> = {
  OWNER: "bg-red-100 text-red-800",
  ADMIN: "bg-purple-100 text-purple-800",
  HR_MANAGER: "bg-blue-100 text-blue-800",
  EMPLOYEE: "bg-green-100 text-green-800",
};

const activeColors: Record<string, string> = {
  true: "bg-green-100 text-green-800",
  false: "bg-red-100 text-red-800",
};

export default function UsersPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "" });
  const { data, isLoading } = useUsers(query);
  const updateMutation = useUpdateUser();

  const columns: ColumnDef<User>[] = [
    { accessorKey: "firstName", header: "Name", cell: ({ row }) => <span className="font-medium">{row.original.firstName} {row.original.lastName}</span> },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "role", header: "Role", cell: ({ row }) => (
      <Badge variant="outline" className={roleColors[row.original.role]}>{ROLE_LABELS[row.original.role]}</Badge>
    )},
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={activeColors[String(row.original.isActive)]}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Select
            value={row.original.role || ""}
            onValueChange={(v) => updateMutation.mutate({ id: row.original.id, dto: { role: v as string } })}
          >
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={row.original.isActive ? "destructive" : "outline"}
            size="sm"
            onClick={() => updateMutation.mutate({ id: row.original.id, dto: { isActive: !row.original.isActive } })}
            disabled={updateMutation.isPending}
          >
            {row.original.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Users</h2>
        <p className="text-sm text-muted-foreground">Manage user roles and access</p>
      </div>
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        searchKey="users"
        onSearchChange={(s) => setQuery((prev) => ({ ...prev, search: s, page: 1 }))}
        pageCount={data?.meta?.totalPages}
        totalRecords={data?.meta?.total}
        onPaginationChange={(pageIndex, pageSize) => setQuery((prev) => ({ ...prev, page: pageIndex + 1, limit: pageSize }))}
      />
    </div>
  );
}
