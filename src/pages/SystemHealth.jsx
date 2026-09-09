import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import ChartCard from '../components/UI/ChartCard';
import api, { unwrap } from '../api';

const SystemHealth = () => {
  const [health, setHealth] = useState(null);
  useEffect(() => { api.get('/system/health').then((response) => setHealth(unwrap(response))).catch(() => setHealth(null)); }, []);
  const services = health ? [health.database, health.prometheus, health.grafana, health.windows_exporter, health.docker] : [];
  return <div className="space-y-6"><div className="flex items-center gap-3 mb-6"><Activity className="w-8 h-8 text-emerald-400" /><div><h1 className="text-3xl font-bold text-white">System Health</h1><p className="text-gray-400 text-sm">Service availability from the backend</p></div></div><ChartCard title="Overall Status" subtitle={health?.timestamp || 'Loading'}><span className={`badge ${health?.overall_status === 'ok' ? 'badge-success' : 'badge-danger'}`}>{health?.overall_status || 'Loading'}</span></ChartCard><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{services.map((service) => <ChartCard key={service.name} title={service.name}><p className={service.healthy ? 'text-emerald-400' : 'text-red-400'}>{service.healthy ? 'Healthy' : 'Unavailable'}</p><p className="text-gray-400 text-sm mt-2">{service.details || service.status}</p></ChartCard>)}</div></div>;
};
export default SystemHealth;
