"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, Wrench, RotateCcw, Package, UserPlus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAssets, useAssetSummary, useCreateAsset, useDeleteAsset, useAssignAsset, useReturnAsset } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import type { Asset } from "@/lib/types";
import { getApiErrorMessage } from "@/lib/api";
import { FieldError } from "@/components/shared/field-error";
import { validateForm, clearFieldError } from "@/components/shared/form-validation";
import type { ValidationRules } from "@/components/shared/form-validation";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton-variants";

type AssetForm = {
  name: string;
  category: string;
  serialNumber: string;
  qrCode: string;
  purchaseDate: string;
  purchaseCost: string;
};

type AssignForm = {
  employeeId: string;
};

const statusBadgeClasses: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  IN_REPAIR: "bg-yellow-100 text-yellow-800",
  RETIRED: "bg-gray-100 text-gray-800",
};

const categoryOptions = [
  "Laptop",
  "Desktop",
  "Monitor",
  "Phone",
  "Tablet",
  "Printer",
  "Furniture",
  "Vehicle",
  "Other",
];

export default function AssetsPage() {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "",
  });

  const { data, isLoading, isError } = useAssets({
    page: query.page,
    limit: query.limit,
    search: query.search || undefined,
    status: query.status || undefined,
  });

  const { data: summary } = useAssetSummary();
  const { showToast } = useToast();
  const createMutation = useCreateAsset();
  const deleteMutation = useDeleteAsset();
  const assignMutation = useAssignAsset();
  const returnMutation = useReturnAsset();

  const [createOpen, setCreateOpen] = useState(false);
  const [assignItem, setAssignItem] = useState<Asset | null>(null);
  const [deleteItem, setDeleteItem] = useState<Asset | null>(null);

  const [form, setForm] = useState<AssetForm>({
    name: "",
    category: "",
    serialNumber: "",
    qrCode: "",
    purchaseDate: "",
    purchaseCost: "",
  });
  const [assignForm, setAssignForm] = useState<AssignForm>({ employeeId: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof AssetForm, string>>>({});
  const [assignErrors, setAssignErrors] = useState<Partial<Record<keyof AssignForm, string>>>({});

  const resetForm = () =>
    setForm({ name: "", category: "", serialNumber: "", qrCode: "", purchaseDate: "", purchaseCost: "" });
  const resetAssignForm = () => setAssignForm({ employeeId: "" });

  const assets = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;
  const totalRecords = data?.meta?.total || 0;

  const getAssignedName = (asset: Asset) => {
    if (asset.employees) {
      const user = asset.employees.user;
      if (user) return `${user.firstName} ${user.lastName}`;
      return asset.employees.employeeCode || "-";
    }
    return "-";
  };

  const columns: ColumnDef<Asset>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <span>{row.original.category || "-"}</span>,
    },
    {
      accessorKey: "serialNumber",
      header: "Serial Number",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.serialNumber || "-"}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={statusBadgeClasses[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "currentAssigneeId",
      header: "Assigned To",
      cell: ({ row }) => <span>{row.original.status === "ASSIGNED" ? getAssignedName(row.original) : "-"}</span>,
    },
    {
      accessorKey: "purchaseCost",
      header: "Purchase Cost",
      cell: ({ row }) =>
        row.original.purchaseCost != null ? (
          <span>${row.original.purchaseCost.toLocaleString()}</span>
        ) : (
          <span>-</span>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const asset = row.original;
        return (
          <div className="flex items-center gap-1">
            {asset.status === "AVAILABLE" && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setAssignItem(asset);
                  resetAssignForm();
                }}
                title="Assign Asset"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
            {asset.status === "ASSIGNED" && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  returnMutation.mutate(
                    { id: asset.id, dto: {} },
                    {
                      onSuccess: () => showToast("Asset returned"),
                      onError: (err) =>
                        showToast(getApiErrorMessage(err, "Failed to return asset"), "error"),
                    }
                  );
                }}
                title="Return Asset"
                disabled={returnMutation.isPending}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            {asset.status === "IN_REPAIR" && (
              <Button variant="ghost" size="icon-sm" disabled title="In Repair">
                <Wrench className="h-4 w-4 text-yellow-600" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteItem(asset)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Assets</p>
            <p className="text-2xl font-bold">{summary?.total ?? "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Assigned</p>
            <p className="text-2xl font-bold">{summary?.assigned ?? "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">In Repair</p>
            <p className="text-2xl font-bold">{summary?.inRepair ?? "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold">{summary?.available ?? "-"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Asset Management</h2>
          <p className="text-sm text-muted-foreground">Track and manage company assets</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={query.status || "all"}
            onValueChange={(v) =>
              setQuery((prev) => ({ ...prev, status: v === "all" || v === null ? "" : v, page: 1 }))
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="IN_REPAIR">In Repair</SelectItem>
              <SelectItem value="RETIRED">Retired</SelectItem>
            </SelectContent>
          </Select>

          <Dialog
            open={createOpen}
            onOpenChange={(o) => {
              setCreateOpen(o);
              if (!o) {
                resetForm();
                setErrors({});
              }
            }}
          >
            <DialogTrigger render={<Button />}>
              <Plus className="h-4 w-4" /> Add Asset
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Asset</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      clearFieldError("name", setErrors);
                    }}
                    placeholder="e.g. Dell XPS 15"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  <FieldError error={errors.name} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v || "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Serial Number</Label>
                  <Input
                    value={form.serialNumber}
                    onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                    placeholder="e.g. SN-001"
                  />
                </div>
                <div>
                  <Label>QR Code</Label>
                  <Input
                    value={form.qrCode}
                    onChange={(e) => setForm({ ...form, qrCode: e.target.value })}
                    placeholder="e.g. QR-001"
                  />
                </div>
                <div>
                  <Label>Purchase Cost</Label>
                  <Input
                    type="number"
                    value={form.purchaseCost}
                    onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Purchase Date</Label>
                  <Input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    const rules: ValidationRules<AssetForm> = {
                      name: { required: "Name is required" },
                    };
                    const fieldErrors = validateForm(form, rules);
                    setErrors(fieldErrors);
                    if (Object.keys(fieldErrors).length > 0) return;

                    createMutation.mutate(
                      {
                        name: form.name,
                        category: form.category || undefined,
                        serialNumber: form.serialNumber || undefined,
                        purchaseCost: form.purchaseCost ? Number(form.purchaseCost) : undefined,
                        purchaseDate: form.purchaseDate || undefined,
                      },
                      {
                        onSuccess: () => {
                          showToast("Asset created");
                          setCreateOpen(false);
                          resetForm();
                          setErrors({});
                        },
                        onError: (err) =>
                          showToast(getApiErrorMessage(err, "Failed to create asset"), "error"),
                      }
                    );
                  }}
                  disabled={createMutation.isPending}
                >
                  Create Asset
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">Failed to load assets. Please try again later.</p>
        </div>
      ) : isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : assets.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="No assets found"
          description="Add your first asset to get started"
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Asset
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={assets}
          isLoading={isLoading}
          searchKey="assets"
          onSearchChange={(s) => setQuery((prev) => ({ ...prev, search: s, page: 1 }))}
          pageCount={totalPages}
          totalRecords={totalRecords}
          onPaginationChange={(pageIndex, pageSize) =>
            setQuery((prev) => ({ ...prev, page: pageIndex + 1, limit: pageSize }))
          }
        />
      )}

      <Dialog
        open={!!assignItem}
        onOpenChange={(o) => {
          if (!o) {
            setAssignItem(null);
            resetAssignForm();
            setAssignErrors({});
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Assigning: <span className="font-medium text-foreground">{assignItem?.name}</span>
            </p>
            <div>
              <Label>Employee ID *</Label>
              <Input
                value={assignForm.employeeId}
                onChange={(e) => {
                  setAssignForm({ employeeId: e.target.value });
                  clearFieldError("employeeId", setAssignErrors);
                }}
                placeholder="Enter employee ID"
                className={assignErrors.employeeId ? "border-red-500" : ""}
              />
              <FieldError error={assignErrors.employeeId} />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                const rules: ValidationRules<AssignForm> = {
                  employeeId: { required: "Employee ID is required" },
                };
                const fieldErrors = validateForm(assignForm, rules);
                setAssignErrors(fieldErrors);
                if (Object.keys(fieldErrors).length > 0) return;

                if (assignItem) {
                  assignMutation.mutate(
                    { id: assignItem.id, dto: { employeeId: assignForm.employeeId } },
                    {
                      onSuccess: () => {
                        showToast("Asset assigned");
                        setAssignItem(null);
                        resetAssignForm();
                        setAssignErrors({});
                      },
                      onError: (err) =>
                        showToast(getApiErrorMessage(err, "Failed to assign asset"), "error"),
                    }
                  );
                }
              }}
              disabled={assignMutation.isPending}
            >
              <UserPlus className="h-4 w-4 mr-2" /> Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(o) => {
          if (!o) setDeleteItem(null);
        }}
        title="Delete Asset"
        variant="destructive"
        onConfirm={() => {
          if (deleteItem) {
            deleteMutation.mutate(deleteItem.id, {
              onSuccess: () => {
                showToast("Asset deleted");
                setDeleteItem(null);
              },
              onError: (err) =>
                showToast(getApiErrorMessage(err, "Failed to delete asset"), "error"),
            });
          } else {
            setDeleteItem(null);
          }
        }}
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete <span className="font-medium">{deleteItem?.name}</span>? This
        action cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
