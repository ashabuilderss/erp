"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Clock,
  Users,
  FileText,
  ListChecks,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FieldError } from "@/components/shared/field-error";
import {
  clearFieldError,
  validateForm,
  type ValidationRules,
} from "@/components/shared/form-validation";
import {
  useMeetings,
  useCreateMeeting,
  useDeleteMeeting,
  useCompleteMeeting,
  useCancelMeeting,
  useMeeting,
} from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { format } from "date-fns";
import type {
  Meeting,
  MeetingStatus,
  CreateMeetingDto,
} from "@/lib/types";

const statusConfig: Record<
  MeetingStatus,
  { label: string; className: string }
> = {
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-blue-100 text-blue-800",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-100 text-green-800",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800",
  },
};

const statusFilters = [
  { value: "ALL", label: "All Statuses" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function MeetingsPage() {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    status: undefined as string | undefined,
    search: "",
  });

  const { data, isLoading, isError } = useMeetings(query);
  const createMutation = useCreateMeeting();
  const deleteMutation = useDeleteMeeting();
  const completeMutation = useCompleteMeeting();
  const cancelMutation = useCancelMeeting();
  const { showToast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<Partial<CreateMeetingDto>>({});
  const [errors, setErrors] = useState<
    Partial<Record<"title" | "scheduledAt", string>>
  >({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: detailData, isLoading: detailLoading } = useMeeting(
    detailId ?? ""
  );
  const [minutesOpen, setMinutesOpen] = useState(false);
  const [actionItemOpen, setActionItemOpen] = useState(false);
  const [minutesContent, setMinutesContent] = useState("");
  const [actionDescription, setActionDescription] = useState("");
  const [actionDueDate, setActionDueDate] = useState("");
  const [minutesExpanded, setMinutesExpanded] = useState(true);
  const [actionItemsExpanded, setActionItemsExpanded] = useState(true);

  const resetForm = () =>
    setForm({ title: "", scheduledAt: "", location: "", attendeeIds: [] });

  const handleCreate = () => {
    const rules: ValidationRules<CreateMeetingDto> = {
      title: { required: "Title is required" },
      scheduledAt: { required: "Scheduled time is required" },
    };
    const fieldErrors = validateForm(form, rules);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    const attendeeIds = form.attendeeIds
      ? (form.attendeeIds as unknown as string)
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    createMutation.mutate(
      {
        title: form.title!,
        scheduledAt: form.scheduledAt!,
        location: form.location || undefined,
        attendeeIds: attendeeIds.length > 0 ? attendeeIds : undefined,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          resetForm();
          setErrors({});
          showToast("Meeting created successfully");
        },
        onError: (err) =>
          showToast(getApiErrorMessage(err, "Failed to create meeting"), "error"),
      }
    );
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete, {
      onSuccess: () => {
        showToast("Meeting deleted");
        setConfirmDelete(null);
        setDetailId(null);
      },
      onError: (err) =>
        showToast(getApiErrorMessage(err, "Failed to delete meeting"), "error"),
    });
  };

  const handleComplete = (id: string) => {
    completeMutation.mutate(id, {
      onSuccess: () => showToast("Meeting marked as completed"),
      onError: (err) =>
        showToast(
          getApiErrorMessage(err, "Failed to complete meeting"),
          "error"
        ),
    });
  };

  const handleCancel = (id: string) => {
    cancelMutation.mutate(id, {
      onSuccess: () => showToast("Meeting cancelled"),
      onError: (err) =>
        showToast(
          getApiErrorMessage(err, "Failed to cancel meeting"),
          "error"
        ),
    });
  };

  const columns: ColumnDef<Meeting>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <button
          className="font-medium text-left hover:underline"
          onClick={() => setDetailId(row.original.id)}
        >
          {row.original.title}
        </button>
      ),
    },
    {
      accessorKey: "scheduledAt",
      header: "Scheduled At",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.scheduledAt), "MMM d, yyyy h:mm a")}
        </span>
      ),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) =>
        row.original.location ? (
          <span className="flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            {row.original.location}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "organizerId",
      header: "Organizer",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.employees?.user
            ? `${row.original.employees.user.firstName} ${row.original.employees.user.lastName}`
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const cfg = statusConfig[row.original.status];
        return (
          <Badge variant="outline" className={cfg?.className}>
            {cfg?.label ?? row.original.status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const meeting = row.original;
        return (
          <div className="flex items-center gap-1">
            {meeting.status === "SCHEDULED" && (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Complete"
                  onClick={() => handleComplete(meeting.id)}
                  disabled={completeMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Cancel"
                  onClick={() => handleCancel(meeting.id)}
                  disabled={cancelMutation.isPending}
                >
                  <XCircle className="h-4 w-4 text-red-600" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              title="Delete"
              onClick={() => setConfirmDelete(meeting.id)}
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Meeting Management</h2>
          <p className="text-sm text-muted-foreground">
            Schedule, track, and manage meetings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={query.status ?? "ALL"}
            onValueChange={(value) =>
              setQuery((prev) => ({
                ...prev,
                status: value === "ALL" ? undefined : (value as string),
                page: 1,
              }))
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
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
              <Plus className="h-4 w-4" /> New Meeting
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule Meeting</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={form.title || ""}
                    onChange={(e) => {
                      setForm({ ...form, title: e.target.value });
                      clearFieldError("title", setErrors);
                    }}
                    className={errors.title ? "border-red-500" : ""}
                    placeholder="Meeting title"
                  />
                  <FieldError error={errors.title} />
                </div>
                <div>
                  <Label>Scheduled At</Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduledAt || ""}
                    onChange={(e) => {
                      setForm({ ...form, scheduledAt: e.target.value });
                      clearFieldError("scheduledAt", setErrors);
                    }}
                    className={errors.scheduledAt ? "border-red-500" : ""}
                  />
                  <FieldError error={errors.scheduledAt} />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={form.location || ""}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    placeholder="Office, Zoom link, etc."
                  />
                </div>
                <div>
                  <Label>Attendee IDs (comma-separated)</Label>
                  <Input
                    value={
                      Array.isArray(form.attendeeIds)
                        ? form.attendeeIds.join(", ")
                        : ""
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        attendeeIds: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean) as unknown as string[],
                      })
                    }
                    placeholder="emp-001, emp-002"
                  />
                </div>
              </div>
              <DialogFooter showCloseButton>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">Failed to load meetings. Please try again later.</p>
        </div>
      ) : !isLoading && (data?.data || []).length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No meetings scheduled yet</p>
        </div>
      ) : (
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        searchKey="meetings"
        onSearchChange={(s) =>
          setQuery((prev) => ({ ...prev, search: s, page: 1 }))
        }
        pageCount={data?.meta?.totalPages}
        totalRecords={data?.meta?.total}
        onPaginationChange={(pageIndex, pageSize) =>
          setQuery((prev) => ({
            ...prev,
            page: pageIndex + 1,
            limit: pageSize,
          }))
        }
      />
      )}

      <Dialog
        open={!!detailId}
        onOpenChange={(o) => {
          if (!o) setDetailId(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {detailLoading ? "Loading..." : detailData?.title ?? "Meeting"}
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading meeting details...
            </div>
          ) : detailData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(
                      new Date(detailData.scheduledAt),
                      "MMM d, yyyy h:mm a"
                    )}
                  </span>
                </div>
                {detailData.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{detailData.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Badge
                    variant="outline"
                    className={statusConfig[detailData.status]?.className}
                  >
                    {statusConfig[detailData.status]?.label ??
                      detailData.status}
                  </Badge>
                </div>
                {detailData.attendees &&
                  detailData.attendees.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {detailData.attendees.length} attendee(s)
                      </span>
                    </div>
                  )}
              </div>

              {detailData.attendees &&
                detailData.attendees.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Attendees</h4>
                    <div className="flex flex-wrap gap-2">
                      {detailData.attendees.map((a) => (
                        <Badge key={a.id} variant="secondary">
                          {a.employees?.user
                            ? `${a.employees.user.firstName} ${a.employees.user.lastName}`
                            : a.employeeId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              <div>
                <button
                  className="flex items-center gap-1 text-sm font-medium mb-2 hover:text-foreground"
                  onClick={() => setMinutesExpanded(!minutesExpanded)}
                >
                  {minutesExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <FileText className="h-4 w-4" />
                  Minutes ({detailData.minutes?.length ?? 0})
                </button>
                {minutesExpanded && (
                  <div className="space-y-2">
                    {detailData.minutes &&
                    detailData.minutes.length > 0 ? (
                      detailData.minutes.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-md border p-3 text-sm"
                        >
                          <p>{m.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(
                              new Date(m.createdAt),
                              "MMM d, yyyy h:mm a"
                            )}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No minutes recorded
                      </p>
                    )}
                    {detailData.status === "SCHEDULED" && (
                      <div className="space-y-2">
                        {minutesOpen ? (
                          <div className="space-y-2">
                            <Textarea
                              value={minutesContent}
                              onChange={(e) =>
                                setMinutesContent(e.target.value)
                              }
                              placeholder="Enter meeting minutes..."
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={!minutesContent.trim()}
                              >
                                Save Minutes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setMinutesOpen(false);
                                  setMinutesContent("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMinutesOpen(true)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Minutes
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <button
                  className="flex items-center gap-1 text-sm font-medium mb-2 hover:text-foreground"
                  onClick={() =>
                    setActionItemsExpanded(!actionItemsExpanded)
                  }
                >
                  {actionItemsExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <ListChecks className="h-4 w-4" />
                  Action Items ({detailData.actionItems?.length ?? 0})
                </button>
                {actionItemsExpanded && (
                  <div className="space-y-2">
                    {detailData.actionItems &&
                    detailData.actionItems.length > 0 ? (
                      detailData.actionItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-md border p-3 text-sm flex items-start justify-between"
                        >
                          <div>
                            <p>{item.description}</p>
                            {item.dueDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Due:{" "}
                                {format(
                                  new Date(item.dueDate),
                                  "MMM d, yyyy"
                                )}
                              </p>
                            )}
                          </div>
                          {item.employees?.user && (
                            <Badge variant="secondary" className="shrink-0 ml-2">
                              {item.employees.user.firstName}{" "}
                              {item.employees.user.lastName}
                            </Badge>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No action items
                      </p>
                    )}
                    {detailData.status === "SCHEDULED" && (
                      <div className="space-y-2">
                        {actionItemOpen ? (
                          <div className="space-y-2">
                            <Input
                              value={actionDescription}
                              onChange={(e) =>
                                setActionDescription(e.target.value)
                              }
                              placeholder="Action item description"
                            />
                            <Input
                              type="date"
                              value={actionDueDate}
                              onChange={(e) =>
                                setActionDueDate(e.target.value)
                              }
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={!actionDescription.trim()}
                              >
                                Add Item
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setActionItemOpen(false);
                                  setActionDescription("");
                                  setActionDueDate("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActionItemOpen(true)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Action
                            Item
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => {
          if (!o) setConfirmDelete(null);
        }}
        title="Delete Meeting"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this meeting? This action cannot be
        undone.
      </ConfirmDialog>
    </div>
  );
}
