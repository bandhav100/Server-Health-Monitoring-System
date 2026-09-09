import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ExternalLink, Maximize2, RefreshCw } from 'lucide-react';
import ChartCard from '../components/UI/ChartCard';
import { useDashboard } from '../context/DashboardContext';
import { buildGrafanaDashboardUrl } from '../data/dashboardData';

const Grafana = () => {
  const { selectedServer, selectedServerKey } = useDashboard();
  const [frameState, setFrameState] = useState('loading');
  const [timeRange, setTimeRange] = useState('24h');
  const [refreshKey, setRefreshKey] = useState(0);

  const currentFrameUrl = buildGrafanaDashboardUrl(
    selectedServerKey === 'ALL' ? '.*' : selectedServer?.prometheus_instance || '.*',
    timeRange,
  );

  const updateTimeRange = (range) => {
    setFrameState('loading');
    setTimeRange(range);
    setRefreshKey((key) => key + 1);
  };

  const refreshDashboard = () => {
    setFrameState('loading');
    setRefreshKey((key) => key + 1);
  };

  const fullscreen = () => {
    window.open(currentFrameUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-pink-400" />
        <div>
          <h1 className="text-3xl font-bold text-white">Grafana</h1>
          <p className="text-gray-400 text-sm">External analytics and monitoring dashboard</p>
        </div>
      </div>

      <ChartCard title="Grafana Dashboard" subtitle={selectedServer?.name || 'No server selected'}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Grafana time range">
            {['15m', '1h', '6h', '24h'].map((range) => (
              <button key={range} type="button" onClick={() => updateTimeRange(range)} className={`toolbar-button ${timeRange === range ? 'toolbar-button-active' : ''}`}>
                Last {range}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={refreshDashboard} className="toolbar-button" title="Refresh dashboard">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button type="button" onClick={fullscreen} className="toolbar-button" title="Fullscreen dashboard">
              <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
            </button>
            <a href={currentFrameUrl} className="toolbar-button" title="Open Grafana">
              <ExternalLink className="w-3.5 h-3.5" /> Open Grafana
            </a>
          </div>
        </div>
        <div data-grafana-frame className="relative h-[720px] overflow-hidden rounded-lg border border-white/10 bg-black shadow-2xl">
          {frameState === 'loading' && <div className="absolute inset-0 z-10 animate-pulse bg-zinc-950 p-6" aria-label="Loading Grafana dashboard"><div className="h-5 w-48 rounded bg-white/10" /><div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"><div className="h-48 rounded bg-white/5" /><div className="h-48 rounded bg-white/5" /><div className="h-64 rounded bg-white/5 md:col-span-2" /></div></div>}
          {frameState === 'error' && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-zinc-950 p-6 text-center"><BarChart3 className="h-10 w-10 text-zinc-500" /><p className="text-sm font-semibold text-white">Grafana is unavailable</p><p className="max-w-md text-xs text-zinc-500">The dashboard could not be loaded. Check Grafana and retry.</p><button type="button" onClick={refreshDashboard} className="toolbar-button toolbar-button-active">Retry</button></div>}
          <iframe key={`${refreshKey}-${currentFrameUrl}`} title="Grafana dashboard" src={currentFrameUrl} className="h-full w-full border-0" allowFullScreen onLoad={() => setFrameState('ready')} onError={() => setFrameState('error')} loading="lazy" />
        </div>
      </ChartCard>
    </motion.div>
  );
};

export default Grafana;
