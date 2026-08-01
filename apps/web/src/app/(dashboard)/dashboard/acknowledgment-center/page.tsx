"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { CheckCheck, Bell, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useNotifications, useUnacknowledgedCount, useAcknowledge } from "@/hooks/api";

export default function AcknowledgmentCenterPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const limit = 20;

  const queryFilter = filter === "pending" ? { acknowledged: "false" } : undefined;
  const { data, isLoading } = useNotifications(page, limit, queryFilter);
  const { data: pendingCount } = useUnacknowledgedCount();
  const acknowledge = useAcknowledge();
  const { showToast } = useToast();

  const response = data as { data?: any[]; meta?: { total: number; totalPages: number; page: number } } | undefined;
  const items = response?.data ?? [];
  const totalPages = response?.meta?.totalPages ?? 1;
  const total = response?.meta?.total ?? 0;

  const handleAcknowledge = (id: string) => {
    acknowledge.mutate(id, {
      onSuccess: () => showToast("Notification acknowledged"),
      onError: () => showToast("Failed to acknowledge", "error"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Acknowledgment Center</h2>
          <p className="text-sm text-muted-foreground">Review and acknowledge notifications</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span>{pendingCount ?? 0} pending</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={(v) => { if (v) setFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Notifications</SelectItem>
            <SelectItem value="pending">Pending Acknowledgment</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{total} total</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-muted/50 rounded animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <CheckCheck className="h-12 w-12 mb-3" />
          <p className="font-medium">All caught up</p>
          <p className="text-sm">No notifications pending acknowledgment</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map((n: any) => (
            <Card key={n.id} className={!n.acknowledgedAt ? "border-l-4 border-l-blue-500" : ""}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{n.title}</span>
                    <Badge variant="outline" className="text-xs">{n.type}</Badge>
                    {n.acknowledgedAt ? (
                      <Badge variant="secondary" className="text-xs">Acknowledged</Badge>
                    ) : (
                      <Badge variant="default" className="text-xs bg-blue-500">Pending</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                    {n.acknowledgedAt && <span>Acknowledged: {new Date(n.acknowledgedAt).toLocaleString()}</span>}
                  </div>
                </div>
                {!n.acknowledgedAt && (
                  <Button size="sm" className="ml-4" onClick={() => handleAcknowledge(n.id)} disabled={acknowledge.isPending}>
                    <CheckCheck className="h-4 w-4 mr-1" />Acknowledge
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
