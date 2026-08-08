import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

export const fetchAlerts = async () => {
  return await axiosClient.get(ENDPOINTS.ALERTS.BASE);
};

export const fetchDashboardAlerts = async () => {
  return await axiosClient.get(ENDPOINTS.ALERTS.DASHBOARD);
};

export const fetchUnresolvedAlerts = async () => {
  return await axiosClient.get(ENDPOINTS.ALERTS.UNRESOLVED);
};

export const fetchResolvedAlerts = async () => {
  return await axiosClient.get(ENDPOINTS.ALERTS.RESOLVED);
};

export const resolveAlert = async (id) => {
  return await axiosClient.post(ENDPOINTS.ALERTS.RESOLVE(id));
};
