"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { FileText, Plus, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";

import { useSopDocuments, useCreateSopDocument, useDeleteSopDocument, useAcknowledgeSop } from "@/hooks/api";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import type { SopDocument } from "@/lib/types";

export default function TrainingPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const { data, isLoading, isError } = useSopDocuments({ page: query.page, limit: query.limit });
  const createMutation = useCreateSopDocument();
  const deleteMutation = useDeleteSopDocument();
  const acknowledgeMutation = useAcknowledgeSop();
  const { showToast } = useToast();

  const allDocuments = data?.data ?? [];
  const filteredDocuments = useMemo(() => {
    if (!search.trim()) return allDocuments;
    return allDocuments.filter((doc) =>
      doc.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [allDocuments, search]);

  const columns: ColumnDef<SopDocument>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.department?.name ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={acknowledgeMutation.isPending}
              onClick={() => {
                acknowledgeMutation.mutate(doc.id, {
                  onSuccess: () => showToast("SOP acknowledged"),
                  onError: (err) =>
                    showToast(getApiErrorMessage(err, "Failed to acknowledge"), "error"),
                });
              }}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setConfirmDelete(doc.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  const resetForm = () => {
    setTitle("");
    setContent("");
    setFileUrl("");
  };

  const handleCreate = () => {
    if (!title.trim()) {
      showToast("Title is required", "error");
      return;
    }
    createMutation.mutate(
      {
        title: title.trim(),
        content: content.trim() || undefined,
        fileUrl: fileUrl.trim() || undefined,
      },
      {
        onSuccess: () => {
          showToast("SOP created");
          setCreateOpen(false);
          resetForm();
        },
        onError: (err) =>
          showToast(getApiErrorMessage(err, "Failed to create SOP"), "error"),
      }
    );
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete, {
      onSuccess: () => {
        showToast("SOP deleted");
        setConfirmDelete(null);
      },
      onError: (err) =>
        showToast(getApiErrorMessage(err, "Failed to delete SOP"), "error"),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Training &amp; SOP Library</h2>
          <p className="text-sm text-muted-foreground">
            Manage standard operating procedures and training documents.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create SOP
        </Button>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">Failed to load SOPs. Please try again later.</p>
        </div>
      ) : !isLoading && allDocuments.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No SOPs found"
          description="Create your first standard operating procedure to get started."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create SOP
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredDocuments}
          isLoading={isLoading}
          searchKey="title"
          onSearchChange={(s) => setSearch(s)}
          pageCount={data?.meta?.totalPages}
          totalRecords={data?.meta?.total}
          onPaginationChange={(pageIndex, pageSize) =>
            setQuery({ page: pageIndex + 1, limit: pageSize })
          }
        />
      )}

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create SOP</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Title</Label>
              <Input
                placeholder="Enter SOP title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Content</Label>
              <textarea
                placeholder="Enter SOP content"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div>
              <Label>File URL</Label>
              <Input
                placeholder="https://example.com/document.pdf"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="Delete SOP"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this SOP? This action cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
