import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

export const fetchServers = async () => {
  return await axiosClient.get(ENDPOINTS.SERVERS.BASE);
};

export const createServer = async (serverData) => {
  return await axiosClient.post(ENDPOINTS.SERVERS.BASE, serverData);
};

export const updateServer = async (id, serverData) => {
  return await axiosClient.put(ENDPOINTS.SERVERS.BY_ID(id), serverData);
};

export const deleteServer = async (id) => {
  return await axiosClient.delete(ENDPOINTS.SERVERS.BY_ID(id));
};
