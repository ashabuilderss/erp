"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  useAgreements,
  useCreateAgreement,
  useSubmitAgreement,
  useApproveAgreement,
  useDeleteAgreement,
} from "@/hooks/api";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FileText, Plus, Trash2, Send, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import type {
  Agreement,
  AgreementType,
  AgreementStatus,
} from "@/lib/types/agreement";

const STATUS_CONFIG: Record<
  AgreementStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PENDING_APPROVAL: { label: "Pending Approval", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
};

const TYPE_CONFIG: Record<
  AgreementType,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  CIVIL: { label: "Civil", variant: "default" },
  STRUCTURE: { label: "Structure", variant: "outline" },
  OPERATIONS: { label: "Operations", variant: "secondary" },
};

export default function AgreementsPage() {
  const { showToast } = useToast();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | undefined>(undefined);
  const [approveId, setApproveId] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState({
    title: "",
    type: "" as AgreementType | "",
    content: "",
    attachments: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data, isLoading, isError } = useAgreements({
    page: page + 1,
    limit: 10,
    search: search || undefined,
    type: (typeFilter as AgreementType) || undefined,
    status: (statusFilter as AgreementStatus) || undefined,
  });

  const createAgreement = useCreateAgreement();
  const submitAgreement = useSubmitAgreement();
  const approveAgreement = useApproveAgreement();
  const deleteAgreement = useDeleteAgreement();

  const agreements = data?.data ?? [];
  const meta = data?.meta ?? { totalPages: 1, total: 0 };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }
    if (!formData.type) {
      errors.type = "Type is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field: string) => {
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCreate = () => {
    if (!validateForm()) return;

    createAgreement.mutate(
      {
        title: formData.title,
        type: formData.type as AgreementType,
        content: formData.content || undefined,
        attachments: formData.attachments || undefined,
      },
      {
        onSuccess: () => {
          showToast("Agreement created successfully", "success");
          setCreateOpen(false);
          setFormData({ title: "", type: "", content: "", attachments: "" });
          setFormErrors({});
        },
        onError: (error) => {
          showToast(
            getApiErrorMessage(error, "Failed to create agreement"),
            "error"
          );
        },
      }
    );
  };

  const handleSubmit = (id: string) => {
    submitAgreement.mutate(id, {
      onSuccess: () => {
        showToast("Agreement submitted for approval", "success");
      },
      onError: (error) => {
        showToast(
          getApiErrorMessage(error, "Failed to submit agreement"),
          "error"
        );
      },
    });
  };

  const handleApprove = () => {
    if (!approveId) return;

    approveAgreement.mutate(
      { id: approveId, dto: { comments: "Approved" } },
      {
        onSuccess: () => {
          showToast("Agreement approved", "success");
          setApproveId(undefined);
        },
        onError: (error) => {
          showToast(
            getApiErrorMessage(error, "Failed to approve agreement"),
            "error"
          );
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteId) return;

    deleteAgreement.mutate(deleteId, {
      onSuccess: () => {
        showToast("Agreement deleted", "success");
        setDeleteId(undefined);
      },
      onError: (error) => {
        showToast(
          getApiErrorMessage(error, "Failed to delete agreement"),
          "error"
        );
      },
    });
  };

  const columns: ColumnDef<Agreement>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const config = TYPE_CONFIG[row.original.type];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const config = STATUS_CONFIG[row.original.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) =>
        format(new Date(row.original.createdAt), "MMM d, yyyy"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const agreement = row.original;
        return (
          <div className="flex items-center gap-1">
            {agreement.status === "DRAFT" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSubmit(agreement.id)}
                disabled={submitAgreement.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
            {agreement.status === "PENDING_APPROVAL" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setApproveId(agreement.id)}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteId(agreement.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Agreements Management
          </h2>
          <p className="text-muted-foreground">
            Manage your agreements and track their approval status
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Agreement
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search agreements..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-sm"
        />
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value === "ALL" ? "" : (value ?? ""));
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="CIVIL">Civil</SelectItem>
            <SelectItem value="STRUCTURE">Structure</SelectItem>
            <SelectItem value="OPERATIONS">Operations</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value === "ALL" ? "" : (value ?? ""));
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">Failed to load agreements. Please try again later.</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading agreements...</div>
        </div>
      ) : agreements.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No agreements found"
          description="Create your first agreement to get started."
        />
      ) : (
        <DataTable
          columns={columns}
          data={agreements}
          pageCount={meta.totalPages}
          totalRecords={meta.total}
          isLoading={isLoading}
          onPaginationChange={(pageIndex) => setPage(pageIndex)}
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Agreement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  clearFieldError("title");
                }}
                placeholder="Enter agreement title"
              />
              {formErrors.title && (
                <p className="text-sm text-destructive">{formErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  setFormData({ ...formData, type: value as AgreementType });
                  clearFieldError("type");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CIVIL">Civil</SelectItem>
                  <SelectItem value="STRUCTURE">Structure</SelectItem>
                  <SelectItem value="OPERATIONS">Operations</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.type && (
                <p className="text-sm text-destructive">{formErrors.type}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Enter agreement content"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachments">Attachments (URL)</Label>
              <Input
                id="attachments"
                value={formData.attachments}
                onChange={(e) =>
                  setFormData({ ...formData, attachments: e.target.value })
                }
                placeholder="https://example.com/attachment.pdf"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createAgreement.isPending}
            >
              {createAgreement.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(undefined);
        }}
        title="Delete Agreement"
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteAgreement.isPending}
      >
        Are you sure you want to delete this agreement? This action cannot be
        undone.
      </ConfirmDialog>

      <ConfirmDialog
        open={!!approveId}
        onOpenChange={(open) => {
          if (!open) setApproveId(undefined);
        }}
        title="Approve Agreement"
        confirmLabel="Approve"
        onConfirm={handleApprove}
        loading={approveAgreement.isPending}
      >
        Are you sure you want to approve this agreement?
      </ConfirmDialog>
    </div>
  );
}
