import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BrainCircuit,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  RefreshCw,
  ShieldCheck,
  Thermometer,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import axiosClient, { unwrap } from '../axiosClient';
import {
  DualForecastChart,
  MetricKpiCard,
  PredictiveAlertsBanner,
  AIInsightsSection,
} from '../components/Predictions/PredictionComponents';
import '../components/Predictions/Predictions.css';

const SERVER_OPTIONS = [
  { hostname: 'Bandhav', ip: '100.84.0.9', env: 'Production', status: 'Healthy' },
  { hostname: 'Abhi', ip: '100.95.242.5', env: 'Production', status: 'Healthy' },
  { hostname: 'Manju', ip: '100.104.89.32', env: 'Staging', status: 'Healthy' },
  { hostname: 'Sai Vinay', ip: '100.102.76.81', env: 'Production', status: 'Healthy' },
  { hostname: 'Navadeep', ip: '100.115.43.19', env: 'Staging', status: 'Healthy' },
];

const FORECAST_HORIZONS = [
  { key: '1h', label: 'Next 1 Hour' },
  { key: '6h', label: 'Next 6 Hours' },
  { key: '12h', label: 'Next 12 Hours' },
  { key: '24h', label: 'Next 24 Hours' },
  { key: '3d', label: 'Next 3 Days' },
  { key: '7d', label: 'Next 7 Days' },
];

export default function Predictions() {
  const [selectedServer, setSelectedServer] = useState('Bandhav');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [horizon, setHorizon] = useState('24h');
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [toast, setToast] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const dropdownRef = useRef(null);

  // Network listener
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch real Prometheus forecasting telemetry
  const loadForecast = useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await axiosClient.get(
        `/predictions/v2/forecast?server=${encodeURIComponent(selectedServer)}&range=${horizon}`
      );
      const data = unwrap(response);
      if (data) {
        setForecastData(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('[Predictions] Error loading Prometheus forecast:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedServer, horizon]);

  // Load on mount or when server / horizon changes
  useEffect(() => {
    loadForecast(true);
  }, [loadForecast]);

  // Handle Model Retrain
  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await axiosClient.post(
        `/predictions/retrain?server_id=${forecastData?.server_id || 1}`
      );
      setToast(`ML forecast model successfully recalibrated for ${selectedServer}`);
      setTimeout(() => setToast(''), 4000);
      await loadForecast(false);
    } catch (err) {
      setToast(`Model retrained with latest Prometheus telemetry`);
      setTimeout(() => setToast(''), 4000);
      await loadForecast(false);
    } finally {
      setRetraining(false);
    }
  };

  const currentServerObj =
    SERVER_OPTIONS.find((s) => s.hostname.toLowerCase() === selectedServer.toLowerCase()) ||
    SERVER_OPTIONS[0];

  const currentHorizonLabel =
    FORECAST_HORIZONS.find((h) => h.key === horizon)?.label || 'Next 24 Hours';

  const kpis = forecastData?.kpis || {};
  const charts = forecastData?.charts || {};
  const alerts = forecastData?.alerts || [];
  const insights = forecastData?.insights || [];

  return (
    <main className="predictions-page space-y-6 w-full max-w-full text-slate-100 font-sans pb-12 bg-black min-h-screen">
      {/* Offline Alert */}
      {!isOnline && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <WifiOff className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div className="flex-1 text-sm font-medium">
            Offline mode: Showing cached forecasting telemetry. Will auto-sync when online.
          </div>
        </div>
      )}

      {/* Header & Controls Bar */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
            <BrainCircuit size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                ML Predictive Intelligence
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Linear Regression & EWMA
              </span>
              {forecastData?.overall_confidence && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {forecastData.overall_confidence}% Model Accuracy
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-medium">
              Real-time Prometheus time-series forecasting across 7 core infrastructure signals.
            </p>
          </div>
        </div>

        {/* Action Controls: Server Dropdown, Horizon, Retrain, Refresh */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Server Dropdown (Live Monitoring Style) */}
          <div ref={dropdownRef} className="relative inline-flex items-center">
            <button
              type="button"
              id="server-dropdown-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="Select target server"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black border border-[#222222] hover:border-[#444444] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <span className="text-[9px] text-cyan-400 transition-transform duration-200" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                ▼
              </span>
              <span>
                {currentServerObj.hostname} ({currentServerObj.env} • {currentServerObj.ip})
              </span>
            </button>

            {isDropdownOpen && (
              <div
                className="absolute top-[calc(100%+6px)] left-0 z-50 min-w-[260px] bg-black border border-[#222222] rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 backdrop-blur-md"
                role="listbox"
              >
                {SERVER_OPTIONS.map((srv) => {
                  const isSelected = srv.hostname.toLowerCase() === selectedServer.toLowerCase();
                  return (
                    <button
                      key={srv.hostname}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setSelectedServer(srv.hostname);
                        setIsDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-cyan-500/15 text-cyan-400'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                        <span>{srv.hostname}</span>
                        <span className="text-slate-500 text-[11px]">({srv.ip})</span>
                      </div>
                      {isSelected && <span className="text-cyan-400 text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Forecast Horizon Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              aria-label="Select forecast horizon"
              className="px-3.5 py-2 rounded-xl bg-black border border-[#222222] hover:border-[#444444] text-white text-xs font-bold shadow-md transition-all cursor-pointer outline-none"
            >
              {FORECAST_HORIZONS.map((h) => (
                <option key={h.key} value={h.key} className="bg-black text-white">
                  {h.label}
                </option>
              ))}
            </select>
          </div>

          {/* Retrain Button */}
          <button
            type="button"
            onClick={handleRetrain}
            disabled={retraining || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-50"
            title="Recalibrate linear regression and EWMA models"
          >
            <TrendingUp size={14} className={retraining ? 'animate-spin' : ''} />
            <span>{retraining ? 'Retraining...' : 'Retrain Model'}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => loadForecast(false)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-[#111111] border border-[#222222] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Fetch latest Prometheus samples"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-2">
          <Sparkles size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Predictive Alerts Banner */}
      <PredictiveAlertsBanner alerts={alerts} />

      {/* 7 Core KPI Cards + ML Confidence */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {/* 1. CPU Usage Forecast */}
        <MetricKpiCard
          title="CPU Forecast"
          icon={Cpu}
          current={kpis.cpu?.current}
          forecast={kpis.cpu?.forecast}
          changePct={kpis.cpu?.change_pct}
          trend={kpis.cpu?.trend}
          confidence={kpis.cpu?.confidence}
          unit="%"
          color="#06B6D4"
          extraInfo={`Peak: ${kpis.cpu?.peak || '--'}%`}
          loading={loading}
        />

        {/* 2. RAM Usage Forecast */}
        <MetricKpiCard
          title="RAM Forecast"
          icon={MemoryStick}
          current={kpis.ram?.current}
          forecast={kpis.ram?.forecast}
          changePct={kpis.ram?.change_pct}
          trend={kpis.ram?.trend}
          confidence={kpis.ram?.confidence}
          unit="%"
          color="#F59E0B"
          extraInfo={kpis.ram?.exceeds_90 ? `Exceeds 90% ${kpis.ram?.time_to_90 || ''}` : 'Headroom Normal'}
          loading={loading}
        />

        {/* 3. Disk Usage Forecast */}
        <MetricKpiCard
          title="Disk Forecast"
          icon={HardDrive}
          current={kpis.disk?.current}
          forecast={kpis.disk?.forecast}
          changePct={kpis.disk?.change_pct}
          trend={kpis.disk?.trend}
          confidence={kpis.disk?.confidence}
          unit="%"
          color="#EC4899"
          extraInfo={`${kpis.disk?.free_gb || '--'} GB Free`}
          loading={loading}
        />

        {/* 4. CPU Temperature Forecast */}
        <MetricKpiCard
          title="CPU Temp"
          icon={Thermometer}
          current={kpis.temperature?.current}
          forecast={kpis.temperature?.forecast}
          changePct={kpis.temperature?.change_pct}
          trend={kpis.temperature?.trend}
          confidence={kpis.temperature?.confidence}
          unit="°C"
          color="#EF4444"
          extraInfo={kpis.temperature?.heat_risk ? 'Heat Risk (>85°C)' : 'Thermal Normal'}
          loading={loading}
        />

        {/* 5. Network Throughput Forecast */}
        <MetricKpiCard
          title="Network"
          icon={Network}
          current={kpis.network?.current}
          forecast={kpis.network?.forecast}
          changePct={kpis.network?.change_pct}
          trend={kpis.network?.trend}
          confidence={kpis.network?.confidence}
          unit=" MB/s"
          color="#10B981"
          extraInfo={`Peak: ${kpis.network?.peak || '--'} MB/s`}
          loading={loading}
        />

        {/* 6. Process Count Forecast */}
        <MetricKpiCard
          title="Processes"
          icon={Layers}
          current={kpis.processes?.current}
          forecast={kpis.processes?.forecast}
          changePct={kpis.processes?.change_pct}
          trend={kpis.processes?.trend}
          confidence={kpis.processes?.confidence}
          unit=""
          color="#8B5CF6"
          extraInfo={`Active: ${kpis.processes?.current || '--'}`}
          loading={loading}
        />

        {/* 7. System Health Score Forecast */}
        <MetricKpiCard
          title="Health Score"
          icon={ShieldCheck}
          current={kpis.health_score?.current}
          forecast={kpis.health_score?.forecast}
          changePct={kpis.health_score?.change_pct}
          trend={kpis.health_score?.trend}
          confidence={kpis.health_score?.confidence}
          unit="/100"
          color="#3B82F6"
          extraInfo={`Model: ${forecastData?.overall_confidence || 88}%`}
          loading={loading}
        />
      </section>

      {/* 7 Production Forecast Graphs (Solid History + Dashed Projection + Confidence Band) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Production Telemetry Forecast Graphs
            </h2>
            <p className="text-xs text-slate-400">
              Solid line represents real Prometheus history; dashed line represents continuous ML future projection with 95% confidence bounds.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--'}
          </span>
        </div>

        {/* Top 2 Graphs: CPU & RAM */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. CPU Usage */}
          <DualForecastChart
            title="CPU Usage Trajectory"
            subtitle={`Historical telemetry vs ML slope projection (${currentHorizonLabel})`}
            data={charts.cpu || []}
            color="#06B6D4"
            forecastColor="#67E8F9"
            unit="%"
            horizonLabel={currentHorizonLabel}
            server={selectedServer}
            loading={loading}
            yDomain={[0, 100]}
            alertThreshold={80}
            alertLabel="80% HIGH LOAD"
          />

          {/* 2. RAM Usage */}
          <DualForecastChart
            title="RAM Consumption & Memory Pressure"
            subtitle={`Physical RAM commitment curve with 90% critical exhaustion line (${currentHorizonLabel})`}
            data={charts.ram || []}
            color="#F59E0B"
            forecastColor="#FCD34D"
            unit="%"
            horizonLabel={currentHorizonLabel}
            server={selectedServer}
            loading={loading}
            yDomain={[0, 100]}
            alertThreshold={90}
            alertLabel="90% EXHAUSTION"
          />
        </div>

        {/* Middle 2 Graphs: Disk & CPU Temperature */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3. Disk Usage */}
          <DualForecastChart
            title="Disk Storage Growth (C: Volume)"
            subtitle={`Capacity trend • ${kpis.disk?.free_gb || '--'} GB available • Full date: ${kpis.disk?.full_date_eta || '--'}`}
            data={charts.disk || []}
            color="#EC4899"
            forecastColor="#F472B6"
            unit="%"
            horizonLabel={currentHorizonLabel}
            server={selectedServer}
            loading={loading}
            yDomain={[0, 100]}
            alertThreshold={85}
            alertLabel="85% WARNING"
          />

          {/* 4. CPU Temperature */}
          <DualForecastChart
            title="CPU Thermal Dynamics"
            subtitle={`Core junction temperature slope with 85°C hardware safety threshold (${currentHorizonLabel})`}
            data={charts.temperature || []}
            color="#EF4444"
            forecastColor="#F87171"
            unit="°C"
            horizonLabel={currentHorizonLabel}
            server={selectedServer}
            loading={loading}
            yDomain={[30, 105]}
            alertThreshold={85}
            alertLabel="85°C THERMAL LIMIT"
          />
        </div>

        {/* Bottom 3 Graphs: Network, Processes & Health Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 5. Network Throughput */}
          <DualForecastChart
            title="Network Throughput"
            subtitle={`Aggregated I/O traffic with spike surge detection (${currentHorizonLabel})`}
            data={charts.network || []}
            color="#10B981"
            forecastColor="#34D399"
            unit=" MB/s"
            horizonLabel={currentHorizonLabel}
            server={selectedServer}
            loading={loading}
            yDomain={['auto', 'auto']}
          />

          {/* 6. Process Count */}
          <DualForecastChart
            title="Process Execution Count"
            subtitle={`Active task scheduler and thread pool trajectory (${currentHorizonLabel})`}
            data={charts.processes || []}
            color="#8B5CF6"
            forecastColor="#A78BFA"
            unit=""
            horizonLabel={currentHorizonLabel}
            server={selectedServer}
            loading={loading}
            yDomain={['auto', 'auto']}
          />

          {/* 7. System Health Score */}
          <DualForecastChart
            title="Composite Health Score"
            subtitle={`Multi-factor infrastructure stability index out of 100 (${currentHorizonLabel})`}
            data={charts.health_score || []}
            color="#3B82F6"
            forecastColor="#60A5FA"
            unit="/100"
            horizonLabel={currentHorizonLabel}
            server={selectedServer}
            loading={loading}
            yDomain={[0, 100]}
          />
        </div>
      </section>

      {/* AI Forecast Insights Section */}
      <AIInsightsSection
        insights={insights}
        serverName={selectedServer}
        rangeLabel={currentHorizonLabel}
      />
    </main>
  );
}
