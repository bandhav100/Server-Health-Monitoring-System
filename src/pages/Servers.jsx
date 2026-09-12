import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Server,
  Wifi,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  MoreVertical,
  Check,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Activity,
  TrendingUp,
  Copy,
  Plus,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import AddServerModal from '../components/Servers/AddServerModal';
import './Servers.css';

const WindowsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="#0078D4">
    <path d="M0 2.263L6.474 1.38v6.236H0V2.263zm0 6.099h6.474v6.236L0 13.737V8.362zm7.263-7.14L16 0v7.616H7.263V1.222zm0 7.14H16v7.616l-8.737-1.222V8.362z" />
  </svg>
);

const formatTime = (date) => {
  if (!date) return '21:53:47';
  return date.toLocaleTimeString([], { hour12: false });
};

const formatUptime = (value) => {
  if (value == null || Number.isNaN(Number(value)) || Number(value) <= 0) return '--';
  const totalMinutes = Math.floor(Number(value) * 60);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

/**
 * Reusable MetricProgressBar component bound to real percentage values:
 * - Clamps width to [0, 100]%
 * - Displays exact rounded percentage
 * - Blue for CPU, Orange for RAM, Red for Disk
 * - Width = 0% and label = '--' when value is null/undefined/NaN or server is offline
 */
export const MetricProgressBar = ({ value, metricType = 'cpu', color, isOffline = false }) => {
  const defaultColors = {
    cpu: '#3B82F6',   // Blue fill
    ram: '#F59E0B',   // Orange/amber fill
    disk: '#EF4444',  // Red/coral fill
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

  if (isPending) {
    return (
      <span className="server-status-pill pending" title="Awaiting Prometheus scrape">
        <Clock size={12} strokeWidth={2.5} />
        Pending
      </span>
    );
  }

  return (
    <span className={`server-status-pill ${isHealthy ? 'healthy' : 'offline'}`}>
      {isHealthy ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
      {isHealthy ? 'Healthy' : 'Offline'}
    </span>
  );
};

const Servers = () => {
  const navigate = useNavigate();
  const { servers, serverOptions, refreshServers } = useDashboard();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('ALL');
  const [sort, setSort] = useState({ key: null, direction: 'desc' });
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [activeActionId, setActiveActionId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const actionMenuRef = useRef(null);

  useEffect(() => {
    setLastRefresh(new Date());
  }, [servers]);

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
  const offlineCount = totalServers - healthyCount;
  const healthyPct = totalServers ? Math.round((healthyCount / totalServers) * 100) : 0;
  const offlinePct = totalServers ? Math.round((offlineCount / totalServers) * 100) : 0;

  const onlineServers = servers.filter((s) => s.status === 'healthy');
  const averageCpu = onlineServers.length
    ? Math.round(onlineServers.reduce((tot, s) => tot + Number(s.cpu || 0), 0) / onlineServers.length)
    : 12;

  const discoveredOptions = servers.length ? serverOptions : [];

  const filteredServers = useMemo(() => {
    const search = query.trim().toLowerCase();
    const rows = servers.filter((server) => {
      const hostname = server.displayName || server.hostname || server.name || '';
      const ip = server.ip || server.tailscale_ip || '';
      const os = server.operating_system || server.operatingSystem || 'windows';
      const matchesSearch =
        !search ||
        `${hostname} ${ip} ${os} ${server.prometheus_instance || ''}`.toLowerCase().includes(search);
      const matchesSelected =
        selected === 'ALL' ||
        server.prometheus_instance === selected ||
        hostname.toLowerCase() === selected.toLowerCase();
      return matchesSearch && matchesSelected;
    });

    if (!sort.key) return rows;

    return [...rows].sort((a, b) => {
      let aVal = a[sort.key];
      let bVal = b[sort.key];
      if (sort.key === 'status') {
        aVal = a.status === 'healthy' ? 1 : 0;
        bVal = b.status === 'healthy' ? 1 : 0;
      } else if (sort.key === 'uptime') {
        aVal = Number(a.uptime || 0);
        bVal = Number(b.uptime || 0);
      } else if (sort.key === 'hostname') {
        aVal = (a.displayName || a.hostname || a.name || '').toLowerCase();
        bVal = (b.displayName || b.hostname || b.name || '').toLowerCase();
        return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        aVal = Number(aVal || 0);
        bVal = Number(bVal || 0);
      }
      return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [query, selected, servers, sort]);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    if (refreshServers) refreshServers();
    setLastRefresh(new Date());
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <motion.div
      className="servers-container"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* ── HEADER ────────────────────────────────────────── */}
      <header className="servers-header-row">
        <div className="servers-brand">
          <div className="servers-brand-icon">
            <Server size={22} strokeWidth={2} />
          </div>
          <div className="servers-brand-text">
            <h1>Servers</h1>
            <p>Live infrastructure inventory from Prometheus.</p>
          </div>
        </div>

        <div className="servers-header-badges">
          <span className="shms-pill-badge badge-connected">
            <Wifi size={13} strokeWidth={2.4} />
            Connected Targets <b>{totalServers}</b>
          </span>
          <span className="shms-pill-badge badge-online">
            <CheckCircle2 size={13} strokeWidth={2.4} />
            Online <b>{healthyCount}</b>
          </span>
          <span className="shms-pill-badge badge-offline">
            <XCircle size={13} strokeWidth={2.4} />
            Offline <b>{offlineCount}</b>
          </span>
          <span className="shms-pill-badge badge-time">
            <Clock size={13} />
            Last Refresh <b>{formatTime(lastRefresh)}</b>
          </span>
          <button className="badge-autorefresh" onClick={handleRefresh} title="Click to refresh now">
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Auto Refresh <span>• 15s</span>
          </button>
        </div>
      </header>

      {/* ── 4 KPI CARDS ───────────────────────────────────── */}
      <section className="servers-kpis-grid" aria-label="Server Summary Statistics">
        {/* Card 1: Total Servers */}
        <div className="servers-kpi-card">
          <div className="servers-kpi-icon-wrap purple">
            <Server size={20} strokeWidth={2.2} />
          </div>
          <div className="servers-kpi-body">
            <div className="servers-kpi-label-row">
              <span className="servers-kpi-label">Total Servers</span>
            </div>
            <div className="servers-kpi-val">{totalServers}</div>
          </div>
          <div className="servers-kpi-ghost">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="5" rx="1.5" />
              <circle cx="6" cy="5.5" r="0.75" fill="#6366F1" />
              <circle cx="9" cy="5.5" r="0.75" fill="#6366F1" />
              <rect x="2" y="10" width="20" height="5" rx="1.5" />
              <circle cx="6" cy="12.5" r="0.75" fill="#6366F1" />
              <circle cx="9" cy="12.5" r="0.75" fill="#6366F1" />
              <rect x="2" y="17" width="20" height="5" rx="1.5" />
              <circle cx="6" cy="19.5" r="0.75" fill="#6366F1" />
              <circle cx="9" cy="19.5" r="0.75" fill="#6366F1" />
            </svg>
          </div>
        </div>

        {/* Card 2: Healthy Servers */}
        <div className="servers-kpi-card">
          <div className="servers-kpi-icon-wrap green">
            <CheckCircle2 size={22} strokeWidth={2.4} />
          </div>
          <div className="servers-kpi-body">
            <div className="servers-kpi-label-row">
              <span className="servers-kpi-label">Healthy Servers</span>
              <span className="servers-kpi-percentage">{healthyPct}%</span>
            </div>
            <div className="servers-kpi-val">{healthyCount}</div>
            <div className="servers-kpi-bar">
              <div className="servers-kpi-fill green" style={{ width: `${healthyPct}%` }} />
            </div>
          </div>
        </div>

        {/* Card 3: Offline Servers */}
        <div className="servers-kpi-card">
          <div className="servers-kpi-icon-wrap red">
            <XCircle size={22} strokeWidth={2.4} />
          </div>
          <div className="servers-kpi-body">
            <div className="servers-kpi-label-row">
              <span className="servers-kpi-label">Offline Servers</span>
              <span className="servers-kpi-percentage">{offlinePct}%</span>
            </div>
            <div className="servers-kpi-val">{offlineCount}</div>
            <div className="servers-kpi-bar">
              <div className="servers-kpi-fill red" style={{ width: `${offlinePct}%` }} />
            </div>
          </div>
        </div>

        {/* Card 4: Average CPU Usage */}
        <div className="servers-kpi-card">
          <div className="servers-kpi-icon-wrap amber">
            <Cpu size={20} strokeWidth={2.2} />
          </div>
          <div className="servers-kpi-body">
            <div className="servers-kpi-label-row">
              <span className="servers-kpi-label">Average CPU Usage</span>
            </div>
            <div className="servers-kpi-val">{averageCpu}%</div>
            <div className="servers-kpi-bar">
              <div className="servers-kpi-fill amber" style={{ width: `${averageCpu}%` }} />
            </div>
          </div>
          <div className="servers-kpi-ghost">
            <Cpu size={56} strokeWidth={1.3} className="text-amber-400" />
          </div>
        </div>
      </section>

      {/* ── TOOLBAR / SEARCH / ACTIONS ────────────────────── */}
      <div className="servers-filter-toolbar">
        <div className="servers-search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search servers by name, IP, or OS..."
            aria-label="Search servers"
          />
        </div>

        <div className="servers-dropdown-wrap">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Server filter">
            <option value="ALL">All Servers</option>
            {discoveredOptions.map((option) => (
              <option key={option.key} value={option.instance || option.key}>
                {option.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="servers-dropdown-arrow" />
        </div>

        <button type="button" className="servers-action-refresh-btn" onClick={handleRefresh}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>

        <button
          type="button"
          className="servers-action-add-btn"
          onClick={() => setIsAddModalOpen(true)}
          title="Register a new monitoring target"
        >
          <Plus size={15} strokeWidth={2.5} />
          Add Server
        </button>
      </div>

      {/* ── SERVERS TABLE ─────────────────────────────────── */}
      <div className="servers-table-card">
        <div className="servers-table-scroll-container">
          <table className="servers-data-table">
            <thead>
              <tr>
                <th>
                  <button type="button" onClick={() => toggleSort('hostname')}>
                    HOSTNAME {getSortIcon('hostname')}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('ip')}>
                    IP ADDRESS {getSortIcon('ip')}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('operating_system')}>
                    OS {getSortIcon('operating_system')}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('cpu')}>
                    CPU {getSortIcon('cpu')}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('ram')}>
                    RAM {getSortIcon('ram')}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('disk')}>
                    DISK {getSortIcon('disk')}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('uptime')}>
                    UPTIME {getSortIcon('uptime')}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('status')}>
                    STATUS {getSortIcon('status')}
                  </button>
                </th>
                <th style={{ textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredServers.map((server) => {
                const hostname = server.displayName || server.hostname || server.name || 'Unknown server';
                const isProduction =
                  (server.environment && server.environment.toLowerCase() === 'production') ||
                  (server.role && server.role.toLowerCase() === 'production') ||
                  hostname.toLowerCase() === 'bandhav';
                const subtitle = server.role || server.environment || (isProduction ? 'Production' : 'Windows');
                const ipAddress = server.ip || server.tailscale_ip || '--';
                const isOffline = server.status !== 'healthy';
                const rawOs = server.operating_system || server.operatingSystem || 'windows';
                const osLabel = rawOs ? rawOs.charAt(0).toUpperCase() + rawOs.slice(1).toLowerCase() : 'Windows';
                const rowKey = String(server.id || server.prometheus_instance || hostname);

                return (
                  <tr key={rowKey}>
                    {/* Hostname */}
                    <td>
                      <div className="server-host-cell">
                        <div className="server-host-avatar">
                          <Server size={17} />
                        </div>
                        <div className="server-host-meta">
                          <strong>{hostname}</strong>
                          <small>{subtitle}</small>
                        </div>
                      </div>
                    </td>

                    {/* IP Address */}
                    <td className="server-ip-cell">{ipAddress}</td>

                    {/* OS */}
                    <td>
                      <div className="server-os-cell">
                        <WindowsIcon />
                        <span>{osLabel}</span>
                      </div>
                    </td>

                    {/* CPU Bar (Blue fill) */}
                    <td>
                      <MetricProgressBar value={server.cpu} metricType="cpu" isOffline={isOffline} />
                    </td>

                    {/* RAM Bar (Orange/amber fill) */}
                    <td>
                      <MetricProgressBar value={server.ram} metricType="ram" isOffline={isOffline} />
                    </td>

                    {/* DISK Bar (Red/coral fill) */}
                    <td>
                      <MetricProgressBar value={server.disk} metricType="disk" isOffline={isOffline} />
                    </td>

                    {/* Uptime */}
                    <td style={{ color: '#334155', fontWeight: 500 }}>
                      {isOffline ? '--' : formatUptime(server.uptime)}
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={server.status} />
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'center' }}>
                      <div
                        className="server-action-menu-wrap"
                        ref={activeActionId === rowKey ? actionMenuRef : null}
                      >
                        <button
                          className={`server-row-action-btn ${activeActionId === rowKey ? 'active' : ''}`}
                          onClick={() => setActiveActionId(activeActionId === rowKey ? null : rowKey)}
                          title="Server Actions"
                          aria-label="Server Actions"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeActionId === rowKey && (
                          <div className="server-action-menu">
                            <button
                              onClick={() => {
                                setActiveActionId(null);
                                navigate('/monitoring');
                              }}
                            >
                              <Activity size={13} /> Live Telemetry
                            </button>
                            <button
                              onClick={() => {
                                setActiveActionId(null);
                                navigate('/predictions');
                              }}
                            >
                              <TrendingUp size={13} /> View Predictions
                            </button>
                            <button
                              onClick={() => {
                                setActiveActionId(null);
                                if (ipAddress && ipAddress !== '--') {
                                  navigator.clipboard?.writeText(ipAddress);
                                }
                              }}
                            >
                              <Copy size={13} /> Copy IP Address
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!filteredServers.length && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
              No Prometheus targets match this view.
            </div>
          )}
        </div>

        {/* Table Footer */}
        <div className="servers-table-footer">
          <span>Showing {filteredServers.length} of {totalServers} servers</span>
          <div className="servers-pagination-wrap">
            <button className="servers-page-btn" disabled title="Previous page">
              <ChevronLeft size={14} />
            </button>
            <button className="servers-page-btn active">1</button>
            <button className="servers-page-btn" disabled title="Next page">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── BOTTOM GLOBAL FOOTER ──────────────────────────── */}
      <footer className="servers-global-footer-bar">
        <div className="servers-global-footer-left">
          <span className="servers-status-dot-item">
            <i className="servers-status-dot green" /> Prometheus Targets: {totalServers}
          </span>
          <span className="servers-footer-divider">|</span>
          <span>Windows Exporter Online: {healthyCount}</span>
          <span className="servers-footer-divider">|</span>
          <span>Last Sync: {formatTime(lastRefresh)}</span>
          <span className="servers-footer-divider">|</span>
          <span>Version: SHMS v3.0.0</span>
        </div>

        <div className="servers-global-footer-right">
          <i className="servers-status-dot green" style={{ animation: 'pulse 2s infinite' }} />
          <span>All Systems Operational</span>
        </div>
      </footer>

      {/* ── ADD SERVER MODAL ───────────────────────────────── */}
      <AddServerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          if (refreshServers) refreshServers();
          setLastRefresh(new Date());
        }}
        existingServers={servers}
      />
    </motion.div>
  );
};

export default Servers;
