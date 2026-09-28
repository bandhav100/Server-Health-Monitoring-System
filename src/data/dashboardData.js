const GRAFANA_DASHBOARD_URL = import.meta.env.VITE_GRAFANA_URL || 'http://127.0.0.1:3000/d/ad5x2s5/shms';

export const buildGrafanaDashboardUrl = (instance = '.*', timeRange = '24h') => {
	const url = new URL(GRAFANA_DASHBOARD_URL);
	url.searchParams.set('orgId', '1');
	url.searchParams.set('theme', 'light');
	url.searchParams.set('kiosk', 'tv');
	url.searchParams.set('from', `now-${timeRange}`);
	url.searchParams.set('to', 'now');
	url.searchParams.set('var-instance', instance);
	return url.toString();
};
