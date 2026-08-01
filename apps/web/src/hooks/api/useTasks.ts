import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useTasks = (query?: Record<string, any>) => {
  return useQuery({
    queryKey: ['tasks', query],
    queryFn: () => api.get<any>('/tasks', query),
  });
};

export const useMyTasks = (query?: Record<string, any>) => {
  return useQuery({
    queryKey: ['tasks', 'me', query],
    queryFn: () => api.get<any>('/tasks/me', query),
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get<any>(`/tasks/${id}`),
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => api.post<any>('/tasks', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useAcknowledgeTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<any>(`/tasks/${id}/acknowledge`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
    },
  });
};

export const useSubmitTaskProof = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.post<any>(`/tasks/${id}/proof`, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
    },
  });
};

export const useAcknowledgeCompletion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proofId, payload }: { proofId: string; payload?: any }) =>
      api.post<any>(`/tasks/proofs/${proofId}/acknowledge`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useApproveCompletion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proofId, payload }: { proofId: string; payload?: any }) =>
      api.post<any>(`/tasks/proofs/${proofId}/approve`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useRejectCompletion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proofId, payload }: { proofId: string; payload?: any }) =>
      api.post<any>(`/tasks/proofs/${proofId}/reject`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useReassignTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { assigneeId: string; reason?: string } }) =>
      api.post<any>(`/tasks/${id}/reassign`, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
    },
  });
};

export const useCancelTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<any>(`/tasks/${id}/cancel`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
    },
  });
};

export const useRequestExtension = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { newDueDate: string; reason: string } }) =>
      api.post<any>(`/tasks/${id}/extensions`, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
    },
  });
};
