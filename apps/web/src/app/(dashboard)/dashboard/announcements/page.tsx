"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Send, Archive, Eye, CheckCircle, Megaphone, Clock } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useCurrentUser } from "@/hooks/api";
import { useAnnouncements, useMyAnnouncements, useCreateAnnouncement, usePublishAnnouncement, useArchiveAnnouncement, useReadAnnouncement, useAcknowledgeAnnouncement, useAnnouncementReceipts } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { FieldError } from "@/components/shared/field-error";
import { validateForm, clearFieldError } from "@/components/shared/form-validation";
import type { ValidationRules } from "@/components/shared/form-validation";
import type { Announcement, CreateAnnouncementDto, AnnouncementPriority } from "@/lib/types";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-blue-100 text-blue-800",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800",
  NORMAL: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

const ROLES = ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"];

export default function AnnouncementsPage() {
  const { data: currentUser } = useCurrentUser();
  const isEmployee = currentUser?.user?.role === "EMPLOYEE";

  const [query, setQuery] = useState({ page: 1, limit: 10, search: "" });
  const { data, isLoading } = useAnnouncements({ page: query.page, limit: query.limit });
  const { data: myAnnouncements, isLoading: myLoading } = useMyAnnouncements();

  const createMutation = useCreateAnnouncement();
  const publishMutation = usePublishAnnouncement();
  const archiveMutation = useArchiveAnnouncement();
  const readMutation = useReadAnnouncement();
  const acknowledgeMutation = useAcknowledgeAnnouncement();
  const { showToast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Announcement | null>(null);
  const { data: receiptsData } = useAnnouncementReceipts(
    detailItem && currentUser?.user?.role !== "EMPLOYEE" ? detailItem.id : ""
  );
  const [confirmPublish, setConfirmPublish] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<CreateAnnouncementDto>>({});
  const [errors, setErrors] = useState<Partial<Record<"title" | "body" | "targetRoles", string>>>({});

  const resetForm = () => setForm({ title: "", body: "", priority: "NORMAL", targetRoles: [], targetEmployees: [], expiresAt: undefined });

  const handleCreate = () => {
    const rules: ValidationRules<CreateAnnouncementDto> = {
      title: { required: "Title is required" },
      body: { required: "Body is required" },
      targetRoles: { required: "Target roles are required" },
    };
    const errs = validateForm(form, rules);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    createMutation.mutate(
      { title: form.title!, body: form.body!, priority: (form.priority as AnnouncementPriority) || "NORMAL", targetRoles: form.targetRoles || [], targetEmployees: form.targetEmployees || [], expiresAt: form.expiresAt },
      { onSuccess: () => { setErrors({}); showToast("Announcement created"); setCreateOpen(false); resetForm(); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create announcement"), "error") },
    );
  };

  const handlePublish = () => {
    if (!confirmPublish) return;
    publishMutation.mutate(confirmPublish, {
      onSuccess: () => { showToast("Announcement published"); setConfirmPublish(null); },
      onError: (err) => showToast(getApiErrorMessage(err, "Failed to publish"), "error"),
    });
  };

  const handleArchive = () => {
    if (!confirmArchive) return;
    archiveMutation.mutate(confirmArchive, {
      onSuccess: () => { showToast("Announcement archived"); setConfirmArchive(null); },
      onError: (err) => showToast(getApiErrorMessage(err, "Failed to archive"), "error"),
    });
  };

  const handleRead = (id: string) => {
    readMutation.mutate(id, {
      onSuccess: () => showToast("Marked as read"),
      onError: (err) => showToast(getApiErrorMessage(err, "Failed to mark as read"), "error"),
    });
  };

  const handleAcknowledge = (id: string) => {
    acknowledgeMutation.mutate(id, {
      onSuccess: () => showToast("Acknowledged"),
      onError: (err) => showToast(getApiErrorMessage(err, "Failed to acknowledge"), "error"),
    });
  };

  const openDetail = (item: Announcement) => {
    setDetailItem(item);
  };

  const columns: ColumnDef<Announcement>[] = [
    { accessorKey: "title", header: "Title", cell: ({ row }) => <span className="font-medium">{row.original.title}</span> },
    { accessorKey: "priority", header: "Priority", cell: ({ row }) => <Badge variant="outline" className={priorityColors[row.original.priority]}>{row.original.priority}</Badge> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="outline" className={statusColors[row.original.status]}>{row.original.status}</Badge> },
    { accessorKey: "createdAt", header: "Created", cell: ({ row }) => <span className="text-sm text-muted-foreground">{format(new Date(row.original.createdAt), "MMM d, yyyy")}</span> },
    {
      id: "actions", header: "", cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => openDetail(item)}><Eye className="h-4 w-4" /></Button>
            {item.status === "DRAFT" && <Button variant="ghost" size="icon-sm" onClick={() => setConfirmPublish(item.id)}><Send className="h-4 w-4 text-green-600" /></Button>}
            {item.status === "PUBLISHED" && <Button variant="ghost" size="icon-sm" onClick={() => setConfirmArchive(item.id)}><Archive className="h-4 w-4 text-muted-foreground" /></Button>}
          </div>
        );
      },
    },
  ];

  if (isEmployee) {
    const myItems = Array.isArray(myAnnouncements) ? myAnnouncements : [];
    return (
      <div className="space-y-4">
        <div><h2 className="text-2xl font-semibold">My Announcements</h2><p className="text-sm text-muted-foreground">Announcements targeted to you</p></div>
        {myLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-md bg-muted" />)}</div>
        ) : myItems.length === 0 ? (
          <EmptyState icon={<Megaphone className="h-12 w-12" />} title="No announcements" description="There are no announcements targeted to you at this time." />
        ) : (
          <div className="space-y-3">
            {myItems.map((item) => (
              <div key={item.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{item.title}</h3>
                      <Badge variant="outline" className={priorityColors[item.priority]}>{item.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.body}</p>
                    {item.publishedAt && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Published {format(new Date(item.publishedAt), "MMM d, yyyy")}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRead(item.id)}>Mark Read</Button>
                    <Button size="sm" onClick={() => handleAcknowledge(item.id)}><CheckCircle className="h-4 w-4 mr-1" />Acknowledge</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Announcements</h2><p className="text-sm text-muted-foreground">Create and manage company announcements</p></div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> New Announcement</DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Title</Label><Input value={form.title || ""} onChange={(e) => { setForm({ ...form, title: e.target.value }); clearFieldError("title", setErrors); }} className={errors.title ? "border-red-500" : ""} /><FieldError error={errors.title} /></div>
              <div><Label>Body</Label><Textarea value={form.body || ""} onChange={(e) => { setForm({ ...form, body: e.target.value }); clearFieldError("body", setErrors); }} className={errors.body ? "border-red-500" : ""} rows={4} /><FieldError error={errors.body} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Priority</Label><Select value={form.priority || "NORMAL"} onValueChange={(v) => setForm({ ...form, priority: v as AnnouncementPriority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">Low</SelectItem><SelectItem value="NORMAL">Normal</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="URGENT">Urgent</SelectItem></SelectContent></Select></div>
                <div><Label>Expires At</Label><Input type="datetime-local" value={form.expiresAt || ""} onChange={(e) => setForm({ ...form, expiresAt: e.target.value || undefined })} /></div>
              </div>
              <div><Label>Target Roles</Label><div className="flex flex-wrap gap-2 mt-1">{ROLES.map((role) => <Badge key={role} variant={form.targetRoles?.includes(role) ? "default" : "outline"} className="cursor-pointer" onClick={() => { const current = form.targetRoles || []; setForm({ ...form, targetRoles: current.includes(role) ? current.filter((r) => r !== role) : [...current, role] }); clearFieldError("targetRoles", setErrors); }}>{role}</Badge>)}</div><FieldError error={errors.targetRoles} /></div>
            </div>
            <DialogFooter><Button onClick={handleCreate} disabled={createMutation.isPending}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} searchKey="announcements" onSearchChange={(s) => setQuery((prev) => ({ ...prev, search: s, page: 1 }))} pageCount={data?.meta?.totalPages} totalRecords={data?.meta?.total} onPaginationChange={(pageIndex, pageSize) => setQuery((prev) => ({ ...prev, page: pageIndex + 1, limit: pageSize }))} />

      {/* Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(o) => { if (!o) setDetailItem(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{detailItem?.title}</DialogTitle></DialogHeader>
          {detailItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-2"><Badge variant="outline" className={priorityColors[detailItem.priority]}>{detailItem.priority}</Badge><Badge variant="outline" className={statusColors[detailItem.status]}>{detailItem.status}</Badge></div>
              <p className="text-sm whitespace-pre-wrap">{detailItem.body}</p>
              {detailItem.publishedAt && <p className="text-xs text-muted-foreground">Published {format(new Date(detailItem.publishedAt), "MMM d, yyyy HH:mm")}</p>}
              {receiptsData && (
                <div className="space-y-2"><h4 className="text-sm font-medium">Receipts</h4><p className="text-xs text-muted-foreground">{receiptsData.counts.readCount} of {receiptsData.counts.total} read, {receiptsData.counts.acknowledgedCount} acknowledged</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">{receiptsData.receipts.map((r) => <div key={r.id} className="flex items-center justify-between text-xs"><span>{r.users?.firstName} {r.users?.lastName}</span><div className="flex gap-2">{r.readAt && <Badge variant="outline" className="bg-green-100 text-green-800">Read</Badge>}{r.acknowledgedAt && <Badge variant="outline" className="bg-blue-100 text-blue-800">Acknowledged</Badge>}</div></div>)}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmPublish} onOpenChange={(o) => { if (!o) setConfirmPublish(null); }} title="Publish Announcement" onConfirm={handlePublish} loading={publishMutation.isPending}>Are you sure you want to publish this announcement? It will be visible to all targeted employees.</ConfirmDialog>
      <ConfirmDialog open={!!confirmArchive} onOpenChange={(o) => { if (!o) setConfirmArchive(null); }} title="Archive Announcement" variant="destructive" onConfirm={handleArchive} loading={archiveMutation.isPending}>Are you sure you want to archive this announcement?</ConfirmDialog>
    </div>
  );
}
