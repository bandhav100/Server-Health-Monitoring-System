import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

export const fetchDashboardData = async () => {
  return await axiosClient.get(ENDPOINTS.DASHBOARD);
};
