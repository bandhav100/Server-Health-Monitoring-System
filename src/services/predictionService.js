import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

export const fetchPredictionDashboard = async () => {
  return await axiosClient.get(ENDPOINTS.PREDICTIONS_DASHBOARD);
};
