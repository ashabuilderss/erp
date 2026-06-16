"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { useActivityLogs } from "@/hooks/api/useActivityLogs";
import type { ActivityLog, Employee } from "@/lib/types";
import { format } from "date-fns";

const actionColor = (action: string) => {
  if (action.startsWith("POST")) return "bg-green-100 text-green-800";
  if (action.startsWith("PATCH")) return "bg-blue-100 text-blue-800";
  if (action.startsWith("DELETE")) return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
};

export default function ActivityLogsPage() {
  const [query, setQuery] = useState({ page: 1, limit: 20 });
  const { data, isLoading } = useActivityLogs(query);

  const columns: ColumnDef<ActivityLog & { performedBy?: Employee | null }>[] = [
    { accessorKey: "createdAt", header: "Time", cell: ({ row }) => <span className="text-xs">{format(new Date(row.original.createdAt), "MMM dd, yyyy HH:mm:ss")}</span> },
    { accessorKey: "action", header: "Action", cell: ({ row }) => <Badge variant="outline" className={actionColor(row.original.action)}>{row.original.action}</Badge> },
    { accessorKey: "entityType", header: "Entity", cell: ({ row }) => <span className="font-medium">{row.original.entityType}</span> },
    { accessorKey: "entityId", header: "Entity ID", cell: ({ row }) => <code className="text-xs bg-muted px-1 py-0.5 rounded">{row.original.entityId}</code> },
    { accessorKey: "description", header: "Description", cell: ({ row }) => <span className="text-muted-foreground">{row.original.description}</span> },
    { accessorKey: "performedBy", header: "Performed By", cell: ({ row }) => {
      const emp = row.original.performedBy;
      return <span>{emp?.user ? `${emp.user.firstName} ${emp.user.lastName}` : emp?.employeeCode || "-"}</span>;
    }},
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Activity Logs</h2>
        <p className="text-sm text-muted-foreground">Audit trail of all system changes</p>
      </div>
      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="activity logs" onSearchChange={(s) => setQuery(prev => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery(prev => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />
    </div>
  );
}
