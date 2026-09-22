import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Container as ContainerIcon,
  RefreshCw,
  Play,
  Square,
  RotateCw,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Terminal,
  Activity,
  Wifi,
  WifiOff,
  Clock,
  ExternalLink,
  Layers,
} from 'lucide-react';
import axiosClient, { unwrap } from '../axiosClient';
import { useDashboard } from '../context/DashboardContext';

// Helper to format CPU percentage
const formatCpu = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '--';
  const num = Number(val);
  return `${num.toFixed(2)}%`;
};

// Helper to format Memory usage
const formatMemory = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '--';
  const num = Number(val);
  if (num > 1024 * 1024 * 1024) return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (num > 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  if (num > 1024) return `${(num / 1024).toFixed(0)} KB`;
  return `${num.toFixed(2)}%`;
};

// Helper to format Uptime
const formatUptime = (uptime, status) => {
  if (!uptime && !status) return '--';
  if (uptime && typeof uptime === 'string') {
    if (uptime.toLowerCase().startsWith('up')) return uptime;
    const parsed = Date.parse(uptime);
    if (!isNaN(parsed)) {
      const diffMs = Date.now() - parsed;
      if (diffMs > 0) {
        const mins = Math.floor(diffMs / 60000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${mins % 60}m`;
        return `${mins}m`;
      }
    }
    if (uptime.toLowerCase() === 'running') return 'Active';
    return uptime;
  }
  return status || '--';
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const norm = (status || '').toLowerCase();
  if (norm === 'running') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Running
      </span>
    );
  }
  if (norm === 'restarting') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <RotateCw className="w-3 h-3 animate-spin" />
        Restarting
      </span>
    );
  }
  if (norm === 'paused') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
        Paused
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
      {status || 'Stopped'}
    </span>
  );
};

// Health Badge Component
const HealthBadge = ({ status }) => {
  const isRunning = (status || '').toLowerCase() === 'running';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
        isRunning
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-slate-800 text-slate-400 border-slate-700'
      }`}
    >
      {isRunning ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-500" />}
      <span>{isRunning ? 'Healthy' : 'Unhealthy'}</span>
    </span>
  );
};

const DockerPage = () => {
  const { selectedServer } = useDashboard();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [dockerEngineHealthy, setDockerEngineHealthy] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Logs modal state
  const [logsModal, setLogsModal] = useState({ open: false, containerId: null, name: null });
  const [logsContent, setLogsContent] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState(null);
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

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadContainers = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        // System health check for Docker Engine status
        axiosClient
          .get('/system/health')
          .then((hRes) => {
            if (!isMountedRef.current) return;
            const hData = unwrap(hRes) || {};
            if (hData.docker) {
              setDockerEngineHealthy(!!hData.docker.healthy);
            }
          })
          .catch(() => {});

        // Fetch container list
        const response = await axiosClient.get('/docker/containers');
        const data = unwrap(response) || [];

        if (!isMountedRef.current) return;
        setContainers(Array.isArray(data) ? data : []);
        setLastRefreshed(new Date());
      } catch (err) {
        if (!isMountedRef.current) return;
        const msg = err.response?.data?.message || err.message || 'Unable to load Docker containers';
        setError(msg);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [selectedServer?.id]
  );

  // 15-second polling timer
  useEffect(() => {
    isMountedRef.current = true;
    loadContainers(true);

    const interval = setInterval(() => {
      loadContainers(false);
    }, 15000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadContainers]);

  // Container Action: Start / Stop / Restart
  const handleAction = async (verb, containerId, containerName) => {
    setActionLoading((prev) => ({ ...prev, [containerId]: verb }));
    try {
      await axiosClient.post(`/docker/${verb}/${containerId}`);
      showToast(`Container "${containerName || containerId}" ${verb}ed successfully.`, 'success');
      await loadContainers(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || `Failed to ${verb} container.`;
      showToast(msg, 'error');
    } finally {
      if (isMountedRef.current) {
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[containerId];
          return next;
        });
      }
    }
  };

  // Open Container Logs
  const openLogs = async (containerId, containerName) => {
    setLogsModal({ open: true, containerId, name: containerName });
    setLogsLoading(true);
    setLogsContent('');
    try {
      const res = await axiosClient.get(`/docker/logs/${containerId}`);
      const payload = unwrap(res);
      setLogsContent(typeof payload === 'string' ? payload : payload?.logs || 'No log output captured.');
    } catch {
      setLogsContent('Failed to retrieve logs for container.');
    } finally {
      setLogsLoading(false);
    }
  };

  const runningCount = containers.filter((c) => (c.status || '').toLowerCase() === 'running').length;
  const stoppedCount = containers.length - runningCount;

  return (
    <div className="space-y-6 w-full max-w-full text-slate-100">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <WifiOff className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div className="flex-1 text-sm font-medium">
            Internet connection lost. Container actions will resume once connected.
          </div>
        </div>
      )}

      {/* Header & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ContainerIcon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Docker Containers</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Daemon Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Live container health, resource utilization, and lifecycle management.
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
              dockerEngineHealthy
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{dockerEngineHealthy ? 'Docker Healthy' : 'Docker Error'}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 bg-slate-900 border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{lastRefreshed ? lastRefreshed.toLocaleTimeString() : 'Syncing...'}</span>
          </div>

          <button
            type="button"
            onClick={() => loadContainers(false)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh containers list"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl text-sm flex items-center gap-2 shadow-lg border ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Error Banner with Retry */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadContainers(true)}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-black border border-[#1f1f1f] shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Containers</span>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-1">{containers.length}</div>
          <p className="text-xs text-slate-400">Services discovered across cluster</p>
        </div>

        <div className="p-5 rounded-2xl bg-black border border-[#1f1f1f] shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Running Services</span>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-1">{runningCount}</div>
          <p className="text-xs text-slate-400">Operational and accepting requests</p>
        </div>

        <div className="p-5 rounded-2xl bg-black border border-[#1f1f1f] shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stopped / Idle</span>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-1">{stoppedCount}</div>
          <p className="text-xs text-slate-400">Exited or stopped containers</p>
        </div>
      </section>

      {/* Containers Table */}
      <div className="rounded-2xl bg-black border border-[#1f1f1f] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#1f1f1f] text-slate-400 bg-[#0a0a0a] select-none">
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">CONTAINER NAME</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">STATUS</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">CPU</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">MEMORY</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">PORTS</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">IMAGE</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">HEALTH</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4">
                      <div className="h-6 bg-slate-800/40 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : containers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No Docker containers reported by daemon.
                  </td>
                </tr>
              ) : (
                containers.map((c) => {
                  const isRunning = (c.status || '').toLowerCase() === 'running';
                  const isActing = Boolean(actionLoading[c.id]);

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{c.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{c.id}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
                      </td>

                      {/* CPU */}
                      <td className="py-3.5 px-4 font-mono font-medium">
                        {formatCpu(c.cpu)}
                      </td>

                      {/* Memory */}
                      <td className="py-3.5 px-4 font-mono font-medium">
                        {formatMemory(c.memory)}
                      </td>

                      {/* Ports */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300 max-w-[140px] truncate" title={c.ports}>
                        {c.ports || '--'}
                      </td>

                      {/* Image */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400 max-w-[160px] truncate" title={c.image}>
                        {c.image || '--'}
                      </td>

                      {/* Health */}
                      <td className="py-3.5 px-4">
                        <HealthBadge status={c.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {isRunning ? (
                            <button
                              type="button"
                              onClick={() => handleAction('stop', c.id, c.name)}
                              disabled={isActing}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer disabled:opacity-40"
                              title="Stop Container"
                            >
                              <Square size={13} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAction('start', c.id, c.name)}
                              disabled={isActing}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors cursor-pointer disabled:opacity-40"
                              title="Start Container"
                            >
                              <Play size={13} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleAction('restart', c.id, c.name)}
                            disabled={isActing}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors cursor-pointer disabled:opacity-40"
                            title="Restart Container"
                          >
                            <RotateCw size={13} className={isActing ? 'animate-spin' : ''} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openLogs(c.id, c.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                            title="View Container Logs"
                          >
                            <FileText size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs Modal */}
      {logsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-black border border-[#1f1f1f] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-2">
                <Terminal size={18} className="text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">
                  Logs: {logsModal.name} <span className="font-mono text-slate-400 text-xs">({logsModal.containerId})</span>
                </h3>
              </div>
              <button
                onClick={() => setLogsModal({ open: false, containerId: null, name: null })}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {logsLoading ? (
                <div className="text-slate-500 animate-pulse">Streaming container logs...</div>
              ) : (
                logsContent || 'No output recorded.'
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DockerPage;
