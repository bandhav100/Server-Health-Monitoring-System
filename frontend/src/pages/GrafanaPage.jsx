import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Maximize2, RefreshCw } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { buildGrafanaDashboardUrl } from '../data/dashboardData';

const TIME_RANGES = [
  { label: '15 Minutes', value: '15m' },
  { label: '1 Hour', value: '1h' },
  { label: '6 Hours', value: '6h' },
  { label: '24 Hours', value: '24h' },
];

const LOAD_ERROR = 'The analytics dashboard could not be loaded. Check the monitoring service settings.';

const GrafanaPage = () => {
  const { selectedServerKey, serverOptions, setSelectedServer } = useDashboard();
  const [timeRange, setTimeRange] = useState('24h');
  const [frameState, setFrameState] = useState('loading');
  const [refreshKey, setRefreshKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const frameRef = useRef(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setFrameState('loading');
      setRefreshKey((key) => key + 1);
    }, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const frameUrl = useMemo(() => {
    const selectedServer = serverOptions.find((server) => server.key === selectedServerKey);
    const instance = selectedServerKey === 'ALL' ? '.*' : selectedServer?.instance || '.*';
    return buildGrafanaDashboardUrl(instance, timeRange);
  }, [selectedServerKey, serverOptions, timeRange]);

  const reloadFrame = () => {
    setFrameState('loading');
    setRefreshKey((key) => key + 1);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      frameRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <section className="dashboard-console min-h-[calc(100vh-120px)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-blue-600" />
          <div>
            <p className="eyebrow">Live observability</p>
            <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="grafana-server">Server</label>
          <select
            id="grafana-server"
            value={selectedServerKey}
            onChange={(event) => {
              setSelectedServer(event.target.value);
              setFrameState('loading');
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-blue-500"
          >
            <option value="ALL">All Servers</option>
            {serverOptions.map((server) => (
              <option key={server.key} value={server.key}>
                {server.name}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Analytics time range">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                type="button"
                onClick={() => { setTimeRange(range.value); setFrameState('loading'); }}
                className={`toolbar-button ${timeRange === range.value ? 'toolbar-button-active' : ''}`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={reloadFrame} className="toolbar-button" title="Refresh dashboard">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button type="button" onClick={toggleFullscreen} className="toolbar-button" title="Fullscreen dashboard">
            <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
          </button>
        </div>
      </div>

      <div
        ref={frameRef}
        className="relative w-full overflow-hidden bg-white shadow-sm"
        style={{ border: 'none', borderRadius: '18px', height: 'calc(100vh - 220px)', minHeight: '640px' }}
      >
        {frameState === 'loading' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-sm">Loading analytics...</span>
          </div>
        )}
        {frameState === 'error' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white p-6 text-center">
            <BarChart3 className="h-10 w-10 text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Unable to load analytics</p>
            <p className="max-w-md text-xs text-gray-500">{errorMessage || LOAD_ERROR}</p>
            <button type="button" onClick={reloadFrame} className="toolbar-button toolbar-button-active">Retry</button>
          </div>
        )}
        <iframe
          key={`${frameUrl}-${refreshKey}`}
          src={frameUrl}
          title="SHMS analytics"
          width="100%"
          height="900"
          frameBorder="0"
          allowFullScreen
          onLoad={() => setFrameState('ready')}
          onError={() => {
            setFrameState('error');
            setErrorMessage(LOAD_ERROR);
          }}
          className="block h-full w-full border-0 bg-white"
        />
      </div>
    </section>
  );
};

export default GrafanaPage;
