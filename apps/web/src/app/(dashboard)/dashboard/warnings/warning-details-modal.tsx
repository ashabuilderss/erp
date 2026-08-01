'use client';

import { useWarning, useAcknowledgeWarning } from '@/hooks/api/useWarnings';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { AlertOctagon, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';


interface Props {
  id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WarningDetailsModal({ id, open, onOpenChange }: Props) {
  const { data: warning, isLoading } = useWarning(id as string);
  const { mutateAsync: acknowledgeWarning, isPending: isAckPending } = useAcknowledgeWarning();

  const handleAcknowledge = async () => {
    if (!id) return;
    try {
      await acknowledgeWarning(id);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'LEVEL_1_VERBAL': return <Info className="w-8 h-8 text-yellow-500" />;
      case 'LEVEL_2_WRITTEN': return <AlertTriangle className="w-8 h-8 text-orange-500" />;
      case 'LEVEL_3_FINAL': return <AlertOctagon className="w-8 h-8 text-red-500" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        {isLoading || !warning ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <div className={`p-6 pb-4 border-b ${warning.acknowledgedAt ? 'bg-slate-50' : 'bg-red-50'}`}>
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-white p-2 rounded-full shadow-sm">
                  {getSeverityIcon(warning.severity)}
                </div>
                <div>
                  <DialogTitle className="text-2xl text-slate-900">
                    Official Disciplinary Notice
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-slate-600">
                    Category: <span className="font-semibold text-slate-900">{warning.category.replace(/_/g, ' ')}</span>
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Issued Date</p>
                    <p className="font-medium">{format(new Date(warning.createdAt), 'MMMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expiration Date</p>
                    <p className="font-medium text-slate-900">{format(new Date(warning.expiresAt), 'MMMM yyyy')}</p>
                  </div>
                  {warning.issuer && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Issued By</p>
                      <p className="font-medium">{warning.issuer.user?.firstName} {warning.issuer.user?.lastName}</p>
                    </div>
                  )}
                  {warning.isSystemGenerated && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Issued By</p>
                      <Badge variant="secondary" className="mt-1">System Automated Enforcement</Badge>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-2 border-b pb-1">Reason for Notice</h4>
                  <div className="bg-slate-50 p-4 rounded-md text-slate-700 text-sm whitespace-pre-wrap border shadow-inner">
                    {warning.reason}
                  </div>
                </div>
                
                {warning.warningHistories?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 border-b pb-1">Audit Trail</h4>
                    <div className="space-y-3">
                      {warning.warningHistories.map((history: any) => (
                        <div key={history.id} className="flex gap-3 text-sm">
                          <div className="mt-0.5">
                            {history.event === 'WARNING_ACKNOWLEDGED' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-slate-700">{history.comments}</p>
                            <p className="text-xs text-slate-400">{format(new Date(history.createdAt), 'MMM dd, h:mm a')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className={`p-4 border-t sm:justify-between items-center ${warning.acknowledgedAt ? 'bg-slate-50' : 'bg-red-50'}`}>
              <div className="text-sm">
                {warning.acknowledgedAt ? (
                  <p className="text-green-700 flex items-center font-medium">
                    <CheckCircle className="w-4 h-4 mr-2" /> Acknowledged on {format(new Date(warning.acknowledgedAt), 'MMM dd, yyyy')}
                  </p>
                ) : (
                  <p className="text-red-600 font-medium text-xs">
                    * Acknowledgment confirms receipt, not necessarily agreement.
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 mt-4 sm:mt-0">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                {!warning.acknowledgedAt && (
                  <Button variant="destructive" onClick={handleAcknowledge} disabled={isAckPending}>
                    {isAckPending ? 'Acknowledging...' : 'Acknowledge Receipt'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
