import { useQuery } from '@tanstack/react-query';
import { fetchMetrics } from '../services/metricsService';

export function useMetricsData() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    retry: 2,
    staleTime: 1000 * 30,
  });
}
