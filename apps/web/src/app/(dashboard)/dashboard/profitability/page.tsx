"use client";

import { useState } from "react";

import { type ColumnDef } from "@tanstack/react-table";
import {
  useProjectBudgets,
  useProfitabilitySummary,
  useCreateProjectBudget,
  useAddCostEntry,
  useDeleteCostEntry,
} from "@/hooks/api";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton-variants";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  DollarSign,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  FolderOpen,
  Eye,
} from "lucide-react";
import type { ProjectBudget } from "@/lib/types";

export default function ProfitabilityPage() {
  const [page, setPage] = useState(0);
  const limit = 10;

  const [createOpen, setCreateOpen] = useState(false);
  const [addCostOpen, setAddCostOpen] = useState(false);
  const [costEntriesOpen, setCostEntriesOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<ProjectBudget | null>(
    null
  );

  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  const [newSiteId, setNewSiteId] = useState("");
  const [newBudgetAmount, setNewBudgetAmount] = useState("");
  const [costCategory, setCostCategory] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [costDescription, setCostDescription] = useState("");
  const [costDate, setCostDate] = useState("");

  const { showToast } = useToast();

  const { data: summary, isLoading: summaryLoading, isError: summaryError } =
    useProfitabilitySummary();

  const { data: budgetsResponse, isLoading: budgetsLoading, isError: budgetsError } =
    useProjectBudgets({ page: page + 1, limit });

  const createBudget = useCreateProjectBudget();
  const addCostEntry = useAddCostEntry();
  const deleteCostEntry = useDeleteCostEntry();

  const budgets = budgetsResponse?.data ?? [];
  const meta = budgetsResponse?.meta;

  const variance = summary?.variance ?? 0;

  const handleCreateBudget = () => {
    if (!newSiteId || !newBudgetAmount) return;
    createBudget.mutate(
      {
        siteId: newSiteId,
        budgetAmount: parseFloat(newBudgetAmount),
      },
      {
        onSuccess: () => {
          showToast("Project budget created");
          setCreateOpen(false);
          setNewSiteId("");
          setNewBudgetAmount("");
        },
        onError: (error: Error) => {
          showToast(getApiErrorMessage(error, "Failed to create budget"), "error");
        },
      }
    );
  };

  const handleAddCostEntry = () => {
    if (!selectedBudget || !costCategory || !costAmount) return;
    addCostEntry.mutate(
      {
        budgetId: selectedBudget.id,
        dto: {
          category: costCategory,
          amount: parseFloat(costAmount),
          description: costDescription || undefined,
          date: costDate || undefined,
        },
      },
      {
        onSuccess: () => {
          showToast("Cost entry added");
          setAddCostOpen(false);
          setCostCategory("");
          setCostAmount("");
          setCostDescription("");
          setCostDate("");
        },
        onError: (error: Error) => {
          showToast(getApiErrorMessage(error, "Failed to add cost entry"), "error");
        },
      }
    );
  };

  const handleDeleteCostEntry = () => {
    if (!deleteEntryId) return;
    deleteCostEntry.mutate(deleteEntryId, {
      onSuccess: () => {
        showToast("Cost entry deleted");
        setDeleteEntryId(null);
      },
      onError: (error) => {
        showToast(getApiErrorMessage(error, "Failed to delete entry"), "error");
      },
    });
  };

  const columns: ColumnDef<ProjectBudget>[] = [
    {
      accessorKey: "site",
      header: "Site Name",
      cell: ({ row }) => {
        const budget = row.original;
        return budget.site?.name ?? budget.siteId;
      },
    },
    {
      accessorKey: "budgetAmount",
      header: "Budget Amount",
      cell: ({ row }) => (
        <span className="font-medium">
          ${row.original.budgetAmount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "actualAmount",
      header: "Spent Amount",
      cell: ({ row }) => (
        <span>${row.original.actualAmount.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const variant =
          status === "active"
            ? "default"
            : status === "completed"
              ? "secondary"
              : "outline";
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      id: "variance",
      header: "Variance",
      cell: ({ row }) => {
        const v = row.original.budgetAmount - row.original.actualAmount;
        const isPositive = v >= 0;
        return (
          <span
            className={`font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
          >
            {isPositive ? "+" : "-"}${Math.abs(v).toLocaleString()}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const budget = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setSelectedBudget(budget);
                setCostEntriesOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setSelectedBudget(budget);
                setAddCostOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Project Profitability
        </h2>
        <p className="text-muted-foreground">
          Track budgets, expenses, and profitability across projects
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Total Budget</span>
            </div>
            {summaryLoading ? (
              <div className="h-7 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold">
                ${(summary?.totalBudget ?? 0).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Total Spent</span>
            </div>
            {summaryLoading ? (
              <div className="h-7 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold">
                ${(summary?.totalActual ?? 0).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {variance >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm">Profit / Loss</span>
            </div>
            {summaryLoading ? (
              <div className="h-7 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <p
                className={`text-2xl font-bold ${variance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {variance >= 0 ? "+" : "-"}$
                {Math.abs(variance).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FolderOpen className="h-4 w-4" />
              <span className="text-sm"># Projects</span>
            </div>
            {summaryLoading ? (
              <div className="h-7 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold">
                {summary?.siteCount ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meta?.total ?? 0} project budgets total
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </div>

      {budgetsError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">Failed to load project budgets. Please try again later.</p>
        </div>
      ) : budgetsLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : budgets.length === 0 ? (
        <EmptyState
          title="No project budgets"
          description="Create your first project budget to start tracking profitability."
          icon={<DollarSign className="h-12 w-12" />}
        />
      ) : (
        <DataTable
          columns={columns}
          data={budgets}
          pageCount={meta?.totalPages ?? 1}
          totalRecords={meta?.total ?? 0}
          onPaginationChange={(pageIndex) => setPage(pageIndex)}
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteId">Site ID</Label>
              <Input
                id="siteId"
                value={newSiteId}
                onChange={(e) => setNewSiteId(e.target.value)}
                placeholder="Enter site ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetAmount">Budget Amount</Label>
              <Input
                id="budgetAmount"
                type="number"
                value={newBudgetAmount}
                onChange={(e) => setNewBudgetAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBudget}
              disabled={!newSiteId || !newBudgetAmount || createBudget.isPending}
            >
              {createBudget.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addCostOpen} onOpenChange={setAddCostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cost Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={costCategory}
                onValueChange={(value) => setCostCategory(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="permits">Permits</SelectItem>
                  <SelectItem value="subcontractor">Subcontractor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="costAmount">Amount</Label>
              <Input
                id="costAmount"
                type="number"
                value={costAmount}
                onChange={(e) => setCostAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costDescription">Description</Label>
              <Input
                id="costDescription"
                value={costDescription}
                onChange={(e) => setCostDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costDate">Date</Label>
              <Input
                id="costDate"
                type="date"
                value={costDate}
                onChange={(e) => setCostDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCostOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCostEntry}
              disabled={
                !costCategory || !costAmount || addCostEntry.isPending
              }
            >
              {addCostEntry.isPending ? "Adding..." : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={costEntriesOpen} onOpenChange={setCostEntriesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Budget Details</DialogTitle>
          </DialogHeader>
          {selectedBudget && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Budget</p>
                  <p className="font-medium">
                    ${selectedBudget.budgetAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Spent</p>
                  <p className="font-medium">
                    ${selectedBudget.actualAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Variance</p>
                  <p
                    className={`font-medium ${
                      selectedBudget.budgetAmount - selectedBudget.actualAmount >=
                      0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    $
                    {Math.abs(
                      selectedBudget.budgetAmount - selectedBudget.actualAmount
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
              {selectedBudget.costEntries &&
              selectedBudget.costEntries.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Cost Entries</p>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-9 px-3 text-left font-medium text-muted-foreground">
                            Category
                          </th>
                          <th className="h-9 px-3 text-left font-medium text-muted-foreground">
                            Amount
                          </th>
                          <th className="h-9 px-3 text-left font-medium text-muted-foreground">
                            Description
                          </th>
                          <th className="h-9 px-3 text-left font-medium text-muted-foreground">
                            Date
                          </th>
                          <th className="h-9 px-3 text-right font-medium text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBudget.costEntries.map((entry) => (
                          <tr key={entry.id} className="border-b last:border-0">
                            <td className="p-3">{entry.category}</td>
                            <td className="p-3">
                              ${entry.amount.toLocaleString()}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {entry.description ?? "-"}
                            </td>
                            <td className="p-3">{entry.date}</td>
                            <td className="p-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setDeleteEntryId(entry.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No cost entries yet
                </p>
              )}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    setCostEntriesOpen(false);
                    setAddCostOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entry
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteEntryId}
        onOpenChange={(open) => {
          if (!open) setDeleteEntryId(null);
        }}
        title="Delete Cost Entry"
        onConfirm={handleDeleteCostEntry}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteCostEntry.isPending}
      >
        Are you sure you want to delete this cost entry? This action cannot be
        undone.
      </ConfirmDialog>
    </div>
  );
}
