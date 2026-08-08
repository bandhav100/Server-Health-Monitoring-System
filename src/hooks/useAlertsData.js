import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  fetchAlerts,
  fetchDashboardAlerts,
  fetchUnresolvedAlerts,
  fetchResolvedAlerts,
  resolveAlert,
} from '../services/alertService';

export function useAlertsData(tabFilter = 'all') {
  return useQuery({
    queryKey: ['alerts', tabFilter],
    queryFn: async () => {
      if (tabFilter === 'unresolved') {
        return await fetchUnresolvedAlerts();
      }
      if (tabFilter === 'resolved') {
        return await fetchResolvedAlerts();
      }
      if (tabFilter === 'dashboard') {
        return await fetchDashboardAlerts();
      }
      return await fetchAlerts();
    },
    retry: 2,
    staleTime: 1000 * 30,
  });
}

export function useAlertDashboardSummary() {
  return useQuery({
    queryKey: ['alertsDashboardSummary'],
    queryFn: fetchDashboardAlerts,
    retry: 2,
    staleTime: 1000 * 30,
  });
}

export function useResolveAlertMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId) => resolveAlert(alertId),
    onSuccess: (data, alertId) => {
      toast.success(`Alert ${alertId} resolved successfully`);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertsDashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error, alertId) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to resolve alert ${alertId}`
      );
    },
  });
}
