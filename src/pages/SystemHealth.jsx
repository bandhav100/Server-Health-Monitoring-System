import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import ChartCard from '../components/UI/ChartCard';
import api, { unwrap } from '../api';

const SystemHealth = () => {
  const [health, setHealth] = useState(null);
  useEffect(() => { api.get('/system/health').then((response) => setHealth(unwrap(response))).catch(() => setHealth(null)); }, []);
  const services = health ? [health.database, health.prometheus, health.grafana, health.windows_exporter, health.docker] : [];
  return (
    <div className="space-y-6 system-health-page">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-8 h-8 text-emerald-500" />
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Service availability from the backend</p>
        </div>
      </div>
      <ChartCard title="Overall Status" subtitle={health?.timestamp || 'Loading'}>
        <span className={`badge ${health?.overall_status === 'ok' ? 'badge-success' : 'badge-danger'}`}>
          {health?.overall_status || 'Loading'}
        </span>
      </ChartCard>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <ChartCard key={service.name} title={service.name}>
            <p className={`font-semibold ${service.healthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {service.healthy ? 'Healthy' : 'Unavailable'}
            </p>
            <p className="text-sm mt-2 font-medium opacity-90">
              {service.details || service.status}
            </p>
          </ChartCard>
        ))}
      </div>
    </div>
  );
};
export default SystemHealth;
