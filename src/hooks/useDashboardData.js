import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from '../services/dashboardService';

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    retry: 2,
    staleTime: 1000 * 30,
  });
}
