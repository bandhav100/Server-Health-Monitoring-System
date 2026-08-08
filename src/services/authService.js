import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

export async function loginUser(credentials) {
  // Calls POST /api/auth/login with credentials { emailOrUsername, password }
  return await axiosClient.post(ENDPOINTS.AUTH.LOGIN, credentials);
}

export async function logoutUser() {
  return await axiosClient.post(ENDPOINTS.AUTH.LOGOUT);
}
