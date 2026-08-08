import { useQuery } from '@tanstack/react-query';
import { fetchPredictionDashboard } from '../services/predictionService';

export function usePredictionsData() {
  return useQuery({
    queryKey: ['predictionsDashboard'],
    queryFn: fetchPredictionDashboard,
    retry: 2,
    staleTime: 1000 * 30,
  });
}
