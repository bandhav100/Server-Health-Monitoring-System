import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

export const fetchMetrics = async () => {
  return await axiosClient.get(ENDPOINTS.METRICS);
};
