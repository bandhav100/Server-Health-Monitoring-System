export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
  },
  DASHBOARD: '/api/dashboard',
  METRICS: '/api/metrics',
  PREDICTIONS_DASHBOARD: '/api/predictions/dashboard',
  ALERTS: {
    BASE: '/api/alerts',
    DASHBOARD: '/api/alerts/dashboard',
    UNRESOLVED: '/api/alerts/unresolved',
    RESOLVED: '/api/alerts/resolved',
    RESOLVE: (id) => `/api/alerts/${id}/resolve`,
  },
  SERVERS: {
    BASE: '/api/servers',
    BY_ID: (id) => `/api/servers/${id}`,
  },
};
