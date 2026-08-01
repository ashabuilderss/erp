import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useWarnings = (query?: Record<string, any>) => {
  return useQuery({
    queryKey: ['warnings', query],
    queryFn: () => api.get<any>('/warnings', query),
  });
};

export const useMyWarnings = (query?: Record<string, any>) => {
  return useQuery({
    queryKey: ['warnings', 'me', query],
    queryFn: () => api.get<any>('/warnings/me', query),
  });
};

export const useWarning = (id: string) => {
  return useQuery({
    queryKey: ['warnings', id],
    queryFn: () => api.get<any>(`/warnings/${id}`),
    enabled: !!id,
  });
};

export const useIssueWarning = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => api.post<any>('/warnings', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warnings'] });
    },
  });
};

export const useAcknowledgeWarning = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<any>(`/warnings/${id}/acknowledge`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['warnings'] });
      queryClient.invalidateQueries({ queryKey: ['warnings', id] });
    },
  });
};
