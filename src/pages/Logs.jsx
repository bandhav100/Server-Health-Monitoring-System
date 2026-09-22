import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  Box,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  FileText,
  RefreshCw,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  User,
  UserRoundCheck,
  XCircle,
  DoorOpen,
  CheckCircle2,
  Wifi,
  WifiOff,
  Filter,
  Layers,
  RotateCcw,
} from 'lucide-react';
import axiosClient, { unwrap } from '../axiosClient';
import './Logs.css';

const PAGE_SIZE = 25;
const REFRESH_MS = 15000;

const severityColors = {
  SUCCESS: '#10b981',
  INFO: '#3b82f6',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  CRITICAL: '#dc2626',
};

const asText = (value) => (value == null ? '' : String(value));
const normalized = (value) => asText(value).toLowerCase();

const getSeverity = (log) => {
  const text = normalized(`${log.action} ${log.details}`);
  if (/critical|fatal/.test(text)) return 'CRITICAL';
  if (/error|exception|failed|failure|down|offline/.test(text)) return 'ERROR';
  if (/warn|warning|degraded|threshold/.test(text)) return 'WARNING';
  if (/success|successful|login|authenticated|created|updated|completed/.test(text)) return 'SUCCESS';
  return 'INFO';
};

const getModule = (log) => {
  const text = normalized(`${log.action} ${log.details}`);
  if (text.includes('docker') || text.includes('container')) return 'Docker';
  if (text.includes('predict') || text.includes('ml')) return 'Predictions';
  if (text.includes('alert')) return 'Alerts';
  if (text.includes('server') || text.includes('monitor') || text.includes('prom')) return 'Monitoring';
  if (text.includes('setting') || text.includes('profile')) return 'Settings';
  if (text.includes('login') || text.includes('logout') || text.includes('auth')) return 'Authentication';
  return 'System';
};

const getStatus = (severity) => (['ERROR', 'CRITICAL'].includes(severity) ? 'Failed' : 'Completed');

const getActionIcon = (action) => {
  const text = normalized(action);
  if (text.includes('login')) return User;
  if (text.includes('logout')) return DoorOpen;
  if (text.includes('alert')) return Bell;
  if (text.includes('server') || text.includes('down')) return Server;
  if (text.includes('predict') || text.includes('retrain')) return CircleAlert;
  if (text.includes('docker') || text.includes('container')) return Box;
  if (text.includes('setting')) return Settings2;
  return FileText;
};

const parseDate = (log) => new Date(log.created_at || log.timestamp || Date.now());
const formatDate = (date) => {
  if (!date || isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const formatTime = (date) => {
  if (!date || isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const SeverityBadge = ({ severity }) => {
  switch (severity) {
    case 'CRITICAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-600/20 text-red-400 border border-red-500/30 shadow-xs">
          <AlertTriangle size={11} className="flex-shrink-0" />
          <span>CRITICAL</span>
        </span>
      );
    case 'ERROR':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-xs">
          <XCircle size={11} className="flex-shrink-0" />
          <span>ERROR</span>
        </span>
      );
    case 'WARNING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-xs">
          <AlertTriangle size={11} className="flex-shrink-0" />
          <span>WARNING</span>
        </span>
      );
    case 'SUCCESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
          <CheckCircle2 size={11} className="flex-shrink-0" />
          <span>SUCCESS</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-xs">
          <CircleAlert size={11} className="flex-shrink-0" />
          <span>INFO</span>
        </span>
      );
  }
};

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    actor: '',
    action: '',
    severity: '',
    dateFrom: '',
    dateTo: '',
  });
  const [page, setPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const isMountedRef = useRef(true);

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

  const loadLogs = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await axiosClient.get('/logs', { params: { days: 30, limit: 1000 } });
      const data = unwrap(response);
      if (!isMountedRef.current) return;
      setLogs(data?.logs || (Array.isArray(data) ? data : []));
      setLastRefresh(new Date());
      setConnected(true);
    } catch {
      if (!isMountedRef.current) return;
      setConnected(false);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadLogs(true);

    const timer = setInterval(() => {
      loadLogs(false);
    }, REFRESH_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
    };
  }, [loadLogs]);

  const decorate = (log) => ({ ...log, severity: getSeverity(log), module: getModule(log) });
  const enrichedLogs = useMemo(() => logs.map(decorate), [logs]);

  const filteredLogs = useMemo(() => {
    return enrichedLogs.filter((log) => {
      const date = parseDate(log);
      const searchText = normalized(`${log.actor} ${log.action} ${log.details} ${log.module}`);
      return (
        (!filters.search || searchText.includes(normalized(filters.search))) &&
        (!filters.actor || normalized(log.actor).includes(normalized(filters.actor))) &&
        (!filters.action || normalized(log.action).includes(normalized(filters.action))) &&
        (!filters.severity || log.severity === filters.severity) &&
        (!filters.dateFrom || date.toISOString().slice(0, 10) >= filters.dateFrom) &&
        (!filters.dateTo || date.toISOString().slice(0, 10) <= filters.dateTo)
      );
    });
  }, [enrichedLogs, filters]);

  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const visibleLogs = useMemo(() => {
    return filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredLogs, page]);

  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = enrichedLogs.filter((log) => parseDate(log).toISOString().slice(0, 10) === today);

  const countBy = (predicate) => enrichedLogs.filter(predicate).length;
  const successfulLogins = countBy((log) => normalized(log.action).includes('login') && log.severity === 'SUCCESS');
  const failedLogins = countBy((log) => normalized(log.action).includes('login') && log.severity === 'ERROR');
  const errorEvents = countBy((log) => ['ERROR', 'CRITICAL'].includes(log.severity));
  const warningEvents = countBy((log) => log.severity === 'WARNING');

  const distribution = useMemo(() => {
    return ['SUCCESS', 'INFO', 'WARNING', 'ERROR'].map((severity) => ({
      severity,
      count: countBy((log) => log.severity === severity),
    }));
  }, [enrichedLogs]);

  const donutTotal = distribution.reduce((tot, item) => tot + item.count, 0);
  const donutStyle = distribution
    .reduce((res, item, idx) => {
      const start =
        (distribution.slice(0, idx).reduce((t, e) => t + e.count, 0) / Math.max(1, donutTotal)) * 100;
      const end = start + (item.count / Math.max(1, donutTotal)) * 100;
      return `${res}${severityColors[item.severity]} ${start}% ${end}%, `;
    }, '')
    .slice(0, -2);

  const actionMap = enrichedLogs.reduce((res, log) => {
    res[log.action] = (res[log.action] || 0) + 1;
    return res;
  }, {});
  const maxActionCount = Math.max(1, ...Object.values(actionMap));
  const topActionCounts = Object.entries(actionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const download = async (format) => {
    try {
      const response = await axiosClient.get(`/logs/download/${format}`);
      const data = unwrap(response);
      const content = format === 'csv' ? data?.csv || data : JSON.stringify(data, null, 2);
      const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `shms-logs.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert(`Unable to download logs in ${format.toUpperCase()} format.`);
    }
  };

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      actor: '',
      action: '',
      severity: '',
      dateFrom: '',
      dateTo: '',
    });
    setPage(1);
  };

  return (
    <motion.div
      className="logs-container space-y-6 w-full max-w-full text-slate-100"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Offline Banner */}
      {!isOnline && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <WifiOff className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div className="flex-1 text-sm font-medium">
            Internet connection lost. Log sync is paused until connectivity is restored.
          </div>
        </div>
      )}

      {/* ── HEADER ────────────────────────────────────────── */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm">
            <FileText size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Audit Logs</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                15s Live Sync
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              System security events, user authentications, and automated operations.
            </p>
          </div>
        </div>

        {/* Quick Stats Badges & Status in Header */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="font-bold text-white">{todayLogs.length}</span>
            <span className="text-slate-400">Total logs today</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="font-bold text-emerald-400">{successfulLogins}</span>
            <span className="text-slate-400">Logins</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="font-bold text-amber-400">{warningEvents}</span>
            <span className="text-slate-400">Warnings</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="font-bold text-rose-400">{errorEvents}</span>
            <span className="text-slate-400">Errors</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <Clock3 size={13} className="text-slate-500" />
            <span>{lastRefresh ? lastRefresh.toLocaleTimeString() : 'Syncing...'}</span>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
              connected && isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {connected && isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{connected && isOnline ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
      </header>

      {/* ── KPI METRIC CARDS ──────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Logs */}
        <div className="p-5 rounded-2xl bg-black border border-[#1f1f1f] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Logs</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{enrichedLogs.length}</div>
          <p className="text-xs text-slate-400">Recorded events in current buffer</p>
        </div>

        {/* Successful Logins */}
        <div className="p-5 rounded-2xl bg-black border border-[#1f1f1f] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Successful Logins</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserRoundCheck size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{successfulLogins}</div>
          <p className="text-xs text-slate-400">Authenticated user sessions</p>
        </div>

        {/* Failed Logins */}
        <div className="p-5 rounded-2xl bg-black border border-[#1f1f1f] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Failed Logins</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <XCircle size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{failedLogins}</div>
          <p className="text-xs text-slate-400">Rejected authentication attempts</p>
        </div>

        {/* Error Events */}
        <div className="p-5 rounded-2xl bg-black border border-[#1f1f1f] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Error Events</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{errorEvents}</div>
          <p className="text-xs text-slate-400">Critical & warning anomalies</p>
        </div>
      </section>

      {/* ── TOOLBAR / FILTERS / ACTIONS ────────────────────── */}
      <section className="p-4 rounded-2xl bg-black border border-[#1f1f1f] shadow-lg flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search logs by actor, action, details, module..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Actor Select */}
          <select
            value={filters.actor}
            onChange={(e) => updateFilter('actor', e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">All Actors</option>
            {[...new Set(logs.map((log) => log.actor).filter(Boolean))].map((actor) => (
              <option key={actor} value={actor}>
                {actor}
              </option>
            ))}
          </select>

          {/* Action Select */}
          <select
            value={filters.action}
            onChange={(e) => updateFilter('action', e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">All Actions</option>
            {[...new Set(logs.map((log) => log.action).filter(Boolean))].map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>

          {/* Severity Select */}
          <select
            value={filters.severity}
            onChange={(e) => updateFilter('severity', e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">All Severity</option>
            <option value="CRITICAL">Critical</option>
            <option value="ERROR">Error</option>
            <option value="WARNING">Warning</option>
            <option value="SUCCESS">Success</option>
            <option value="INFO">Info</option>
          </select>
        </div>

        {/* Date Ranges & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300">
              <CalendarDays size={13} className="text-slate-500" />
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
              />
            </div>
            <span className="text-slate-500 text-xs">to</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300">
              <CalendarDays size={13} className="text-slate-500" />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
              />
            </div>

            {(filters.search || filters.actor || filters.action || filters.severity || filters.dateFrom || filters.dateTo) && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadLogs(false)}
              disabled={loading || refreshing}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh logs"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={() => download('csv')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-medium cursor-pointer"
            >
              <Download size={13} />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={() => download('json')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-medium cursor-pointer"
            >
              <Download size={13} />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── AUDIT EVENTS TABLE CARD ────────────────────────── */}
      <section className="rounded-2xl bg-black border border-[#1f1f1f] shadow-xl overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#1f1f1f]">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Audit Events</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredLogs.length} matching events across all monitored nodes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              Page {page} of {pageCount}
            </span>
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#1f1f1f] text-slate-400 bg-[#0a0a0a] select-none">
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] logs-table-cell-time">
                  TIME
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] logs-table-cell-severity">
                  SEVERITY
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] logs-table-cell-actor">
                  ACTOR
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] logs-table-cell-action">
                  ACTION
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] logs-table-cell-module">
                  MODULE
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] logs-table-cell-details">
                  DETAILS
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] logs-table-cell-status">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-6 bg-slate-800/40 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : visibleLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No logs found matching current search or filters.
                  </td>
                </tr>
              ) : (
                visibleLogs.map((log) => {
                  const date = parseDate(log);
                  const Icon = getActionIcon(log.action);
                  const isFailed = log.severity === 'ERROR' || log.severity === 'CRITICAL';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* TIME */}
                      <td className="py-3.5 px-4 logs-table-cell-time">
                        <div className="flex flex-col">
                          <span className="text-white font-medium text-xs tracking-tight">{formatDate(date)}</span>
                          <span className="text-slate-400 font-mono text-[11px] mt-0.5">{formatTime(date)}</span>
                        </div>
                      </td>

                      {/* SEVERITY */}
                      <td className="py-3.5 px-4 logs-table-cell-severity">
                        <SeverityBadge severity={log.severity} />
                      </td>

                      {/* ACTOR */}
                      <td className="py-3.5 px-4 logs-table-cell-actor">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                            <User size={12} />
                          </div>
                          <span
                            className="font-semibold text-white text-xs truncate max-w-[120px]"
                            title={log.actor || 'System'}
                          >
                            {log.actor || 'System'}
                          </span>
                        </div>
                      </td>

                      {/* ACTION */}
                      <td className="py-3.5 px-4 logs-table-cell-action">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700/80 text-xs font-mono font-medium">
                          <Icon size={12} className="text-cyan-400 flex-shrink-0" />
                          <span className="truncate">{log.action || 'event'}</span>
                        </span>
                      </td>

                      {/* MODULE */}
                      <td className="py-3.5 px-4 logs-table-cell-module">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/90 text-slate-300 border border-slate-700/70">
                          {log.module}
                        </span>
                      </td>

                      {/* DETAILS */}
                      <td className="py-3.5 px-4 logs-table-cell-details">
                        <div
                          className="text-xs text-slate-300 truncate font-sans leading-relaxed"
                          title={asText(log.details)}
                        >
                          {log.details || 'No details recorded'}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-3.5 px-4 logs-table-cell-status">
                        {isFailed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>Failed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Completed</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing{' '}
            <span className="font-semibold text-white">
              {filteredLogs.length ? (page - 1) * PAGE_SIZE + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-white">
              {Math.min(page * PAGE_SIZE, filteredLogs.length)}
            </span>{' '}
            of <span className="font-semibold text-white">{filteredLogs.length}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((c) => Math.max(1, c - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1 rounded-xl bg-slate-800 text-white font-medium">
              {page} / {pageCount}
            </span>

            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage((c) => Math.min(pageCount, c + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── LOWER ANALYTICS & INSIGHTS CARDS ───────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution Donut Card */}
        <div className="rounded-2xl bg-black border border-[#1f1f1f] p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Severity Breakdown</h2>
              <p className="text-xs text-slate-400 mt-0.5">Distribution across recorded audit events</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">{donutTotal} total</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
            {/* Donut graphic */}
            <div
              className="logs-donut-wrap"
              style={{ background: `conic-gradient(${donutStyle || '#334155 0 100%'})` }}
            >
              <div className="logs-donut-inner">
                <span className="text-xl font-bold text-white">{donutTotal}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Events</span>
              </div>
            </div>

            {/* Legend list */}
            <div className="flex-1 w-full space-y-2.5">
              {distribution.map((item) => {
                const pct = donutTotal ? Math.round((item.count / donutTotal) * 100) : 0;
                return (
                  <div key={item.severity} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: severityColors[item.severity] }}
                      />
                      <span className="text-slate-300 font-medium">{item.severity}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">{item.count}</span>
                      <span className="text-slate-500 text-[11px] w-8 text-right font-mono">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Actions Frequency Card */}
        <div className="rounded-2xl bg-black border border-[#1f1f1f] p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Top Log Actions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Most frequent system & user actions</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Ranked</span>
          </div>

          <div className="space-y-3">
            {topActionCounts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No action frequency data available.</p>
            ) : (
              topActionCounts.map(([action, count]) => {
                const pct = Math.round((count / maxActionCount) * 100);
                return (
                  <div key={action} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-300 font-medium">{action}</span>
                      <span className="font-semibold text-white font-mono">{count}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default Logs;
