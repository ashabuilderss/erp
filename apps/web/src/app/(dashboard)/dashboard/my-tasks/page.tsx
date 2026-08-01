'use client';

import { useState } from 'react';
import { useMyTasks } from '@/hooks/api/useTasks';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CreateTaskDialog from './create-task-dialog';

export default function MyTasksPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyTasks({ page, limit: 10 });
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: currentUser } = useCurrentUser();
  const canCreateTask = currentUser?.user?.role && ['OWNER', 'ADMIN', 'MANAGER', 'TEAM_LEAD'].includes(currentUser.user.role);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'IN_PROGRESS': return <Badge variant="default" className="bg-blue-500"><Clock className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case 'PENDING_VALIDATION': return <Badge variant="outline" className="text-orange-500 border-orange-500"><AlertCircle className="w-3 h-3 mr-1" /> In Review</Badge>;
      case 'COMPLETED': return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'OVERDUE': return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Overdue</Badge>;
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">Manage your assigned tasks and workflows.</p>
        </div>
        {canCreateTask && <Button onClick={() => setIsCreateOpen(true)}>Create Task</Button>}
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
              No tasks assigned to you right now.
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
                    <span>Category: {task.category.replace('_', ' ')}</span>
                    <span>By: {task.creator?.firstName} {task.creator?.lastName}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )
        )}
      </div>

      <CreateTaskDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
