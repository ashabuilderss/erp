"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, Eye, Download, FolderOpen, FileText } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useDocuments, useDocumentAccessLogs, useDocumentAccessStats, useRegisterDocument, useDeleteDocument, useLogDocumentAccess } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { FieldError } from "@/components/shared/field-error";
import { validateForm, clearFieldError } from "@/components/shared/form-validation";
import type { ValidationRules } from "@/components/shared/form-validation";
import type { DocumentRegistry, RegisterDocumentDto, DocumentCategory } from "@/lib/types";
import { format } from "date-fns";

const categoryColors: Record<string, string> = {
  GENERAL: "bg-gray-100 text-gray-800",
  CONTRACT: "bg-blue-100 text-blue-800",
  INVOICE: "bg-green-100 text-green-800",
  REPORT: "bg-purple-100 text-purple-800",
  PHOTO: "bg-orange-100 text-orange-800",
  DRAWING: "bg-cyan-100 text-cyan-800",
  CERTIFICATE: "bg-yellow-100 text-yellow-800",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "" });
  const { data, isLoading } = useDocuments({ page: query.page, limit: query.limit });
  const registerMutation = useRegisterDocument();
  const deleteMutation = useDeleteDocument();
  const logAccessMutation = useLogDocumentAccess();
  const { showToast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<DocumentRegistry | null>(null);
  const { data: accessLogs } = useDocumentAccessLogs(
    detailItem?.id ?? "",
    { page: 1, limit: 20 }
  );
  const { data: accessStats } = useDocumentAccessStats(detailItem?.id ?? "");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<RegisterDocumentDto>>({});
  const [errors, setErrors] = useState<Partial<Record<"name" | "fileType" | "fileSize" | "storageObjectId", string>>>({});

  const resetForm = () => setForm({ name: "", fileType: "", fileSize: 0, category: "GENERAL", storageObjectId: "", accessLevel: "COMPANY" });

  const handleCreate = () => {
    const rules: ValidationRules<RegisterDocumentDto> = {
      name: { required: "Name is required" },
      fileType: { required: "File type is required" },
      storageObjectId: { required: "Storage object ID is required" },
    };
    const errs = validateForm(form, rules);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    registerMutation.mutate(
      { name: form.name!, fileType: form.fileType!, fileSize: form.fileSize || 0, category: form.category as DocumentCategory, storageObjectId: form.storageObjectId!, accessLevel: form.accessLevel },
      { onSuccess: () => { setErrors({}); showToast("Document registered"); setCreateOpen(false); resetForm(); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to register document"), "error") },
    );
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete, {
      onSuccess: () => { showToast("Document deleted"); setConfirmDelete(null); },
      onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete"), "error"),
    });
  };

  const openDetail = (item: DocumentRegistry) => {
    setDetailItem(item);
  };

  const columns: ColumnDef<DocumentRegistry>[] = [
    { accessorKey: "name", header: "Name", cell: ({ row }) => <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{row.original.name}</span></div> },
    { accessorKey: "fileType", header: "Type", cell: ({ row }) => <span className="text-sm uppercase">{row.original.fileType}</span> },
    { accessorKey: "fileSize", header: "Size", cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatFileSize(row.original.fileSize)}</span> },
    { accessorKey: "category", header: "Category", cell: ({ row }) => <Badge variant="outline" className={categoryColors[row.original.category]}>{row.original.category}</Badge> },
    { accessorKey: "createdAt", header: "Registered", cell: ({ row }) => <span className="text-sm text-muted-foreground">{format(new Date(row.original.createdAt), "MMM d, yyyy")}</span> },
    {
      id: "actions", header: "", cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => openDetail(item)}><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Documents</h2><p className="text-sm text-muted-foreground">Manage document registry</p></div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Register Document</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Register Document</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Document Name</Label><Input value={form.name || ""} onChange={(e) => { setForm({ ...form, name: e.target.value }); clearFieldError("name", setErrors); }} className={errors.name ? "border-red-500" : ""} /><FieldError error={errors.name} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>File Type</Label><Input value={form.fileType || ""} placeholder="e.g. pdf" onChange={(e) => { setForm({ ...form, fileType: e.target.value }); clearFieldError("fileType", setErrors); }} className={errors.fileType ? "border-red-500" : ""} /><FieldError error={errors.fileType} /></div>
                <div><Label>File Size (bytes)</Label><Input type="number" value={form.fileSize || ""} onChange={(e) => setForm({ ...form, fileSize: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Category</Label><Select value={form.category || "GENERAL"} onValueChange={(v) => setForm({ ...form, category: v as DocumentCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="GENERAL">General</SelectItem><SelectItem value="CONTRACT">Contract</SelectItem><SelectItem value="INVOICE">Invoice</SelectItem><SelectItem value="REPORT">Report</SelectItem><SelectItem value="PHOTO">Photo</SelectItem><SelectItem value="DRAWING">Drawing</SelectItem><SelectItem value="CERTIFICATE">Certificate</SelectItem></SelectContent></Select></div>
              <div><Label>Storage Object ID</Label><Input value={form.storageObjectId || ""} onChange={(e) => { setForm({ ...form, storageObjectId: e.target.value }); clearFieldError("storageObjectId", setErrors); }} className={errors.storageObjectId ? "border-red-500" : ""} /><FieldError error={errors.storageObjectId} /></div>
            </div>
            <DialogFooter><Button onClick={handleCreate} disabled={registerMutation.isPending}>Register</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="documents" onSearchChange={(s) => setQuery((prev) => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery((prev) => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      {/* Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(o) => { if (!o) setDetailItem(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{detailItem?.name}</DialogTitle></DialogHeader>
          {detailItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Type:</span> <span className="uppercase">{detailItem.fileType}</span></div>
                <div><span className="text-muted-foreground">Size:</span> {formatFileSize(detailItem.fileSize)}</div>
                <div><span className="text-muted-foreground">Category:</span> <Badge variant="outline" className={categoryColors[detailItem.category]}>{detailItem.category}</Badge></div>
                <div><span className="text-muted-foreground">Access:</span> {detailItem.accessLevel}</div>
              </div>
              {accessStats && (
                <div className="flex gap-4 text-sm"><div><span className="text-muted-foreground">Total Accesses:</span> {accessStats.totalAccesses}</div><div><span className="text-muted-foreground">Unique Users:</span> {accessStats.uniqueUserCount}</div></div>
              )}
              {accessLogs && accessLogs.data.length > 0 && (
                <div className="space-y-2"><h4 className="text-sm font-medium">Access Logs</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1">{accessLogs.data.map((log) => <div key={log.id} className="flex items-center justify-between text-xs"><span>{log.users?.firstName} {log.users?.lastName} - {log.action}</span><span className="text-muted-foreground">{format(new Date(log.createdAt), "MMM d, HH:mm")}</span></div>)}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }} title="Delete Document" variant="destructive" onConfirm={handleDelete} loading={deleteMutation.isPending}>Are you sure you want to delete this document? This action cannot be undone.</ConfirmDialog>
    </div>
  );
}
