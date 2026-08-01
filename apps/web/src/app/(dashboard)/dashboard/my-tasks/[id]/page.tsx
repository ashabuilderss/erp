'use client';

import { use, useState } from 'react';
import { useTask, useAcknowledgeTask, useSubmitTaskProof, useAcknowledgeCompletion, useApproveCompletion, useRejectCompletion } from '@/hooks/api/useTasks';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { CheckCircle2, Clock, AlertCircle, ArrowLeft, Upload, History, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const { data: task, isLoading } = useTask(id);
  const { mutateAsync: acknowledgeTask, isPending: isAckPending } = useAcknowledgeTask();
  const { mutateAsync: submitProof, isPending: isSubmitPending } = useSubmitTaskProof();
  const { mutateAsync: acknowledgeCompletion, isPending: isAckCompletionPending } = useAcknowledgeCompletion();
  const { mutateAsync: approveCompletion, isPending: isApprovePending } = useApproveCompletion();
  const { mutateAsync: rejectCompletion, isPending: isRejectPending } = useRejectCompletion();
  const { data: currentUser } = useCurrentUser();

  const [proofNotes, setProofNotes] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectingProofId, setRejectingProofId] = useState<string | null>(null);

  const role = currentUser?.user?.role;
  const canAcknowledge = !!role && ['OWNER', 'ADMIN', 'MANAGER', 'TEAM_LEAD', 'HR_MANAGER'].includes(role);
  const canApprove = !!role && ['OWNER', 'ADMIN'].includes(role);
  const approval = task?.taskCompletionApprovals?.[0];
  const isAcknowledged = approval?.status === 'MANAGER_ACKNOWLEDGED';

  const handleAcknowledge = async () => {
    try {
      await acknowledgeTask(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitProof = async () => {
    try {
      await submitProof({
        id,
        payload: {
          submissionUrl: proofUrl || 'https://example.com/placeholder.jpg',
          comments: proofNotes
        }
      });
      setProofNotes('');
      setProofUrl('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcknowledgeCompletion = async (proofId: string) => {
    try {
      await acknowledgeCompletion({ proofId, payload: {} });
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveCompletion = async (proofId: string) => {
    try {
      await approveCompletion({ proofId, payload: {} });
      setRejectingProofId(null);
      setReviewNotes('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectCompletion = async (proofId: string) => {
    try {
      await rejectCompletion({ proofId, payload: { comments: reviewNotes } });
      setReviewNotes('');
      setRejectingProofId(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="space-y-4 p-8"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!task) {
    return <div className="p-8 text-center">Task not found</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            Created by {task.creator?.firstName} {task.creator?.lastName} on {format(new Date(task.createdAt), 'MMM dd, yyyy')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none text-muted-foreground">
                {task.description}
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="mt-1 font-semibold">{task.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Priority</p>
                  <p className="mt-1 font-semibold">{task.priority}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className="mt-1 font-semibold text-red-500">
                    {format(new Date(task.dueDate), 'MMM dd, yyyy h:mm a')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="mt-1 font-semibold">{task.category}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {task.status === 'PENDING' && (
                <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between border border-blue-200">
                  <div>
                    <h4 className="font-medium">Acknowledge Task</h4>
                    <p className="text-sm text-muted-foreground">Confirm that you have seen this task and are working on it.</p>
                  </div>
                  <Button onClick={handleAcknowledge} disabled={isAckPending}>
                    {isAckPending ? 'Acknowledging...' : 'Acknowledge Now'}
                  </Button>
                </div>
              )}

              {(task.status === 'IN_PROGRESS' || task.status === 'OVERDUE') && (
                <div className="space-y-4 border rounded-lg p-4">
                  <div>
                    <h4 className="font-medium">Submit Proof of Completion</h4>
                    <p className="text-sm text-muted-foreground">Upload evidence and add notes for validation.</p>
                  </div>
                  <div className="space-y-3">
                    <Input 
                      placeholder="Evidence URL (e.g. image link, document link)" 
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                    />
                    <Textarea 
                      placeholder="Add completion notes..." 
                      value={proofNotes}
                      onChange={(e) => setProofNotes(e.target.value)}
                      rows={3}
                    />
                    <Button className="w-full" onClick={handleSubmitProof} disabled={isSubmitPending || !proofNotes}>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit for Review
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {task.taskProofs?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Submitted Proofs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.taskProofs.map((proof: any) => (
                  <div key={proof.id} className="border p-4 rounded-lg bg-muted/20">
                    <div className="flex justify-between mb-2">
                      <Badge variant={proof.status === 'APPROVED' ? 'default' : proof.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                        {proof.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(proof.submittedAt || proof.createdAt), 'MMM dd, h:mm a')}
                      </span>
                    </div>
                    {proof.submissionUrl && (
                      <a href={proof.submissionUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
                        View Evidence Attachment
                      </a>
                    )}
                    {proof.comments && (
                      <p className="text-sm mt-2 text-muted-foreground">{proof.comments}</p>
                    )}
                    {proof.reviewerComments && (
                      <div className="mt-3 pt-3 border-t text-sm text-muted-foreground bg-orange-50 p-2 rounded">
                        <strong>Reviewer Notes:</strong> {proof.reviewerComments}
                      </div>
                    )}
                    {proof.status === 'PENDING' && task.status === 'PENDING_VALIDATION' && (
                      <div className="mt-4 pt-3 border-t space-y-3">
                        {rejectingProofId === proof.id ? (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Reason for rejection..."
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectCompletion(proof.id)}
                                disabled={isRejectPending || !reviewNotes}
                              >
                                <ThumbsDown className="w-4 h-4 mr-1" /> Confirm Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setRejectingProofId(null); setReviewNotes(''); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {canAcknowledge && !isAcknowledged && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleAcknowledgeCompletion(proof.id)}
                                disabled={isAckCompletionPending}
                              >
                                <ThumbsUp className="w-4 h-4 mr-1" /> Acknowledge Completion
                              </Button>
                            )}
                            {canApprove && isAcknowledged && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveCompletion(proof.id)}
                                disabled={isApprovePending}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Approve Completion
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRejectingProofId(proof.id)}
                              disabled={isRejectPending}
                            >
                              <ThumbsDown className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Task History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {task.taskHistories?.map((history: any, index: number) => (
                  <div key={history.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-slate-300 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border bg-card shadow-sm">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-900 text-xs">{history.event.replace(/_/g, ' ')}</div>
                        <time className="font-caveat font-medium text-indigo-500 text-xs">
                          {format(new Date(history.createdAt), 'MMM dd')}
                        </time>
                      </div>
                      <div className="text-slate-500 text-xs">{history.comments}</div>
                      <div className="text-slate-400 text-[10px] mt-1 text-right">
                        by {history.actor?.firstName} {history.actor?.lastName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
