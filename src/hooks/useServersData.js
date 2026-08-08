import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  fetchServers,
  createServer,
  updateServer,
  deleteServer,
} from '../services/serverService';

export function useServersData() {
  return useQuery({
    queryKey: ['servers'],
    queryFn: fetchServers,
    retry: 2,
    staleTime: 1000 * 30,
  });
}

export function useCreateServerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverData) => createServer(serverData),
    onSuccess: () => {
      toast.success('Server added successfully');
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || error?.message || 'Failed to add server'
      );
    },
  });
}

export function useUpdateServerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateServer(id, data),
    onSuccess: (res, { id }) => {
      toast.success(`Server ${id} updated successfully`);
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error, { id }) => {
      toast.error(
        error?.response?.data?.message || error?.message || `Failed to update server ${id}`
      );
    },
  });
}

export function useDeleteServerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteServer(id),
    onSuccess: (res, id) => {
      toast.success(`Server ${id} deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error, id) => {
      toast.error(
        error?.response?.data?.message || error?.message || `Failed to delete server ${id}`
      );
    },
  });
}
