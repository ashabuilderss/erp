"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { ClipboardCheck, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useTasks, useReviewProof } from "@/hooks/api";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  PENDING_VALIDATION: "In Review",
  COMPLETED: "Completed",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  IN_PROGRESS: "default",
  PENDING_VALIDATION: "outline",
  COMPLETED: "default",
  OVERDUE: "destructive",
  CANCELLED: "outline",
};

export default function TaskReviewsPage() {
  const [page, setPage] = useState(1);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useTasks({ status: "PENDING_VALIDATION", page, limit: 20 });
  const reviewMutation = useReviewProof();
  const { showToast } = useToast();

  const response = data as { items?: any[]; meta?: { total: number; totalPages: number; page: number } } | undefined;
  const items = response?.items ?? [];
  const totalPages = response?.meta?.totalPages ?? 1;
  const total = response?.meta?.total ?? 0;

  const handleReview = (proofId: string, action: "APPROVE" | "REJECT") => {
    reviewMutation.mutate(
      { proofId, action, payload: { comments: reviewNotes[proofId] || undefined } },
      {
        onSuccess: () => {
          showToast(`Proof ${action === "APPROVE" ? "approved" : "rejected"}`);
          setReviewNotes((prev) => { const next = { ...prev }; delete next[proofId]; return next; });
        },
        onError: (err) => showToast(getApiErrorMessage(err, "Failed to review"), "error"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Task Reviews</h2>
          <p className="text-sm text-muted-foreground">Review and validate completed task proofs</p>
        </div>
        <div className="text-sm text-muted-foreground">{total} pending review</div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-muted/50 rounded animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ClipboardCheck className="h-12 w-12 mb-3" />
          <p className="font-medium">No pending reviews</p>
          <p className="text-sm">All submitted task proofs have been reviewed</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((task: any) => {
            const pendingProof = task.taskProofs?.find((p: any) => p.status === "PENDING");
            return (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{task.title}</span>
                        <Badge variant={STATUS_VARIANTS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
                        <Badge variant="outline" className="text-xs">{task.priority}</Badge>
                      </div>
                      {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Assignee: {task.employeesTasksAssigneeIdToemployees?.name || "N/A"}</span>
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}</span>
                      </div>
                      {pendingProof && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Proof submitted</span>
                            {pendingProof.comments && <span className="text-muted-foreground">— {pendingProof.comments}</span>}
                          </div>
                          {pendingProof.submissionUrl && (
                            <a href={pendingProof.submissionUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                              <ExternalLink className="h-3 w-3" />View attachment
                            </a>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <Input
                              placeholder="Review notes (optional)"
                              className="flex-1 text-sm h-8"
                              value={reviewNotes[pendingProof.id] || ""}
                              onChange={(e) => setReviewNotes((prev) => ({ ...prev, [pendingProof.id]: e.target.value }))}
                            />
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleReview(pendingProof.id, "APPROVE")} disabled={reviewMutation.isPending}>
                              <CheckCircle className="h-4 w-4 mr-1" />Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => handleReview(pendingProof.id, "REJECT")} disabled={reviewMutation.isPending}>
                              <XCircle className="h-4 w-4 mr-1" />Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
