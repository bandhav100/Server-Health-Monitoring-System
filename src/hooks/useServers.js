import { useQuery } from '@tanstack/react-query';
import { fetchServers } from '../services/serverService';

export function useServers() {
  return useQuery({
    queryKey: ['servers'],
    queryFn: fetchServers,
  });
}
