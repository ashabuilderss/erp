'use client';

import { usePayrollHolds } from '@/hooks/api/usePayrollHolds';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Lock, Unlock, AlertOctagon, ShieldAlert, FileText, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PayrollHoldsPage() {
  const { data: rawData, isLoading } = usePayrollHolds();
  const holds = Array.isArray(rawData) ? rawData : [];
  const { data: currentUser } = useCurrentUser();
  const router = useRouter();

  const isOwner = currentUser?.user?.role === 'OWNER';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="destructive" className="animate-pulse"><Lock className="w-3 h-3 mr-1" /> Active Hold</Badge>;
      case 'RELEASE_REQUESTED': return <Badge variant="secondary" className="bg-orange-100 text-orange-800"><AlertOctagon className="w-3 h-3 mr-1" /> Release Requested</Badge>;
      case 'RELEASED': return <Badge variant="outline" className="text-green-600 bg-green-50"><Unlock className="w-3 h-3 mr-1" /> Released</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Lock className="h-8 w-8 text-red-600" />
            Payroll Governance
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track automated and manual payroll holds.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Active Holds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {holds.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Release</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {holds.filter((h: any) => h.status === 'RELEASE_REQUESTED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hold Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Triggered By</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-24 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                    </tr>
                  ))
                ) : holds.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <ShieldAlert className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      No payroll holds found.
                    </td>
                  </tr>
                ) : (
                  holds.map((hold: any) => (
                    <tr key={hold.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {hold.employee?.user?.firstName} {hold.employee?.user?.lastName}
                      </td>
                      <td className="px-4 py-3 text-slate-600 line-clamp-1 max-w-[300px]" title={hold.reason}>
                        {hold.reason}
                      </td>
                      <td className="px-4 py-3">
                        {hold.isSystemGenerated ? (
                          <Badge variant="outline" className="text-slate-500">System Automated</Badge>
                        ) : hold.issuer ? (
                          <span>{hold.issuer.user?.firstName} {hold.issuer.user?.lastName}</span>
                        ) : (
                          'Unknown'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(hold.status)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {format(new Date(hold.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => router.push(`/dashboard/payroll-holds/${hold.id}`)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                        >
                          <ArrowRight className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
