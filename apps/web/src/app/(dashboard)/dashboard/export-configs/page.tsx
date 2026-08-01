"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  useExportConfigs,
  useCreateExportConfig,
  useUpdateExportConfig,
  useDeleteExportConfig,
} from "@/hooks/api";
import type { ExportConfig, ExportSyncStatus } from "@/lib/types";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Settings2, Trash2, Pencil, RefreshCw } from "lucide-react";
import { format } from "date-fns";

const EXPORT_TYPES = [
  { value: "LEADS", label: "Leads" },
  { value: "PROPERTIES", label: "Properties" },
  { value: "BOOKINGS", label: "Bookings" },
  { value: "EMPLOYEES", label: "Employees" },
  { value: "ATTENDANCE", label: "Attendance" },
  { value: "PAYROLL", label: "Payroll" },
  { value: "SITE_VISITS", label: "Site Visits" },
  { value: "EXPENSES", label: "Expenses" },
  { value: "COMMISSIONS", label: "Commissions" },
] as const;

const SYNC_STATUS_COLORS: Record<ExportSyncStatus, string> = {
  PENDING: "text-yellow-600 bg-yellow-50",
  SYNCING: "text-blue-600 bg-blue-50",
  COMPLETED: "text-green-600 bg-green-50",
  FAILED: "text-red-600 bg-red-50",
};

const SYNC_SCHEDULE_OPTIONS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
] as const;

const ROLE_OPTIONS = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "HR_MANAGER", label: "HR Manager" },
  { value: "ACCOUNTS", label: "Accounts" },
  { value: "MANAGER", label: "Manager" },
  { value: "TEAM_LEAD", label: "Team Lead" },
  { value: "EMPLOYEE", label: "Employee" },
] as const;

interface ExportConfigForm {
  exportType: string;
  sheetId: string;
  sheetName: string;
  syncEnabled: boolean;
  syncSchedule: string;
  allowedRoles: string[];
}

const INITIAL_FORM: ExportConfigForm = {
  exportType: "",
  sheetId: "",
  sheetName: "",
  syncEnabled: false,
  syncSchedule: "DAILY",
  allowedRoles: [],
};

export default function ExportConfigsPage() {
  const { data: configs, isLoading } = useExportConfigs();
  const createConfig = useCreateExportConfig();
  const updateConfig = useUpdateExportConfig();
  const deleteConfig = useDeleteExportConfig();
  const { showToast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<ExportConfig | null>(null);
  const [deleteItem, setDeleteItem] = useState<ExportConfig | null>(null);
  const [form, setForm] = useState<ExportConfigForm>(INITIAL_FORM);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const filtered = (configs ?? []).filter(
    (c) =>
      c.exportType.toLowerCase().includes(search.toLowerCase()) ||
      c.sheetName?.toLowerCase().includes(search.toLowerCase())
  );

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const resetForm = () => setForm(INITIAL_FORM);

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (item: ExportConfig) => {
    setForm({
      exportType: item.exportType,
      sheetId: item.sheetId ?? "",
      sheetName: item.sheetName ?? "",
      syncEnabled: item.syncEnabled,
      syncSchedule: item.syncSchedule ?? "DAILY",
      allowedRoles: item.allowedRoles ?? [],
    });
    setEditItem(item);
  };

  const handleCreate = async () => {
    if (!form.exportType) {
      showToast("Export type is required", "error");
      return;
    }
    if (form.allowedRoles.length === 0) {
      showToast("At least one role is required", "error");
      return;
    }
    try {
      await createConfig.mutateAsync({
        exportType: form.exportType,
        sheetId: form.sheetId || undefined,
        sheetName: form.sheetName || undefined,
        syncEnabled: form.syncEnabled,
        syncSchedule: form.syncSchedule,
        allowedRoles: form.allowedRoles,
      });
      showToast("Configuration created", "success");
      setCreateOpen(false);
      resetForm();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to create", "error");
    }
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    try {
      await updateConfig.mutateAsync({
        id: editItem.id,
        dto: {
          sheetId: form.sheetId || undefined,
          sheetName: form.sheetName || undefined,
          syncEnabled: form.syncEnabled,
          syncSchedule: form.syncSchedule,
          allowedRoles: form.allowedRoles,
        },
      });
      showToast("Configuration updated", "success");
      setEditItem(null);
      resetForm();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteConfig.mutateAsync(deleteItem.id);
      showToast("Configuration deleted", "success");
      setDeleteItem(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to delete", "error");
    }
  };

  const handleToggleSync = async (item: ExportConfig) => {
    try {
      await updateConfig.mutateAsync({
        id: item.id,
        dto: { syncEnabled: !item.syncEnabled },
      });
      showToast(`Sync ${!item.syncEnabled ? "enabled" : "disabled"}`, "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to toggle", "error");
    }
  };

  const columns: ColumnDef<ExportConfig>[] = [
    {
      accessorKey: "exportType",
      header: "Dataset",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.exportType}</span>
      ),
    },
    {
      accessorKey: "sheetName",
      header: "Sheet Name",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.sheetName ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "syncEnabled",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={row.original.syncEnabled ? "text-green-600 bg-green-50" : "text-muted-foreground bg-muted"}
        >
          {row.original.syncEnabled ? "Enabled" : "Disabled"}
        </Badge>
      ),
    },
    {
      accessorKey: "syncStatus",
      header: "Sync Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={SYNC_STATUS_COLORS[row.original.syncStatus]}>
          {row.original.syncStatus}
        </Badge>
      ),
    },
    {
      accessorKey: "lastSyncedAt",
      header: "Last Sync",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.lastSyncedAt
            ? format(new Date(row.original.lastSyncedAt), "MMM d, yyyy HH:mm")
            : "—"}
        </span>
      ),
    },
    {
      accessorKey: "syncSchedule",
      header: "Schedule",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.syncSchedule ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "allowedRoles",
      header: "Roles",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.allowedRoles?.map((role) => (
            <Badge key={role} variant="secondary" className="text-xs">
              {role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleSync(row.original)}
            title={row.original.syncEnabled ? "Disable sync" : "Enable sync"}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteItem(row.original)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Export Configurations</h2>
          <p className="text-sm text-muted-foreground">
            Manage Google Sheets sync configurations
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Configuration
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Export Configuration</DialogTitle>
              <DialogDescription>
                Configure a new dataset export to Google Sheets.
              </DialogDescription>
            </DialogHeader>
            <ConfigForm form={form} setForm={setForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createConfig.isPending}>
                {createConfig.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Settings2 className="h-12 w-12" />}
          title="No export configurations"
          description="Create a configuration to start syncing data to Google Sheets."
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Configuration
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={paged}
              searchKey="exportType"
              onSearchChange={(v) => {
                setSearch(v);
                setPage(0);
              }}
              pageCount={Math.ceil(filtered.length / pageSize)}
              totalRecords={filtered.length}
              onPaginationChange={(p, s) => {
                setPage(p);
                setPageSize(s);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Export Configuration</DialogTitle>
            <DialogDescription>
              Update the export configuration settings.
            </DialogDescription>
          </DialogHeader>
          <ConfigForm form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateConfig.isPending}>
              {updateConfig.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title="Delete Configuration"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteConfig.isPending}
      >
        Are you sure you want to delete this export configuration? This action
        cannot be undone.
      </ConfirmDialog>
    </div>
  );
}

function ConfigForm({
  form,
  setForm,
}: {
  form: ExportConfigForm;
  setForm: React.Dispatch<React.SetStateAction<ExportConfigForm>>;
}) {
  const toggleRole = (role: string) => {
    setForm((prev) => ({
      ...prev,
      allowedRoles: prev.allowedRoles.includes(role)
        ? prev.allowedRoles.filter((r) => r !== role)
        : [...prev.allowedRoles, role],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Dataset</Label>
        <Select value={form.exportType} onValueChange={(v) => setForm({ ...form, exportType: v ?? "" })}>
          <SelectTrigger>
            <SelectValue placeholder="Select dataset" />
          </SelectTrigger>
          <SelectContent>
            {EXPORT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Google Sheet ID</Label>
        <Input
          placeholder="Enter Google Sheet ID"
          value={form.sheetId}
          onChange={(e) => setForm({ ...form, sheetId: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Sheet Name</Label>
        <Input
          placeholder="Enter sheet name"
          value={form.sheetName}
          onChange={(e) => setForm({ ...form, sheetName: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Sync Schedule</Label>
        <Select value={form.syncSchedule} onValueChange={(v) => setForm({ ...form, syncSchedule: v ?? "DAILY" })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SYNC_SCHEDULE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="syncEnabled"
          checked={form.syncEnabled}
          onChange={(e) => setForm({ ...form, syncEnabled: e.target.checked })}
          className="h-4 w-4"
        />
        <Label htmlFor="syncEnabled">Enable automatic sync</Label>
      </div>

      <div className="space-y-2">
        <Label>Allowed Roles</Label>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((r) => (
            <Badge
              key={r.value}
              variant={form.allowedRoles.includes(r.value) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleRole(r.value)}
            >
              {r.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
