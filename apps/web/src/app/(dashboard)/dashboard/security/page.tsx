"use client";

import { useState } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFilePolicy, useLoginHistory, useSecurityEvents, useSessions } from "@/hooks/api";
import { useReplayEvent, useReplayHandler } from "@/hooks/api";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TableSkeleton, ListSkeleton } from "@/components/ui/skeleton-variants";
import { useToast } from "@/components/ui/toast";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

interface SecurityEventRow {
  id: string;
  type: string;
  severity: string;
  description: string | null;
  createdAt: string;
}

export default function SecurityPage() {
  const { data: loginHistory, isLoading: loginLoading } = useLoginHistory();
  const { data: securityEvents, isLoading: eventsLoading } = useSecurityEvents();
  const { data: sessions } = useSessions();
  const { data: filePolicy } = useFilePolicy();
  const { showToast } = useToast();

  const replayEvent = useReplayEvent();
  const replayHandler = useReplayHandler();

  const [replayEventItem, setReplayEventItem] = useState<SecurityEventRow | null>(null);
  const [replayHandlerItem, setReplayHandlerItem] = useState<SecurityEventRow | null>(null);
  const [handlerName, setHandlerName] = useState("");

  const handleReplayEvent = async () => {
    if (!replayEventItem) return;
    try {
      await replayEvent.mutateAsync(replayEventItem.id);
      showToast("Event replayed successfully", "success");
      setReplayEventItem(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Replay failed", "error");
    }
  };

  const handleReplayHandler = async () => {
    if (!replayHandlerItem || !handlerName) return;
    try {
      await replayHandler.mutateAsync({
        eventId: replayHandlerItem.id,
        handlerName,
      });
      showToast("Handler replayed successfully", "success");
      setReplayHandlerItem(null);
      setHandlerName("");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Replay failed", "error");
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground">
          Login activity, sessions, event audit, and upload policy.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Login attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loginHistory?.meta.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Security events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityEvents?.meta.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Upload limit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filePolicy ? `${Math.round(filePolicy.maxSizeBytes / 1024 / 1024)}MB` : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Login History</CardTitle>
        </CardHeader>
        <CardContent>
          {loginLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Reason</th>
                    <th className="pb-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(loginHistory?.data ?? []).slice(0, 10).map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2">{row.email}</td>
                      <td className="py-2">
                        <Badge variant="outline">{row.status}</Badge>
                      </td>
                      <td className="py-2">{row.reason ?? "-"}</td>
                      <td className="py-2">{formatDate(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Security Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventsLoading ? (
              <ListSkeleton rows={4} />
            ) : (securityEvents?.data ?? []).length > 0 ? (
              (securityEvents?.data ?? []).slice(0, 8).map((event) => (
                <div key={event.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{event.type}</span>
                    <Badge variant="outline">{event.severity}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.description ?? formatDate(event.createdAt)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplayEventItem(event)}
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Replay Event
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplayHandlerItem(event)}
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Replay Handler
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<ShieldAlert className="h-12 w-12" />}
                title="No security events yet"
                description="Security events will appear here as they occur"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Allowed Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {filePolicy?.allowedExtensions.join(", ") ?? "Loading upload policy..."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Replay Event Confirmation */}
      <ConfirmDialog
        open={!!replayEventItem}
        onOpenChange={(open) => !open && setReplayEventItem(null)}
        title="Replay Event"
        onConfirm={handleReplayEvent}
        loading={replayEvent.isPending}
      >
        Replay event <span className="font-mono">{replayEventItem?.id.slice(0, 8)}</span>?
        This will re-process the event through all handlers.
      </ConfirmDialog>

      {/* Replay Handler Dialog */}
      <Dialog
        open={!!replayHandlerItem}
        onOpenChange={(open) => {
          if (!open) {
            setReplayHandlerItem(null);
            setHandlerName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replay Handler</DialogTitle>
            <DialogDescription>
              Re-run a specific handler for event{" "}
              <span className="font-mono">{replayHandlerItem?.id.slice(0, 8)}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Handler Name</Label>
              <Input
                placeholder="e.g. DashboardMetricsProjector"
                value={handlerName}
                onChange={(e) => setHandlerName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReplayHandlerItem(null);
                setHandlerName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReplayHandler}
              disabled={replayHandler.isPending || !handlerName}
            >
              {replayHandler.isPending ? "Replaying..." : "Replay Handler"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
