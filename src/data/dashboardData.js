const getGrafanaBaseUrl = () => {
  const envUrl = import.meta.env.VITE_GRAFANA_BASE || '/grafana';
  const cleanBase = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  return `${cleanBase}/d/ad5x2s5/shms`;
};

export const buildGrafanaDashboardUrl = (instance = '.*', timeRange = '24h') => {
  const fullPath = getGrafanaBaseUrl();
  // Using window.location.origin ensures relative URLs work identically on localhost,
  // Tailscale Funnel (https://bandhav-1.tail84beab.ts.net), and mobile browsers without CORS/mixed-content.
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:5173';
  const url = new URL(fullPath, origin);
  url.searchParams.set('orgId', '1');
  url.searchParams.set('theme', 'dark'); // Forced dark theme
  url.searchParams.set('kiosk', 'tv');
  url.searchParams.set('from', `now-${timeRange}`);
  url.searchParams.set('to', 'now');
  url.searchParams.set('refresh', '30s');
  url.searchParams.set('var-instance', instance);
  return url.toString();
};
