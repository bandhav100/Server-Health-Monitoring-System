import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Server,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  ChevronDown,
  Cpu,
  MoreVertical,
  Check,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Activity,
  Copy,
  Plus,
  Wifi,
  WifiOff,
  AlertTriangle,
  Layers,
  HardDrive,
  Network as NetworkIcon,
} from 'lucide-react';
import axiosClient, { unwrap } from '../axiosClient';
import { useAuth } from '../context/AuthContext';
import AddServerModal from '../components/Servers/AddServerModal';
import './Servers.css';

const WindowsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="#0078D4">
    <path d="M0 2.263L6.474 1.38v6.236H0V2.263zm0 6.099h6.474v6.236L0 13.737V8.362zm7.263-7.14L16 0v7.616H7.263V1.222zm0 7.14H16v7.616l-8.737-1.222V8.362z" />
  </svg>
);

const formatUptime = (value) => {
  if (value == null || Number.isNaN(Number(value)) || Number(value) <= 0) return '--';
  const totalMinutes = Math.floor(Number(value) * 60);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const MetricProgressBar = ({ value, metricType = 'cpu', color, isOffline = false }) => {
  const defaultColors = {
    cpu: '#3B82F6', // Blue fill
    ram: '#F59E0B', // Orange/amber fill
    disk: '#EF4444', // Red/coral fill
  };
  const barColor = color || defaultColors[metricType] || '#3B82F6';

  const isInvalid =
    isOffline ||
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value)) ||
    value === '' ||
    String(value).trim() === '--';

  if (isInvalid) {
    return (
      <div className="table-metric-wrap" title="Metric unavailable">
        <div className="table-metric-track" aria-hidden="true">
          <span className="table-metric-bar" style={{ width: '0%', backgroundColor: 'transparent' }} />
        </div>
        <span className="table-metric-val muted">--</span>
      </div>
    );
  }

  const numeric = Number(value);
  const clamped = Math.min(100, Math.max(0, numeric));
  const displayVal = Math.round(clamped);

  return (
    <div className="table-metric-wrap" title={`${displayVal}%`}>
      <div
        className="table-metric-track"
        role="progressbar"
        aria-valuenow={displayVal}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          className="table-metric-bar"
          style={{
            width: `${clamped}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      <span className="table-metric-val">{displayVal}%</span>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const isHealthy = status === 'healthy';
  const isPending = status === 'pending';

  if (isHealthy) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
        <Check size={11} strokeWidth={3} />
        Healthy
      </span>
    );
  }

  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm" title="Awaiting scrape response">
        <Clock size={11} strokeWidth={2.5} />
        Pending
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm">
      <X size={11} strokeWidth={3} />
      Offline
    </span>
  );
};

const Servers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [copiedIp, setCopiedIp] = useState(null);

  const [query, setQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sort, setSort] = useState({ key: null, direction: 'desc' });
  const [activeActionId, setActiveActionId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const actionMenuRef = useRef(null);
  const isMountedRef = useRef(true);

  // Online status listeners
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Fetch servers from /api/servers
  const fetchServers = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const response = await axiosClient.get('/servers');
      const data = unwrap(response) || [];
      if (!isMountedRef.current) return;
      setServers(Array.isArray(data) ? data : []);
      setLastRefresh(new Date());
    } catch (err) {
      if (!isMountedRef.current) return;
      setError('Unable to fetch servers inventory. Check backend connection.');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    isMountedRef.current = true;
    fetchServers(true);

    const timer = setInterval(() => {
      fetchServers(false);
    }, 15000);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
    };
  }, [fetchServers]);

  // Click outside to close action menu
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setActiveActionId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const totalServers = servers.length;
  const healthyCount = servers.filter((s) => s.status === 'healthy').length;
  const pendingCount = servers.filter((s) => s.status === 'pending').length;
  const offlineCount = servers.filter((s) => s.status === 'offline' || s.status === 'down').length;

  const healthyPct = totalServers ? Math.round((healthyCount / totalServers) * 100) : 0;
  const pendingPct = totalServers ? Math.round((pendingCount / totalServers) * 100) : 0;
  const offlinePct = totalServers ? Math.round((offlineCount / totalServers) * 100) : 0;

  const onlineServers = servers.filter((s) => s.status === 'healthy');
  const averageCpu = onlineServers.length
    ? Math.round(onlineServers.reduce((tot, s) => tot + Number(s.cpu || 0), 0) / onlineServers.length)
    : '--';

  const copyIp = (ip, e) => {
    e.stopPropagation();
    if (!ip || ip === '--') return;
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const filteredServers = useMemo(() => {
    const search = query.trim().toLowerCase();
    const rows = servers.filter((server) => {
      const hostname = server.hostname || server.name || '';
      const displayName = server.displayName || '';
      const ip = server.ip || server.tailscale_ip || server.ip_address || '';
      const os = server.operating_system || server.operatingSystem || 'windows';
      const env = server.environment || 'Production';

      const matchesSearch =
        !search ||
        `${hostname} ${displayName} ${ip} ${os} ${env}`.toLowerCase().includes(search);

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (server.status && server.status.toLowerCase() === selectedStatus.toLowerCase());

      return matchesSearch && matchesStatus;
    });

    if (!sort.key) return rows;

    return [...rows].sort((a, b) => {
      let aVal = a[sort.key];
      let bVal = b[sort.key];

      if (sort.key === 'status') {
        const order = { healthy: 3, pending: 2, offline: 1, down: 0 };
        aVal = order[a.status] || 0;
        bVal = order[b.status] || 0;
      } else if (sort.key === 'hostname' || sort.key === 'displayName') {
        aVal = (a[sort.key] || a.name || '').toLowerCase();
        bVal = (b[sort.key] || b.name || '').toLowerCase();
        return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        aVal = Number(aVal || 0);
        bVal = Number(bVal || 0);
      }
      return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [query, selectedStatus, servers, sort]);

  const toggleSort = (key) => {
    setSort((curr) => ({
      key,
      direction: curr.key === key && curr.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const getSortIcon = (key) => {
    if (sort.key !== key) return <ArrowUpDown size={11} className="opacity-40" />;
    return sort.direction === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
  };

  return (
    <motion.div
      className="servers-container space-y-6 w-full max-w-full text-slate-100"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Offline Banner */}
      {!isOnline && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <WifiOff className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div className="flex-1 text-sm font-medium">
            Internet connection lost. Server metrics will resume upon reconnecting.
          </div>
        </div>
      )}

      {/* ── HEADER & TELEMETRY BAR ────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Server size={24} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Servers Fleet</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                15s Live Sync
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Live Windows fleet discovery, metrics, and health scores.
            </p>
          </div>
        </div>

        {/* Status Chips and Refresh Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Connected' : 'Offline'}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 bg-slate-900 border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{lastRefresh ? lastRefresh.toLocaleTimeString() : 'Syncing...'}</span>
          </div>

          <button
            type="button"
            onClick={() => fetchServers(false)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh servers list"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all cursor-pointer"
            title="Add a new server"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Add Server</span>
          </button>
        </div>
      </header>

      {/* Error alert with retry */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchServers(true)}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── KPI METRICS CARDS ─────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="servers-kpi-card">
          <div className="servers-kpi-icon-wrap blue">
            <Server size={22} strokeWidth={2.4} />
          </div>
          <div className="servers-kpi-body">
            <div className="servers-kpi-label-row">
              <span className="servers-kpi-label">Discovered Servers</span>
              <span className="servers-kpi-badge">Fleet</span>
            </div>
            <div className="servers-kpi-val">{totalServers}</div>
            <div className="servers-kpi-bar">
              <div className="servers-kpi-fill blue" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        <div className="servers-kpi-card">
          <div className="servers-kpi-icon-wrap green">
            <CheckCircle2 size={22} strokeWidth={2.4} />
          </div>
          <div className="servers-kpi-body">
            <div className="servers-kpi-label-row">
              <span className="servers-kpi-label">Healthy Servers</span>
              <span className="servers-kpi-percentage text-emerald-400">{healthyPct}%</span>
            </div>
            <div className="servers-kpi-val">{healthyCount}</div>
            <div className="servers-kpi-bar">
              <div className="servers-kpi-fill green" style={{ width: `${healthyPct}%` }} />
            </div>
          </div>
        </div>

        <div className="servers-kpi-card">
          <div className="servers-kpi-icon-wrap amber">
            <Clock size={22} strokeWidth={2.4} />
          </div>
          <div className="servers-kpi-body">
            <div className="servers-kpi-label-row">
              <span className="servers-kpi-label">Pending / Scrape</span>
              <span className="servers-kpi-percentage text-amber-400">{pendingPct}%</span>
            </div>
            <div className="servers-kpi-val">{pendingCount}</div>
            <div className="servers-kpi-bar">
              <div className="servers-kpi-fill amber" style={{ width: `${pendingPct}%` }} />
            </div>
          </div>
        </div>

        <div className="servers-kpi-card">
          <div className="servers-kpi-icon-wrap red">
            <XCircle size={22} strokeWidth={2.4} />
          </div>
          <div className="servers-kpi-body">
            <div className="servers-kpi-label-row">
              <span className="servers-kpi-label">Offline Servers</span>
              <span className="servers-kpi-percentage text-rose-400">{offlinePct}%</span>
            </div>
            <div className="servers-kpi-val">{offlineCount}</div>
            <div className="servers-kpi-bar">
              <div className="servers-kpi-fill red" style={{ width: `${offlinePct}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── TOOLBAR / SEARCH / STATUS FILTER ──────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3 rounded-2xl bg-black border border-[#1f1f1f]">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Hostname, Display Name, IP, or Environment..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="healthy">Healthy</option>
            <option value="pending">Pending</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* ── SERVERS TABLE ─────────────────────────────────── */}
      <div className="rounded-2xl bg-black border border-[#1f1f1f] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#1f1f1f] text-slate-400 bg-[#0a0a0a] select-none">
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  <button type="button" onClick={() => toggleSort('displayName')} className="flex items-center gap-1">
                    DISPLAY NAME {getSortIcon('displayName')}
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  <button type="button" onClick={() => toggleSort('hostname')} className="flex items-center gap-1">
                    HOSTNAME {getSortIcon('hostname')}
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  <button type="button" onClick={() => toggleSort('status')} className="flex items-center gap-1">
                    STATUS {getSortIcon('status')}
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  <button type="button" onClick={() => toggleSort('cpu')} className="flex items-center gap-1">
                    CPU % {getSortIcon('cpu')}
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  <button type="button" onClick={() => toggleSort('ram')} className="flex items-center gap-1">
                    RAM % {getSortIcon('ram')}
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  <button type="button" onClick={() => toggleSort('disk')} className="flex items-center gap-1">
                    DISK % {getSortIcon('disk')}
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  NETWORK
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  <button type="button" onClick={() => toggleSort('uptime')} className="flex items-center gap-1">
                    UPTIME {getSortIcon('uptime')}
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  HEALTH
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  ENVIRONMENT
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  TAILSCALE IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={11} className="py-4 px-4">
                      <div className="h-6 bg-slate-800/40 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredServers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No servers matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredServers.map((server) => {
                  const hostname = server.hostname || server.name || 'Unknown';
                  const displayName = server.displayName || server.name || hostname;
                  const isHealthy = server.status === 'healthy';
                  const tailscaleIp = server.tailscale_ip || server.ip || server.ip_address || '--';
                  const environment = server.environment || 'Production';
                  const networkVal = server.network != null ? `${Math.round(server.network)} KB/s` : '--';

                  return (
                    <tr
                      key={server.id || hostname}
                      onClick={() => navigate('/monitoring')}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Display Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <WindowsIcon />
                          <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {displayName}
                          </span>
                        </div>
                      </td>

                      {/* Hostname */}
                      <td className="py-3.5 px-4 font-mono text-slate-300 text-xs">
                        {hostname}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={server.status} />
                      </td>

                      {/* CPU % */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <MetricProgressBar
                          value={server.cpu}
                          metricType="cpu"
                          isOffline={!isHealthy}
                        />
                      </td>

                      {/* RAM % */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <MetricProgressBar
                          value={server.ram}
                          metricType="ram"
                          isOffline={!isHealthy}
                        />
                      </td>

                      {/* Disk % */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <MetricProgressBar
                          value={server.disk}
                          metricType="disk"
                          isOffline={!isHealthy}
                        />
                      </td>

                      {/* Network */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">
                        {networkVal}
                      </td>

                      {/* Uptime */}
                      <td className="py-3.5 px-4 font-mono text-slate-300 text-xs">
                        {formatUptime(server.uptime)}
                      </td>

                      {/* Health Score */}
                      <td className="py-3.5 px-4">
                        {server.healthScore != null ? (
                          <span
                            className={`font-semibold text-xs px-2 py-0.5 rounded-md border ${
                              server.healthScore >= 80
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : server.healthScore >= 50
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {server.healthScore}/100
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">--</span>
                        )}
                      </td>

                      {/* Environment */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {environment}
                        </span>
                      </td>

                      {/* Tailscale IP */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={(e) => copyIp(tailscaleIp, e)}
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer group/ip"
                          title="Click to copy Tailscale IP"
                        >
                          <span>{tailscaleIp}</span>
                          {copiedIp === tailscaleIp ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} className="opacity-0 group-hover/ip:opacity-100 text-slate-400" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <AddServerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => fetchServers(false)}
        />
      )}
    </motion.div>
  );
};

export default Servers;
