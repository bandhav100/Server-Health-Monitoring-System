import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ExternalLink, Maximize2, Minimize2, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { buildGrafanaDashboardUrl } from '../data/dashboardData';

const TIME_RANGES = [
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '6h', value: '6h' },
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
];

const Grafana = () => {
  const { selectedServer, selectedServerKey, serverOptions, setSelectedServer } = useDashboard();
  const [frameState, setFrameState] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [timeRange, setTimeRange] = useState('24h');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const containerRef = useRef(null);

  // Network online listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const targetInstance = useMemo(() => {
    if (selectedServerKey === 'ALL') return '.*';
    return selectedServer?.prometheus_instance || selectedServer?.ip || '.*';
  }, [selectedServer, selectedServerKey]);

  const currentFrameUrl = useMemo(() => {
    return buildGrafanaDashboardUrl(targetInstance, timeRange);
  }, [targetInstance, timeRange]);

  const updateTimeRange = (range) => {
    setFrameState('loading');
    setTimeRange(range);
    setRefreshKey((k) => k + 1);
  };

  const refreshDashboard = () => {
    setFrameState('loading');
    setRefreshKey((k) => k + 1);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const openInNewTab = () => {
    window.open(currentFrameUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      ref={containerRef}
      className={`space-y-4 w-full max-w-full text-slate-100 ${isFullscreen ? 'p-6 bg-[#0B0F19]' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Offline Banner */}
      {!isOnline && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <WifiOff className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div className="flex-1 text-sm font-medium">
            Internet connection lost. Grafana iframe may not load new data until connected.
          </div>
        </div>
      )}

      {/* Header & Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <BarChart3 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Grafana Analytics</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Dark Embedded
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Production telemetry dashboards proxied via /grafana.
            </p>
          </div>
        </div>

        {/* Action Controls & Instance Filter */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Server Selector */}
          {serverOptions?.length > 0 && (
            <select
              value={selectedServerKey}
              onChange={(e) => setSelectedServer(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Cluster Nodes</option>
              {serverOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.name}
                </option>
              ))}
            </select>
          )}

          {/* Time Range Pills */}
          <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
            {TIME_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => updateTimeRange(r.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  timeRange === r.value
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={refreshDashboard}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Reload Grafana frame"
          >
            <RefreshCw size={14} />
          </button>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer hidden sm:inline-flex"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* External Link */}
          <button
            onClick={openInNewTab}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            title="Open standalone Grafana"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">Open Grafana</span>
          </button>
        </div>
      </div>

      {/* Main Embedded Dashboard Container */}
      <div className="relative w-full h-[680px] sm:h-[750px] lg:h-[calc(100vh-210px)] rounded-2xl bg-[#0F121C] border border-slate-800/80 shadow-2xl overflow-hidden">
        {/* Loading Skeleton */}
        {frameState === 'loading' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0F121C] p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 animate-pulse">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Loading Grafana Telemetry...</p>
              <p className="text-xs text-slate-400 mt-1">Connecting to /grafana reverse-proxy endpoint</p>
            </div>
            <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="w-full h-full bg-orange-500 animate-[pulse_1s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* Error Fallback */}
        {frameState === 'error' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0F121C] p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Grafana Dashboard Unreachable</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Ensure Grafana is running on port 3001 and the /grafana proxy is responding.
              </p>
            </div>
            <button
              onClick={refreshDashboard}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Iframe */}
        <iframe
          key={`${refreshKey}-${currentFrameUrl}`}
          title="Grafana Dashboard"
          src={currentFrameUrl}
          className="w-full h-full border-0 rounded-2xl bg-transparent"
          allowFullScreen
          onLoad={() => setFrameState('ready')}
          onError={() => setFrameState('error')}
        />
      </div>
    </motion.div>
  );
};

export default Grafana;
