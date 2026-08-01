'use client';

import { useState } from 'react';
import { useTasks } from '@/hooks/api/useTasks';
import { useCreateTask } from '@/hooks/api/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { CheckCircle2, Clock, AlertCircle, Plus, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CreateTaskDialog from '../my-tasks/create-task-dialog';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PENDING_VALIDATION', label: 'In Review' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'IMPORTANT', label: 'Important' },
  { value: 'NORMAL', label: 'Normal' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'SITE_WORK', label: 'Site Work' },
  { value: 'DOCUMENTATION', label: 'Documentation' },
  { value: 'CLIENT_FOLLOWUP', label: 'Client Follow-up' },
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'PAYMENT_COLLECTION', label: 'Payment Collection' },
  { value: 'HR_ACTIVITY', label: 'HR Activity' },
  { value: 'ADMIN_ACTIVITY', label: 'Admin Activity' },
];

export default function TasksPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [category, setCategory] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const query: Record<string, any> = { page, limit: 12 };
  if (status !== 'all') query.status = status;
  if (priority !== 'all') query.priority = priority;
  if (category !== 'all') query.category = category;

  const { data, isLoading } = useTasks(query);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'IN_PROGRESS': return <Badge variant="default" className="bg-blue-500"><Clock className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case 'PENDING_VALIDATION': return <Badge variant="outline" className="text-orange-500 border-orange-500"><AlertCircle className="w-3 h-3 mr-1" /> In Review</Badge>;
      case 'COMPLETED': return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'OVERDUE': return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Overdue</Badge>;
      case 'CANCELLED': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return <Badge variant="destructive">Critical</Badge>;
      case 'IMPORTANT': return <Badge variant="default" className="bg-orange-500">Important</Badge>;
      case 'NORMAL': return <Badge variant="secondary">Normal</Badge>;
      default: return <Badge>{priority}</Badge>;
    }
  };

  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Tasks</h1>
          <p className="text-muted-foreground">Manage and track all team tasks across the organization.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Task
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v ?? 'all'); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={(v) => { setPriority(v ?? 'all'); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={(v) => { setCategory(v ?? 'all'); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
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
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No tasks found matching the current filters.
            </div>
          ) : (
            data?.items?.map((task: any) => (
              <Card
                key={task.id}
                className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-primary"
                onClick={() => router.push(`/dashboard/my-tasks/${task.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.priority)}
                  </div>
                  <CardTitle className="text-lg line-clamp-1">{task.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Due: {format(new Date(task.dueDate), 'MMM dd, yyyy h:mm a')}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-2 text-muted-foreground">
                    {task.description}
                  </p>
                  <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground">
                    <span>Category: {task.category?.replace('_', ' ')}</span>
                    <span>Assigned to: {task.assignee?.firstName} {task.assignee?.lastName}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <CreateTaskDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
