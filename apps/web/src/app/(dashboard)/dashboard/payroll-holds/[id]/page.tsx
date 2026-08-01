'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePayrollHold, useRequestHoldRelease } from '@/hooks/api/usePayrollHolds';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Lock, Unlock, AlertOctagon, CheckCircle, ArrowLeft, History } from 'lucide-react';

export default function PayrollHoldDetailPage() {
  const params = useParams();
  const router = useRouter();
  const holdId = params.id as string;
  const { data: hold, isLoading } = usePayrollHold(holdId);
  const { mutateAsync: requestRelease, isPending } = useRequestHoldRelease();
  const [justification, setJustification] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!hold) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Hold Not Found</h2>
        <Button variant="link" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const handleRequestRelease = async () => {
    if (!justification.trim()) return;
    try {
      await requestRelease({ id: holdId, payload: { justification } });
      setJustification('');
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Lock className="w-10 h-10 text-red-500" />;
      case 'RELEASE_REQUESTED': return <AlertOctagon className="w-10 h-10 text-orange-500" />;
      case 'RELEASED': return <Unlock className="w-10 h-10 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Button variant="ghost" className="mb-4 -ml-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Holds
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          {getStatusIcon(hold.status)}
          Payroll Hold File
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Case Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Employee</p>
                <p className="font-semibold text-lg">{hold.employee?.user?.firstName} {hold.employee?.user?.lastName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={hold.status === 'RELEASED' ? 'outline' : 'destructive'} className="mt-1">
                  {hold.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Trigger Date</p>
                <p className="font-medium">{format(new Date(hold.createdAt), 'MMMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Initiated By</p>
                <p className="font-medium">
                  {hold.isSystemGenerated ? 'System Automation' : (
                    hold.issuer ? `${hold.issuer.user?.firstName} ${hold.issuer.user?.lastName}` : 'Unknown'
                  )}
                </p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-1">Official Reason for Hold</p>
              <div className="p-4 bg-slate-50 border rounded-md text-slate-700 whitespace-pre-wrap">
                {hold.reason}
              </div>
            </div>

            {hold.status === 'ACTIVE' && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-slate-900 mb-2">Request Release</h4>
                <p className="text-sm text-slate-500 mb-3">
                  If the underlying issue has been resolved (e.g. overdue tasks completed, warnings resolved), you can submit a release request. This will route to HR and the Owner for final approval.
                </p>
                <Textarea 
                  placeholder="Provide detailed justification for releasing this payroll hold..." 
                  className="mb-3"
                  rows={4}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                />
                <Button 
                  onClick={handleRequestRelease} 
                  disabled={!justification.trim() || isPending}
                >
                  {isPending ? 'Submitting...' : 'Submit Release Request'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {hold.holdHistories?.map((history: any, index: number) => (
                <div key={history.id} className="relative flex gap-4 text-sm">
                  {index !== hold.holdHistories.length - 1 && (
                    <div className="absolute top-6 left-2.5 bottom-[-24px] w-px bg-slate-200"></div>
                  )}
                  <div className="relative z-10 bg-white mt-1">
                    {history.event === 'RELEASED' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : history.event === 'RELEASE_REQUESTED' ? (
                      <AlertOctagon className="w-5 h-5 text-orange-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{history.event.replace(/_/g, ' ')}</p>
                    <p className="text-slate-600 mt-1">{history.comments}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-400 font-medium">
                        {format(new Date(history.createdAt), 'MMM dd, yyyy h:mm a')}
                      </p>
                      {history.actor && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {history.actor.user?.firstName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {(!hold.holdHistories || hold.holdHistories.length === 0) && (
                <p className="text-sm text-slate-500">No history available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
