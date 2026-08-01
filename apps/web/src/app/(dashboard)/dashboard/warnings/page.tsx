'use client';

import { useState } from 'react';
import { useMyWarnings } from '@/hooks/api/useWarnings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { AlertOctagon, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import WarningDetailsModal from './warning-details-modal';

export default function WarningsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyWarnings({ page, limit: 10 });
  const [selectedWarningId, setSelectedWarningId] = useState<string | null>(null);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'LEVEL_1_VERBAL': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100"><Info className="w-3 h-3 mr-1" /> Verbal (Level 1)</Badge>;
      case 'LEVEL_2_WRITTEN': return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100"><AlertTriangle className="w-3 h-3 mr-1" /> Written (Level 2)</Badge>;
      case 'LEVEL_3_FINAL': return <Badge variant="destructive"><AlertOctagon className="w-3 h-3 mr-1" /> Final (Level 3)</Badge>;
      default: return <Badge>{severity}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-600 flex items-center gap-2">
            <ShieldAlert className="h-8 w-8" />
            Disciplinary Actions
          </h1>
          <p className="text-muted-foreground mt-1">Review and acknowledge your official workplace warnings.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="hover:bg-muted/50 transition-colors">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          data?.items?.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-muted/20 border-2 border-dashed rounded-lg">
              <ShieldAlert className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-700">No Disciplinary Actions</h3>
              <p className="text-muted-foreground text-sm mt-1">You have no active or historical warnings on file.</p>
            </div>
          ) : (
            data?.items?.map((warning: any) => {
              const isAcknowledged = !!warning.acknowledgedAt;
              const isExpired = new Date(warning.expiresAt) < new Date();
              
              return (
                <Card 
                  key={warning.id} 
                  className={`hover:shadow-md transition-all cursor-pointer border-l-4 ${isAcknowledged ? 'border-l-slate-300 opacity-75' : 'border-l-red-500'}`}
                  onClick={() => setSelectedWarningId(warning.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2">
                      {getSeverityBadge(warning.severity)}
                      {isExpired ? (
                        <Badge variant="outline" className="text-slate-400">Expired</Badge>
                      ) : !isAcknowledged ? (
                        <Badge variant="destructive" className="animate-pulse">Action Required</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Acknowledged</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{warning.category.replace(/_/g, ' ')}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Issued: {format(new Date(warning.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-2 text-muted-foreground">
                      {warning.reason}
                    </p>
                    <div className="mt-4 flex justify-between items-center text-xs font-medium text-slate-500">
                      <span>Expires: {format(new Date(warning.expiresAt), 'MMM yyyy')}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )
        )}
      </div>

      <WarningDetailsModal 
        id={selectedWarningId} 
        open={!!selectedWarningId} 
        onOpenChange={(open) => !open && setSelectedWarningId(null)} 
      />
    </div>
  );
}
