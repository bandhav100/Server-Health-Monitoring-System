import axios from 'axios';

// Determine the base URL dynamically:
// If accessed remotely (e.g. Tailscale Funnel, mobile, or remote tunnel), always use relative '/api'
// to avoid mixed-content and CORS errors with localhost URLs.
const getBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_BASE;
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) {
      return '/api';
    }
  }
  return envBase || '/api';
};

const axiosClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shms_token') || localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[SHMS Axios Request Error]', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized & Global Error Logging
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config || {};
    const url = originalRequest.url || '';
    const isLoginRequest = url.includes('/auth/login');
    const isAlreadyOnLogin = typeof window !== 'undefined' && window.location.pathname === '/login';

    if (error.response?.status === 401 && !isLoginRequest && !isAlreadyOnLogin) {
      console.warn(`[SHMS AxiosClient] 401 Unauthorized on: ${url}. Clearing session and redirecting.`);
      localStorage.removeItem('shms_token');
      localStorage.removeItem('shms_user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Notify AuthContext or any active listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shms:unauthorized'));
        window.location.href = '/login';
      }
    } else if (error.response) {
      console.error(
        `[SHMS API Error] ${originalRequest.method?.toUpperCase()} ${url} -> ${error.response.status} ${error.response.statusText}`,
        error.response.data
      );
    } else if (error.request) {
      console.error(`[SHMS Network Error] No response received for ${originalRequest.method?.toUpperCase()} ${url}`, error.message);
    } else {
      console.error('[SHMS Axios Error]', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Unwraps standard SHMS API payload:
 * { success: true, message: '...', data: { ... } } -> returns data
 */
export const unwrap = (response) => {
  if (!response) return null;
  if (response.data && response.data.data !== undefined) {
    return response.data.data;
  }
  return response.data;
};

export default axiosClient;
