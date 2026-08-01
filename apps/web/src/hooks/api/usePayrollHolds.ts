import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const usePayrollHolds = (query?: Record<string, any>) => {
  return useQuery({
    queryKey: ['payroll-holds', query],
    queryFn: () => api.get<any>('/payroll-holds', query),
  });
};

export const usePayrollHold = (id: string) => {
  return useQuery({
    queryKey: ['payroll-holds', id],
    queryFn: () => api.get<any>(`/payroll-holds/${id}`),
    enabled: !!id,
  });
};

export const useCreateEmergencyHold = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => api.post<any>('/payroll-holds/emergency', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-holds'] });
    },
  });
};

export const useRequestHoldRelease = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: any }) => api.post<any>(`/payroll-holds/${id}/release-request`, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-holds'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-holds', id] });
    },
  });
};
