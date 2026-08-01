'use client';

import { useState } from 'react';
import { useCreateTask } from '@/hooks/api/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployees } from '@/hooks/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateTaskDialog({ open, onOpenChange }: Props) {
  const { data: employeesData } = useEmployees();
  const employees = employeesData?.data || [];
  
  const { mutateAsync: createTask, isPending } = useCreateTask();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'NORMAL',
    category: 'ADMIN_ACTIVITY',
    assigneeId: '',
    dueDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask({
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
      });
      onOpenChange(false);
      // Reset form
      setFormData({
        title: '', description: '', priority: 'NORMAL', category: 'ADMIN_ACTIVITY', assigneeId: '', dueDate: ''
      });
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input 
              required 
              value={formData.title}
              onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea 
              required 
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assignee</label>
              <Select required value={formData.assigneeId} onValueChange={(v) => setFormData(f => ({ ...f, assigneeId: v || '' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : emp.employeeCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input 
                type="datetime-local" 
                required
                value={formData.dueDate}
                onChange={(e) => setFormData(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={formData.priority} onValueChange={(v) => setFormData(f => ({ ...f, priority: v || 'NORMAL' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="IMPORTANT">Important</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={formData.category} onValueChange={(v) => setFormData(f => ({ ...f, category: v || 'ADMIN_ACTIVITY' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SITE_WORK">Site Work</SelectItem>
                  <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                  <SelectItem value="CLIENT_FOLLOWUP">Client Follow Up</SelectItem>
                  <SelectItem value="PURCHASE">Purchase</SelectItem>
                  <SelectItem value="PAYMENT_COLLECTION">Payment Collection</SelectItem>
                  <SelectItem value="HR_ACTIVITY">HR Activity</SelectItem>
                  <SelectItem value="ADMIN_ACTIVITY">Admin Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
