import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  Search,
  RefreshCw,
  Clock,
  Wifi,
  WifiOff,
  Filter,
  ShieldCheck,
  Info,
  X,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import axiosClient, { unwrap } from '../axiosClient';
import {
  AlertChartPanel,
  AlertHistoryTable,
  AlertTimelineChart,
  CategoryBarChart,
  EmptyAlerts,
  LiveAlertTable,
  SeverityBadge,
  SeverityDonutChart,
  StatusBadge,
  TopServersTable,
} from '../components/Alerts/AlertComponents';
import '../components/Alerts/Alerts.css';

const ranges = [
  ['1h', 'Last Hour'],
  ['6h', 'Last 6 Hours'],
  ['24h', 'Last 24 Hours'],
  ['7d', 'Last 7 Days'],
];
const pageSize = 20;

const Alerts = () => {
  const { selectedServer, selectedServerKey } = useDashboard();

  const [summary, setSummary] = useState(null);
  const [live, setLive] = useState([]);
  const [history, setHistory] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topServers, setTopServers] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const [range, setRange] = useState('24h');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [historySeverity, setHistorySeverity] = useState('ALL');
  const [historyStatus, setHistoryStatus] = useState('ALL');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');
  const [details, setDetails] = useState(null);
  const [hiddenResolved, setHiddenResolved] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const isMountedRef = useRef(true);

  // Online listener
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

  const serverParams = selectedServerKey === 'ALL' ? {} : { server_id: selectedServer?.id };

  const queryApi = useCallback(
    (path, params = {}) => axiosClient.get(path, { params: { ...serverParams, ...params } }),
    [selectedServer?.id, selectedServerKey]
  );

  const loadAlertsData = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      else setRefreshing(true);

      try {
        const [
          summaryRes,
          liveRes,
          historyRes,
          distributionRes,
          categoriesRes,
          topServersRes,
          timelineRes,
        ] = await Promise.allSettled([
          queryApi('/alerts/summary'),
          queryApi('/alerts/live'),
          queryApi('/alerts/history', { days: range === '7d' ? 7 : 1, limit: 100 }),
          queryApi('/alerts/severity-distribution'),
          queryApi('/alerts/categories'),
          queryApi('/alerts/top-servers'),
          queryApi('/alerts/timeline', { range }),
        ]);

        if (!isMountedRef.current) return;

        if (summaryRes.status === 'fulfilled') {
          setSummary(unwrap(summaryRes.value));
        }
        if (liveRes.status === 'fulfilled') {
          const liveData = unwrap(liveRes.value);
          setLive(Array.isArray(liveData) ? liveData : (Array.isArray(liveData?.alerts) ? liveData.alerts : []));
        }
        if (historyRes.status === 'fulfilled') {
          const histData = unwrap(historyRes.value);
          const histList = Array.isArray(histData)
            ? histData
            : (Array.isArray(histData?.alerts) ? histData.alerts : []);
          setHistory(histList);
        }
        if (distributionRes.status === 'fulfilled') {
          const distData = unwrap(distributionRes.value);
          setDistribution(Array.isArray(distData) ? distData : []);
        }
        if (categoriesRes.status === 'fulfilled') {
          const catData = unwrap(categoriesRes.value);
          setCategories(Array.isArray(catData) ? catData : []);
        }
        if (topServersRes.status === 'fulfilled') {
          const topData = unwrap(topServersRes.value);
          setTopServers(Array.isArray(topData) ? topData : []);
        }
        if (timelineRes.status === 'fulfilled') {
          const timeData = unwrap(timelineRes.value);
          setTimeline(Array.isArray(timeData) ? timeData : []);
        }

        setLastUpdated(new Date());
      } catch (error) {
        if (isMountedRef.current) {
          setToast('Unable to synchronize alert telemetry.');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [queryApi, range]
  );

  // 15-second polling interval
  useEffect(() => {
    isMountedRef.current = true;
    loadAlertsData(true);

    const interval = setInterval(() => {
      loadAlertsData(false);
    }, 15000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadAlertsData]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  };

  const acknowledge = async (id) => {
    try {
      await axiosClient.post(`/alerts/${id}/acknowledge`);
      notify('Alert acknowledged.');
      loadAlertsData(false);
    } catch {
      notify('Failed to acknowledge alert.');
    }
  };

  const resolve = async (id) => {
    try {
      await axiosClient.post(`/alerts/${id}/resolve`);
      notify('Alert marked as resolved.');
      loadAlertsData(false);
    } catch {
      notify('Failed to resolve alert.');
    }
  };

  const acknowledgeAll = async () => {
    try {
      await axiosClient.post('/alerts/acknowledge-all', { ...serverParams });
      notify('All active alerts acknowledged.');
      loadAlertsData(false);
    } catch {
      notify('Failed to acknowledge all alerts.');
    }
  };

  const clearResolved = async () => {
    try {
      await axiosClient.delete('/alerts/clear-resolved', { params: serverParams });
      setHiddenResolved(true);
      notify('Resolved alerts cleared.');
      loadAlertsData(false);
    } catch {
      notify('Failed to clear resolved alerts.');
    }
  };

  const exportAlerts = () => {
    const rows = visibleHistory.map((alert) => [
      alert.created_at,
      alert.server_name,
      alert.metric,
      alert.current_value,
      alert.threshold_value,
      alert.severity,
      alert.status,
    ]);
    const csv = [
      ['Time', 'Server', 'Metric', 'Value', 'Threshold', 'Severity', 'Status'],
      ...rows,
    ]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shms-alerts.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const visibleLive = useMemo(() => {
    const list = Array.isArray(live) ? live : (Array.isArray(live?.alerts) ? live.alerts : []);
    return list.filter(
      (alert) =>
        (filter === 'ALL' || (alert?.severity || '').toUpperCase() === filter) &&
        (!search ||
          `${alert?.metric || ''} ${alert?.server_name || ''} ${alert?.description || ''}`
            .toLowerCase()
            .includes(search.toLowerCase()))
    );
  }, [live, filter, search]);

  const visibleHistory = useMemo(() => {
    const list = Array.isArray(history) ? history : (Array.isArray(history?.alerts) ? history.alerts : []);
    return list.filter(
      (alert) =>
        (!hiddenResolved || (alert?.status || '').toUpperCase() !== 'RESOLVED') &&
        (historySeverity === 'ALL' || (alert?.severity || '').toUpperCase() === historySeverity) &&
        (historyStatus === 'ALL' || (alert?.status || '').toUpperCase() === historyStatus)
    );
  }, [history, hiddenResolved, historySeverity, historyStatus]);

  const pagedHistory = useMemo(() => {
    return visibleHistory.slice((page - 1) * pageSize, page * pageSize);
  }, [visibleHistory, page]);

  const criticalCount = summary?.critical_alerts ?? 0;
  const warningCount = summary?.warning_alerts ?? 0;
  const infoCount = summary?.info_alerts ?? 0;
  const resolvedCount = summary?.resolved_today ?? 0;

  return (
    <main className="alerts-page space-y-6 w-full max-w-full text-slate-100 bg-black min-h-screen">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <WifiOff className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div className="flex-1 text-sm font-medium">
            Offline mode: alert evaluations will synchronize once internet is back.
          </div>
        </div>
      )}

      {/* Header & Status Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Alert Center</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Polling (15s)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Infrastructure anomaly and threshold violations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 bg-black border border-[#222222]">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{lastUpdated ? lastUpdated.toLocaleTimeString() : 'Syncing...'}</span>
          </div>

          <button
            type="button"
            onClick={() => loadAlertsData(false)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black hover:bg-[#111111] text-white border border-[#222222] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-black border border-[#222222] text-white text-sm shadow-2xl animate-fade-in flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Four Primary Alert Metric Cards: Critical, Warning, Info, Resolved */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Card */}
        <div className="p-5 rounded-2xl bg-black border border-[#1f1f1f] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Critical</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {loading ? '...' : criticalCount}
          </div>
          <p className="text-xs text-slate-400">Immediate action required</p>
        </div>

        {/* Warning Card */}
        <div className="p-5 rounded-2xl bg-black border border-[#1f1f1f] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Warning</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {loading ? '...' : warningCount}
          </div>
          <p className="text-xs text-slate-400">Impending threshold breach</p>
        </div>

        {/* Info Card */}
        <div className="p-5 rounded-2xl bg-black border border-[#1f1f1f] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Info</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Info size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {loading ? '...' : infoCount}
          </div>
          <p className="text-xs text-slate-400">System notices & updates</p>
        </div>

        {/* Resolved Today Card */}
        <div className="p-5 rounded-2xl bg-black border border-[#1f1f1f] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Resolved</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {loading ? '...' : resolvedCount}
          </div>
          <p className="text-xs text-slate-400">Cleared in the last 24h</p>
        </div>
      </section>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3 rounded-2xl bg-black border border-[#1f1f1f]">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search active alerts by metric, description, or server..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>

          <button
            onClick={acknowledgeAll}
            className="px-3 py-2 rounded-xl bg-[#111111] hover:bg-[#1a1a1a] text-white text-xs font-medium border border-[#222222] transition-colors cursor-pointer"
          >
            Acknowledge All
          </button>
          <button
            onClick={clearResolved}
            className="px-3 py-2 rounded-xl bg-[#111111] hover:bg-[#1a1a1a] text-white text-xs font-medium border border-[#222222] transition-colors cursor-pointer"
          >
            Clear Resolved
          </button>
          <button
            onClick={exportAlerts}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Live Alerts Panel */}
      <section className="rounded-2xl bg-black border border-[#1f1f1f] p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Active Infrastructure Signals</h2>
            <p className="text-xs text-slate-400 mt-0.5">Live anomalies monitored against threshold matrices</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#111111] border border-[#222222] text-slate-300 font-mono">
            {visibleLive.length} active
          </span>
        </div>

        {visibleLive.length ? (
          <LiveAlertTable
            alerts={visibleLive}
            onAcknowledge={acknowledge}
            onResolve={resolve}
            onDetails={setDetails}
          />
        ) : (
          <EmptyAlerts message="No active alerts in current scope. All services healthy." />
        )}
      </section>

      {/* Alert Analytics & Timeline Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertChartPanel
          title="Alert Timeline"
          subtitle="Hourly incident frequency"
          timeRange={ranges.find(([v]) => v === range)?.[1] || range}
          server={selectedServer?.name || 'All Servers'}
          data={timeline}
          keys={['critical', 'warning', 'info']}
          legend={[
            { name: 'Critical', color: '#DC2626' },
            { name: 'Warning', color: '#D97706' },
            { name: 'Info', color: '#2563EB' },
          ]}
          controls={
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#0a0a0a] border border-[#222222] text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {ranges.map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          }
        >
          {timeline && timeline.length ? (
            <AlertTimelineChart data={timeline} />
          ) : (
            <EmptyAlerts message="No alert activity in this range." />
          )}
        </AlertChartPanel>

        <AlertChartPanel
          title="Severity Distribution"
          subtitle="Breakdown by alert severity"
          server={selectedServer?.name || 'All Servers'}
          data={distribution}
          keys={['value']}
        >
          <SeverityDonutChart data={distribution} />
        </AlertChartPanel>
      </section>

      {/* Categories and Top Servers */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertChartPanel
          title="Alert Categories"
          subtitle="Triggered metrics by category"
          server={selectedServer?.name || 'All Servers'}
          data={categories}
          keys={['count']}
          legend={[{ name: 'Alerts', color: '#2563EB' }]}
        >
          <CategoryBarChart data={categories} />
        </AlertChartPanel>

        <div className="rounded-2xl bg-black border border-[#1f1f1f] p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Top Triggered Servers</h2>
              <p className="text-xs text-slate-400 mt-0.5">Highest alert volume across servers</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#111111] border border-[#222222] text-slate-300 font-mono">
              {topServers.length} servers
            </span>
          </div>
          {topServers.length ? (
            <TopServersTable servers={topServers} />
          ) : (
            <EmptyAlerts message="No server alert activity found." />
          )}
        </div>
      </section>

      {/* Alert History Section */}
      <section className="rounded-2xl bg-black border border-[#1f1f1f] p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Alert History Log</h2>
            <p className="text-xs text-slate-400 mt-0.5">Audit log of resolved and past alerts</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={historySeverity}
              onChange={(e) => {
                setHistorySeverity(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>

            <select
              value={historyStatus}
              onChange={(e) => {
                setHistoryStatus(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {pagedHistory.length ? (
          <AlertHistoryTable alerts={pagedHistory} />
        ) : (
          <EmptyAlerts message="No historical alerts match these filters." />
        )}

        {visibleHistory.length > pageSize && (
          <div className="flex items-center justify-between pt-3 border-t border-[#1a1a1a] text-xs text-slate-400">
            <span>
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, visibleHistory.length)} of {visibleHistory.length} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed text-white border border-[#222222] transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="font-mono px-2">
                Page {page} of {Math.max(1, Math.ceil(visibleHistory.length / pageSize))}
              </span>
              <button
                disabled={page >= Math.ceil(visibleHistory.length / pageSize)}
                onClick={() => setPage((p) => Math.min(Math.ceil(visibleHistory.length / pageSize), p + 1))}
                className="px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed text-white border border-[#222222] transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Alert Details Modal */}
      {details && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={() => setDetails(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-black border border-[#1f1f1f] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={details.severity} />
                <h2 className="text-base font-bold text-white">Alert Details</h2>
              </div>
              <button
                onClick={() => setDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Metric</span>
                <span className="font-semibold text-white">{details.metric || '--'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Server</span>
                <span className="font-semibold text-white">{details.server_name || '--'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Current Value</span>
                <span className="font-mono text-rose-400 font-semibold">{Number(details.current_value ?? 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Threshold</span>
                <span className="font-mono text-amber-400 font-semibold">{Number(details.threshold_value ?? 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Status</span>
                <StatusBadge status={details.status} />
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Category</span>
                <span className="text-slate-300">{details.category || 'General'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block mb-1">Triggered At</span>
                <span className="text-slate-300">{new Date(details.created_at).toLocaleString()}</span>
              </div>
              {details.resolved_at && (
                <div className="col-span-2">
                  <span className="text-slate-400 block mb-1">Resolved At</span>
                  <span className="text-emerald-400">{new Date(details.resolved_at).toLocaleString()}</span>
                </div>
              )}
              {details.description && (
                <div className="col-span-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Description</span>
                  {details.description}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              {details.status === 'ACTIVE' && (
                <button
                  onClick={() => {
                    acknowledge(details.id);
                    setDetails(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  Acknowledge
                </button>
              )}
              {details.status !== 'RESOLVED' && (
                <button
                  onClick={() => {
                    resolve(details.id);
                    setDetails(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Resolve
                </button>
              )}
              <button
                onClick={() => setDetails(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Alerts;
