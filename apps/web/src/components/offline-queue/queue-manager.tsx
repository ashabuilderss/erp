"use client";

import { useState } from "react";
import { useOfflineDraft } from "@/hooks/useOfflineDraft";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  TrashIcon,
  Clock,
  AlertTriangle,
  Eye,
  RotateCcw,
  Database,
  CloudOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileQuestion,
} from "lucide-react";
import { format } from "date-fns";
import type { DraftStatus, OfflineDraft } from "@/lib/offline-queue/types";

const statusConfig: Record<
  DraftStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  syncing: {
    label: "Syncing",
    className:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400",
    icon: <RefreshCw className="h-3.5 w-3.5 animate-spin" />,
  },
  synced: {
    label: "Synced",
    className:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  failed: {
    label: "Failed",
    className:
      "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  conflict: {
    label: "Conflict",
    className:
      "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  needs_review: {
    label: "Needs Review",
    className:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400",
    icon: <FileQuestion className="h-3.5 w-3.5" />,
  },
};

type TabValue = "all" | "pending" | "failed" | "conflicts";

function filterDrafts(drafts: OfflineDraft[], tab: TabValue): OfflineDraft[] {
  switch (tab) {
    case "pending":
      return drafts.filter((d) => d.status === "pending" || d.status === "syncing");
    case "failed":
      return drafts.filter((d) => d.status === "failed");
    case "conflicts":
      return drafts.filter(
        (d) => d.status === "conflict" || d.status === "needs_review"
      );
    default:
      return drafts;
  }
}

export function QueueManager() {
  const {
    isOnline,
    queueStats,
    drafts,
    retryDraft,
    removeDraft,
    retryAll,
    clearSynced,
    isOverWarningThreshold,
    isAtMaxCapacity,
  } = useOfflineDraft();

  const [tab, setTab] = useState<TabValue>("all");
  const [viewDataDraft, setViewDataDraft] = useState<OfflineDraft | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredDrafts = filterDrafts(drafts, tab);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offline Queue"
        description="Manage drafts saved offline and sync them when back online."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-green-700 dark:text-green-400 font-medium">
                    Online
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-red-700 dark:text-red-400 font-medium">
                    Offline
                  </span>
                </>
              )}
            </div>
            {queueStats.failed > 0 && (
              <Button variant="outline" size="sm" onClick={retryAll}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Retry All ({queueStats.failed})
              </Button>
            )}
            {queueStats.synced > 0 && (
              <Button variant="outline" size="sm" onClick={() => setConfirmClear(true)}>
                <TrashIcon className="h-3.5 w-3.5 mr-1" />
                Clear Synced
              </Button>
            )}
          </div>
        }
      />

      {/* Warning banners */}
      {isOverWarningThreshold && !isAtMaxCapacity && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            You have {drafts.length} drafts saved. Consider clearing synced drafts to stay under the
            limit of 50.
          </span>
        </div>
      )}
      {isAtMaxCapacity && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Maximum capacity reached ({drafts.length}/50). Please clear synced drafts or remove
            unnecessary ones to add new drafts.
          </span>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={queueStats.total} icon={<Database className="h-4 w-4" />} />
        <StatCard
          label="Pending"
          value={queueStats.pending}
          icon={<Clock className="h-4 w-4" />}
          className="text-yellow-600"
        />
        <StatCard
          label="Synced"
          value={queueStats.synced}
          icon={<CheckCircle2 className="h-4 w-4" />}
          className="text-green-600"
        />
        <StatCard
          label="Failed"
          value={queueStats.failed}
          icon={<XCircle className="h-4 w-4" />}
          className="text-red-600"
        />
        <StatCard
          label="Conflicts"
          value={queueStats.conflict}
          icon={<AlertTriangle className="h-4 w-4" />}
          className="text-orange-600"
        />
        <StatCard
          label="Needs Review"
          value={queueStats.needsReview}
          icon={<FileQuestion className="h-4 w-4" />}
          className="text-purple-600"
        />
      </div>

      {/* Drafts table */}
      <Card>
        <CardHeader>
          <CardTitle>Drafts</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={tab} onValueChange={(v) => setTab(v as TabValue)}>
            <TabsList>
              <TabsTrigger value="all">All ({queueStats.total})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({queueStats.pending})
              </TabsTrigger>
              <TabsTrigger value="failed">
                Failed ({queueStats.failed})
              </TabsTrigger>
              <TabsTrigger value="conflicts">
                Conflicts ({queueStats.conflict + queueStats.needsReview})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={tab}>
              {filteredDrafts.length === 0 ? (
                <EmptyState
                  icon={<CloudOff className="h-8 w-8" />}
                  title="No drafts found"
                  description={
                    tab === "all"
                      ? "You have no offline drafts. Form submissions will appear here when saved offline."
                      : `No drafts with status "${tab}".`
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Entity Type</th>
                        <th className="pb-3 pr-4 font-medium">Status</th>
                        <th className="pb-3 pr-4 font-medium">Created</th>
                        <th className="pb-3 pr-4 font-medium">Retries</th>
                        <th className="pb-3 pr-4 font-medium">Error</th>
                        <th className="pb-3 pr-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrafts.map((draft) => {
                        const cfg = statusConfig[draft.status] || statusConfig.pending;
                        return (
                          <tr key={draft.id} className="border-b last:border-b-0 hover:bg-muted/50">
                            <td className="py-3 pr-4">
                              <span className="font-medium capitalize">
                                {draft.entityType.replace(/-/g, " ")}
                              </span>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge
                                variant="outline"
                                className={`inline-flex items-center gap-1 ${cfg.className}`}
                              >
                                {cfg.icon}
                                {cfg.label}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                              {format(draft.createdAt, "MMM d, yyyy")}
                              <br />
                              <span className="text-xs">
                                {format(draft.createdAt, "h:mm a")}
                              </span>
                            </td>
                            <td className="py-3 pr-4 tabular-nums">
                              {draft.retryCount > 0 ? (
                                <span
                                  className={
                                    draft.retryCount >= 5
                                      ? "text-red-600 font-medium"
                                      : "text-muted-foreground"
                                  }
                                >
                                  {draft.retryCount}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-3 pr-4 max-w-[200px]">
                              {draft.error ? (
                                <span className="text-xs text-red-500 truncate block" title={draft.error}>
                                  {draft.error}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => setViewDataDraft(draft)}
                                  title="View Data"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                {(draft.status === "failed" ||
                                  draft.status === "conflict" ||
                                  draft.status === "needs_review") && (
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => retryDraft(draft.id)}
                                    title="Retry"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => removeDraft(draft.id)}
                                  title="Remove"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Data Dialog */}
      <Dialog
        open={!!viewDataDraft}
        onOpenChange={(open) => {
          if (!open) setViewDataDraft(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Draft Data —{" "}
              <span className="capitalize">
                {viewDataDraft?.entityType.replace(/-/g, " ")}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {viewDataDraft && (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    {viewDataDraft.status}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Schema Version:</span>{" "}
                    {viewDataDraft.schemaVersion}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>{" "}
                    {format(viewDataDraft.createdAt, "MMM d, yyyy h:mm a")}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated:</span>{" "}
                    {format(viewDataDraft.updatedAt, "MMM d, yyyy h:mm a")}
                  </div>
                  {viewDataDraft.syncedAt && (
                    <div>
                      <span className="text-muted-foreground">Synced:</span>{" "}
                      {format(viewDataDraft.syncedAt, "MMM d, yyyy h:mm a")}
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Retries:</span>{" "}
                    {viewDataDraft.retryCount}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="mb-1 text-sm font-medium">Form Data</h4>
                  <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-3 text-xs font-mono">
                    {JSON.stringify(viewDataDraft.formData, null, 2)}
                  </pre>
                </div>
                {viewDataDraft.serverVersion && (
                  <div>
                    <h4 className="mb-1 text-sm font-medium">Server Version (Conflict)</h4>
                    <pre className="max-h-48 overflow-auto rounded-lg bg-red-50 p-3 text-xs font-mono dark:bg-red-900/20">
                      {JSON.stringify(viewDataDraft.serverVersion, null, 2)}
                    </pre>
                  </div>
                )}
                {viewDataDraft.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    <strong>Error:</strong> {viewDataDraft.error}
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDataDraft(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Clear Dialog */}
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Synced Drafts</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove all {queueStats.synced} synced drafts? This action
            cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearSynced();
                setConfirmClear(false);
              }}
            >
              Clear {queueStats.synced} Drafts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 py-4">
        <div className={`${className ?? "text-muted-foreground"}`}>{icon}</div>
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}
