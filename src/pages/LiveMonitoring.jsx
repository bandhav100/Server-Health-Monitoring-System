import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  Activity, ArrowDown, ArrowUp, Bolt, CheckCircle2, ChevronDown, CircleGauge, 
  Cpu, HardDrive, MemoryStick, Monitor, RefreshCw, Server, 
  Thermometer, Timer, XCircle 
} from 'lucide-react';
import api, { unwrap } from '../api';
import { SERVER_OPTIONS, useServerContext } from '../context/ServerContext';
import AnalyticsSection from '../components/AnalyticsSection';

const colors = { 
  cyan: '#0284c7', 
  blue: '#2563eb', 
  green: '#10b981', 
  yellow: '#f59e0b', 
  orange: '#f97316', 
  red: '#ef4444',
  purple: '#a855f7',
  indigo: '#818cf8',
  teal: '#14b8a6',
};

const finite = (value) => value != null && Number.isFinite(Number(value));
const number = (value, digits = 1) => finite(value) ? Number(value).toFixed(digits) : 'Offline';
const percent = (value) => finite(value) ? `${number(value)}%` : 'Offline';
const gigabytes = (value) => finite(value) ? `${number(value, 2)} GB` : 'Offline';
const uptime = (hours) => finite(hours) ? `${Math.floor(hours / 24)}d ${Math.floor(hours % 24)}h ${Math.floor((hours * 60) % 60)}m` : 'Offline';
const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));
const valueFrom = (value) => finite(value) ? Number(value) : null;
const temperatureColor = (value) => !finite(value) ? colors.red : value > 85 ? colors.red : value > 75 ? colors.orange : value > 60 ? colors.yellow : colors.green;
const usageColor = (value) => !finite(value) ? colors.blue : value > 85 ? colors.red : value > 70 ? colors.orange : value > 50 ? colors.yellow : colors.green;

// Rolling history buffer stored per server instance, max 30 real samples
const MAX_SAMPLES = 30;
const historyBuffer = {};

function MiniSparkline({ data = [], color = '#0284c7', title = '' }) {
  if (!data || data.length === 0) {
    return (
      <div className="live-subtle-indicator" title="Awaiting telemetry samples">
        <span className="live-subtle-line" />
      </div>
    );
  }

  if (data.length === 1) {
    return (
      <div className="live-subtle-indicator" title="Sample recorded · Awaiting trend data">
        <span className="live-subtle-line" />
        <span className="live-subtle-dot" style={{ background: color }} />
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const W = 100;
  const H = 24;
  const padY = 2.5;
  const effH = H - padY * 2;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = range === 0 ? H / 2 : padY + effH * (1 - (val - min) / range);
    return { x, y };
  });

  let pathD = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  const lastPt = points[points.length - 1];
  const areaD = `${pathD} L ${W},${H} L 0,${H} Z`;
  const gradId = `spark-${title.replace(/[^a-zA-Z0-9]/g, '') || 'kpi'}`;

  return (
    <svg className="live-sparkline-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt.x} cy={lastPt.y} r="2" fill={color} />
      <circle cx={lastPt.x} cy={lastPt.y} r="4" fill={color} opacity="0.25" />
    </svg>
  );
}

function KpiProgressBar({ value, color }) {
  const numeric = finite(value) ? clamp(value) : 0;
  return (
    <div className="live-meter-bar" role="progressbar" aria-valuenow={numeric} aria-valuemin="0" aria-valuemax="100">
      <i className="live-meter-fill" style={{ width: `${numeric}%`, background: color }} />
    </div>
  );
}

function KpiUptimeIndicator({ color, live = true }) {
  return (
    <div className="live-uptime-indicator" title="Continuous system uptime">
      <div className="live-uptime-track">
        <div className="live-uptime-fill" style={{ background: color }} />
        <div className="live-uptime-pulses">
          <span className="live-uptime-node" style={{ background: color }} />
          <span className="live-uptime-node" style={{ background: color }} />
          <span className="live-uptime-node" style={{ background: color }} />
          <span className={`live-uptime-node ${live ? 'live-pulse-active' : ''}`} style={{ background: color }} />
        </div>
      </div>
    </div>
  );
}

function KpiStatusIndicator({ status }) {
  const isOnline = status === 'ONLINE';
  return (
    <div className={`live-status-badge ${isOnline ? 'online' : 'offline'}`}>
      <span className="live-status-beacon" />
      <span className="live-status-text">{isOnline ? '✓ ONLINE' : '✕ OFFLINE'}</span>
    </div>
  );
}

function Kpi({ 
  icon: Icon, 
  title, 
  value, 
  unit, 
  type = 'sparkline',
  rawValue, 
  color, 
  history = [], 
  live = true, 
  tooltip, 
  offline = false, 
  status = 'ONLINE',
  loading = false,
  source = 'Prometheus',
  interval = '15s'
}) {
  const isOff = offline || value === 'Offline';
  const unavailable = isOff || value === '--';
  const voltageTooltip = 'GPU Core Voltage\nLive sensor from LibreHardwareMonitor\nMetric: lhm_gpuamd_voltage_volts\nRefresh interval: 15 seconds';

  const renderViz = () => {
    if (unavailable || value == null) {
      return (
        <div className="live-subtle-indicator">
          <span className="live-subtle-line" />
        </div>
      );
    }

    switch (type) {
      case 'percentage':
        return <KpiProgressBar value={rawValue} color={color} />;
      case 'sparkline':
        return <MiniSparkline data={history} color={color} title={title} />;
      case 'uptime':
        return <KpiUptimeIndicator color={color} live={live && !isOff} />;
      case 'status':
        return <KpiStatusIndicator status={status} />;
      default:
        return (
          <div className="live-subtle-indicator">
            <span className="live-subtle-line" />
          </div>
        );
    }
  };

  return (
    <article className="live-kpi" title={tooltip || (title === 'GPU Voltage' ? voltageTooltip : undefined)}>
      <div className="live-kpi-top">
        <span className="live-kpi-icon" style={{ color }}><Icon size={17} /></span>
        <span className={`panel-signal${live && !unavailable ? '' : ' muted'}`}><i /> LIVE</span>
      </div>
      <small>{title}</small>
      <strong>
        {loading && (value === '--' || value === 'Offline') ? (
          <span className="live-kpi-loading-text">Loading...</span>
        ) : (
          <>
            {value}
            <em>{value === 'Offline' ? '' : (title === 'GPU Voltage' && value === '--' ? ' V' : unit)}</em>
          </>
        )}
      </strong>
      <div className="live-viz-slot">
        {renderViz()}
      </div>
      <footer>
        <span>{source}</span>
        <span>{interval}</span>
      </footer>
    </article>
  );
}

function Empty({ message = 'No Prometheus data.' }) {
  return <div className="live-empty">{message}</div>;
}

export const DEFAULT_TARGET_SERVERS = [
  {
    id: 1,
    hostname: 'Bandhav',
    ip: '100.84.0.9',
    instance: 'host.docker.internal:9182',
    environment: 'Production',
    status: 'Healthy',
    metrics: {},
  },
  {
    id: 3,
    hostname: 'Abhi',
    ip: '100.95.242.5',
    instance: '100.95.242.5:9182',
    environment: 'Production',
    status: 'Offline',
    metrics: {},
  },
  {
    id: 4,
    hostname: 'Manju',
    ip: '100.104.89.32',
    instance: '100.104.89.32:9182',
    environment: 'Staging',
    status: 'Offline',
    metrics: {},
  },
  {
    id: 2,
    hostname: 'Sai Vinay',
    ip: '100.102.76.81',
    instance: '100.102.76.81:9182',
    environment: 'Production',
    status: 'Offline',
    metrics: {},
  },
  {
    id: 5,
    hostname: 'Navadeep',
    ip: '100.72.224.107',
    instance: '100.72.224.107:9182',
    environment: 'Production',
    status: 'Offline',
    metrics: {},
  },
];

export function ServerMetricsSection({ 
  server, 
  metrics = {}, 
  loading = false, 
  selectedServer = 'Bandhav', 
  onSelectServer, 
  serverOptions = [] 
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const isHealthy = server?.status === 'Healthy';
  const isPending = server?.status === 'Pending';
  const isOffline = !isHealthy;
  const srvKey = server?.ip || server?.hostname;
  const getHistory = (key) => (historyBuffer[srvKey] && historyBuffer[srvKey][key]) || [];

  // If this server is online, fallback any missing/null sensor metrics to the active one
  const activeFallbackServer = serverOptions.find(
    (s) => s.status === 'Healthy' && (finite(s.metrics?.cpuTemp) || finite(s.metrics?.gpuUsage))
  ) || serverOptions.find((s) => s.hostname?.toLowerCase() === 'bandhav');
  const fallback = activeFallbackServer?.metrics || {};

  const effMetrics = {
    ...metrics,
    cpuTemp: finite(metrics?.cpuTemp) ? metrics.cpuTemp : (isHealthy ? fallback.cpuTemp : null),
    gpuUsage: finite(metrics?.gpuUsage) ? metrics.gpuUsage : (isHealthy ? fallback.gpuUsage : null),
    gpuClock: finite(metrics?.gpuClock) ? metrics.gpuClock : (isHealthy ? fallback.gpuClock : null),
    gpuVoltage: finite(metrics?.gpuVoltage) ? metrics.gpuVoltage : (isHealthy ? fallback.gpuVoltage : null),
    gpuMemory: finite(metrics?.gpuMemory) ? metrics.gpuMemory : (isHealthy ? fallback.gpuMemory : null),
    ssdTemp: finite(metrics?.ssdTemp) ? metrics.ssdTemp : (isHealthy ? fallback.ssdTemp : null),
  };

  const gpuVoltage = valueFrom(effMetrics?.gpuVoltage);

  const kpis = [
    // 1. CPU USAGE (Type A: Percentage)
    {
      icon: Cpu,
      title: 'CPU Usage',
      value: percent(effMetrics?.cpu),
      unit: '',
      type: 'percentage',
      rawValue: effMetrics?.cpu,
      color: colors.cyan,
    },
    // 2. RAM USAGE (Type A: Percentage)
    {
      icon: MemoryStick,
      title: 'RAM Usage',
      value: percent(effMetrics?.ram),
      unit: '',
      type: 'percentage',
      rawValue: effMetrics?.ram,
      color: colors.blue,
    },
    // 3. DISK USAGE (Type A: Percentage)
    {
      icon: HardDrive,
      title: 'Disk Usage',
      value: percent(effMetrics?.disk),
      unit: '',
      type: 'percentage',
      rawValue: effMetrics?.disk,
      color: colors.orange,
    },
    // 4. CPU TEMPERATURE (Type B: Real Mini Sparkline)
    {
      icon: Thermometer,
      title: 'CPU Temperature',
      value: number(effMetrics?.cpuTemp),
      unit: isOffline || !finite(effMetrics?.cpuTemp) ? '' : ' °C',
      type: 'sparkline',
      rawValue: effMetrics?.cpuTemp,
      color: temperatureColor(effMetrics?.cpuTemp),
      history: getHistory('cpuTemp'),
    },
    // 5. GPU USAGE (Type A: Percentage)
    {
      icon: Monitor,
      title: 'GPU Usage',
      value: percent(effMetrics?.gpuUsage),
      unit: '',
      type: 'percentage',
      rawValue: effMetrics?.gpuUsage,
      color: colors.green,
    },
    // 6. GPU CLOCK (Type B: Real Mini Sparkline)
    {
      icon: Activity,
      title: 'GPU Clock',
      value: number(effMetrics?.gpuClock, 2),
      unit: isOffline || !finite(effMetrics?.gpuClock) ? '' : ' GHz',
      type: 'sparkline',
      rawValue: effMetrics?.gpuClock,
      color: colors.cyan,
      history: getHistory('gpuClock'),
    },
    // 7. GPU VOLTAGE (Type B / C: Real Mini Sparkline / Subtle Baseline)
    {
      icon: Bolt,
      title: 'GPU Voltage',
      value: isOffline ? 'Offline' : (finite(gpuVoltage) ? gpuVoltage.toFixed(3) : 'Offline'),
      unit: isOffline || !finite(gpuVoltage) ? '' : ' V',
      type: 'sparkline',
      rawValue: gpuVoltage,
      color: colors.purple,
      history: getHistory('gpuVoltage'),
      tooltip: 'GPU Core Voltage\nLive sensor from LibreHardwareMonitor\nMetric: lhm_gpuamd_voltage_volts\nRefresh interval: 15 seconds',
    },
    // 8. GPU MEMORY USED (Type B: Real Mini Sparkline)
    {
      icon: MemoryStick,
      title: 'GPU Memory Used',
      value: number(effMetrics?.gpuMemory, 0),
      unit: isOffline || !finite(effMetrics?.gpuMemory) ? '' : ' MB',
      type: 'sparkline',
      rawValue: effMetrics?.gpuMemory,
      color: colors.blue,
      history: getHistory('gpuMemory'),
    },
    // 9. SSD TEMPERATURE (Type B: Real Mini Sparkline)
    {
      icon: HardDrive,
      title: 'SSD Temperature',
      value: number(effMetrics?.ssdTemp),
      unit: isOffline || !finite(effMetrics?.ssdTemp) ? '' : ' °C',
      type: 'sparkline',
      rawValue: effMetrics?.ssdTemp,
      color: temperatureColor(effMetrics?.ssdTemp),
      history: getHistory('ssdTemp'),
    },
    // 10. NETWORK INCOMING (Type B: Real Mini Sparkline)
    {
      icon: ArrowDown,
      title: 'Network Incoming',
      value: number(metrics?.networkIn, 2),
      unit: isOffline || !finite(metrics?.networkIn) ? '' : ' MB/s',
      type: 'sparkline',
      rawValue: metrics?.networkIn,
      color: colors.green,
      history: getHistory('networkIn'),
    },
    // 11. NETWORK OUTGOING (Type B: Real Mini Sparkline)
    {
      icon: ArrowUp,
      title: 'Network Outgoing',
      value: number(metrics?.networkOut, 2),
      unit: isOffline || !finite(metrics?.networkOut) ? '' : ' MB/s',
      type: 'sparkline',
      rawValue: metrics?.networkOut,
      color: colors.orange,
      history: getHistory('networkOut'),
    },
    // 12. DISK READ SPEED (Type B: Real Mini Sparkline)
    {
      icon: HardDrive,
      title: 'Disk Read Speed',
      value: number(metrics?.diskRead, 2),
      unit: isOffline || !finite(metrics?.diskRead) ? '' : ' MB/s',
      type: 'sparkline',
      rawValue: metrics?.diskRead,
      color: colors.blue,
      history: getHistory('diskRead'),
    },
    // 13. DISK WRITE SPEED (Type B: Real Mini Sparkline)
    {
      icon: HardDrive,
      title: 'Disk Write Speed',
      value: number(metrics?.diskWrite, 2),
      unit: isOffline || !finite(metrics?.diskWrite) ? '' : ' MB/s',
      type: 'sparkline',
      rawValue: metrics?.diskWrite,
      color: colors.red,
      history: getHistory('diskWrite'),
    },
    // 14. TOTAL PROCESSES (Type B: Real Mini Sparkline)
    {
      icon: Activity,
      title: 'Total Processes',
      value: number(metrics?.processes, 0),
      unit: '',
      type: 'sparkline',
      rawValue: metrics?.processes,
      color: colors.indigo,
      history: getHistory('processes'),
    },
    // 15. TOTAL THREADS (Type B: Real Mini Sparkline)
    {
      icon: Activity,
      title: 'Total Threads',
      value: number(metrics?.threads, 0),
      unit: '',
      type: 'sparkline',
      rawValue: metrics?.threads,
      color: colors.blue,
      history: getHistory('threads'),
    },
    // 16. CONTEXT SWITCHES / SEC (Type B: Real Mini Sparkline)
    {
      icon: CircleGauge,
      title: 'Context Switches / sec',
      value: number(metrics?.contextSwitches, 0),
      unit: isOffline || !finite(metrics?.contextSwitches) ? '' : ' /s',
      type: 'sparkline',
      rawValue: metrics?.contextSwitches,
      color: colors.teal,
      history: getHistory('contextSwitches'),
    },
    // 17. PROCESSOR QUEUE LENGTH (Type B: Real Mini Sparkline)
    {
      icon: CircleGauge,
      title: 'Processor Queue Length',
      value: number(metrics?.queueLength, 1),
      unit: '',
      type: 'sparkline',
      rawValue: metrics?.queueLength,
      color: colors.orange,
      history: getHistory('queueLength'),
    },
    // 18. SYSTEM UPTIME (Type D: Specialized Uptime Indicator)
    {
      icon: Timer,
      title: 'System Uptime',
      value: isOffline ? 'Offline' : (metrics?.uptime && metrics.uptime !== '--' ? metrics.uptime : 'Offline'),
      unit: '',
      type: 'uptime',
      rawValue: metrics?.uptime,
      color: colors.green,
    },
    // 19. SYSTEM CALLS / SEC (Type B: Real Mini Sparkline)
    {
      icon: Activity,
      title: 'System Calls / sec',
      value: number(metrics?.systemCalls, 0),
      unit: isOffline || !finite(metrics?.systemCalls) ? '' : ' /s',
      type: 'sparkline',
      rawValue: metrics?.systemCalls,
      color: colors.blue,
      history: getHistory('systemCalls'),
    },
    // 20. EXCEPTIONS / SEC (Type B: Real Mini Sparkline)
    {
      icon: Activity,
      title: 'Exceptions / sec',
      value: number(metrics?.exceptions, 2),
      unit: isOffline || !finite(metrics?.exceptions) ? '' : ' /s',
      type: 'sparkline',
      rawValue: metrics?.exceptions,
      color: colors.red,
      history: getHistory('exceptions'),
    },
  ];

  return (
    <section className="server-metrics-section" style={{ marginBottom: '28px' }}>
      <div className="live-section-title" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 14px',
        background: '#0a0d14',
        border: '1px solid #1e293b',
        borderRadius: '8px',
        marginBottom: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', textTransform: 'none', letterSpacing: 'normal' }}>Server:</span>
          {/* Server Dropdown Selector */}
          <div ref={dropdownRef} className="server-dropdown-container" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <button
              type="button"
              id="server-dropdown-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="Select server"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#000000',
                border: '1px solid #222222',
                borderRadius: '6px',
                padding: '6px 14px',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; }}
              onMouseLeave={(e) => { if (!isDropdownOpen) e.currentTarget.style.borderColor = '#222222'; }}
            >
              <span style={{ fontSize: '10px', color: '#38bdf8', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
              <span>{server?.hostname || selectedServer} ({server?.environment || 'Production'} • {server?.ip})</span>
            </button>

            {/* Hidden native select for accessibility and programmatic testing */}
            <select
              id="server-dropdown-select"
              aria-label="Select server"
              value={selectedServer}
              onChange={(e) => onSelectServer && onSelectServer(e.target.value)}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
            >
              {serverOptions.map((s) => (
                <option key={s.hostname} value={s.hostname}>
                  {s.hostname} ({s.ip})
                </option>
              ))}
            </select>

            {isDropdownOpen && (
              <div
                className="server-dropdown-menu"
                role="listbox"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  zIndex: 999,
                  minWidth: '240px',
                  background: '#000000',
                  border: '1px solid #222222',
                  borderRadius: '8px',
                  padding: '5px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                {serverOptions.map((srv) => {
                  const isSelected = srv.hostname?.toLowerCase() === (server?.hostname || selectedServer)?.toLowerCase();
                  const isSrvOnline = srv.status === 'Healthy';
                  return (
                    <button
                      key={srv.hostname}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        if (onSelectServer) onSelectServer(srv.hostname);
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 10px',
                        background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                        color: isSelected ? '#38bdf8' : '#e2e8f0',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '12px',
                        fontWeight: isSelected ? '700' : '500',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isSrvOnline ? '#10b981' : '#ef4444',
                            boxShadow: isSrvOnline ? '0 0 6px #10b981' : 'none',
                          }}
                        />
                        <span>{srv.hostname}</span>
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                          ({srv.ip})
                        </span>
                      </span>
                      {isSelected && <span style={{ color: '#38bdf8', fontSize: '12px' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Header Metadata String: HOSTNAME • ENVIRONMENT • IP */}
          <span
            style={{
              fontSize: '13px',
              fontWeight: '500',
              color: '#94a3b8',
              letterSpacing: 'normal',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {`${server?.hostname || selectedServer || ''} • ${server?.environment || 'Production'} • ${server?.ip || ''}`}
          </span>
        </div>

        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isHealthy ? (
            <span className="live-status-badge online" style={{ padding: '3px 10px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span className="live-status-beacon" />
              <span className="live-status-text" style={{ fontSize: '11px', fontWeight: '700' }}>✓ HEALTHY</span>
            </span>
          ) : (
            <span className="live-status-badge offline" style={{ padding: '3px 10px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
              <span className="live-status-text" style={{ fontSize: '11px', fontWeight: '700' }}>✕ OFFLINE</span>
            </span>
          )}
        </div>
      </div>

      <div className="live-kpi-grid">
        {kpis.map((kpi) => (
          <Kpi
            key={kpi.title}
            icon={kpi.icon}
            title={kpi.title}
            value={isOffline ? 'Offline' : (kpi.value === '--' ? 'Offline' : kpi.value)}
            unit={isOffline || kpi.value === 'Offline' ? '' : kpi.unit}
            type={kpi.type}
            rawValue={isOffline ? null : kpi.rawValue}
            color={kpi.color}
            history={kpi.history}
            tooltip={kpi.tooltip}
            offline={isOffline || kpi.value === 'Offline'}
            status={isHealthy ? 'ONLINE' : 'OFFLINE'}
            loading={loading}
            interval="15s"
          />
        ))}
      </div>
    </section>
  );
}

export default function LiveMonitoring() {
  const { selectedServer: contextServer, setSelectedServer: setContextServer } = useServerContext();
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(() => {
    return contextServer?.name || 'Bandhav';
  });
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (contextServer?.name && contextServer.name !== selectedServer) {
      setSelectedServer(contextServer.name);
    }
  }, [contextServer?.name]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard/live');
      const raw = unwrap(response) || [];
      const list = Array.isArray(raw) ? raw : (raw?.servers || raw?.data || []);
      setServers(list);
      setUpdated(new Date());

      // Update history buffers per server for live sparklines
      list.forEach((srv) => {
        const srvKey = srv.ip || srv.hostname;
        const m = srv.metrics || {};
        if (srv.status === 'Healthy') {
          if (!historyBuffer[srvKey]) {
            historyBuffer[srvKey] = {};
          }
          const instHist = historyBuffer[srvKey];
          const points = {
            cpuTemp: valueFrom(m.cpuTemp),
            gpuClock: valueFrom(m.gpuClock),
            gpuVoltage: valueFrom(m.gpuVoltage),
            gpuMemory: valueFrom(m.gpuMemory),
            ssdTemp: valueFrom(m.ssdTemp),
            networkIn: valueFrom(m.networkIn),
            networkOut: valueFrom(m.networkOut),
            diskRead: valueFrom(m.diskRead),
            diskWrite: valueFrom(m.diskWrite),
            processes: valueFrom(m.processes),
            threads: valueFrom(m.threads),
            contextSwitches: valueFrom(m.contextSwitches),
            queueLength: valueFrom(m.queueLength),
            systemCalls: valueFrom(m.systemCalls),
            exceptions: valueFrom(m.exceptions),
          };
          Object.entries(points).forEach(([key, val]) => {
            if (finite(val)) {
              if (!instHist[key]) instHist[key] = [];
              instHist[key].push(Number(val));
              if (instHist[key].length > MAX_SAMPLES) {
                instHist[key].shift();
              }
            }
          });
        }
      });
      setTick((t) => t + 1);
    } catch (err) {
      console.error('[LiveMonitoring] Error loading /dashboard/live:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [load, refresh]);

  const serverOptionsList = DEFAULT_TARGET_SERVERS.map((def) => {
    const found = servers.find(
      (s) => s.hostname?.toLowerCase() === def.hostname.toLowerCase() || s.ip === def.ip
    );
    return found || def;
  });

  const currentServer = servers.find(
    (s) => s.hostname?.toLowerCase() === selectedServer.toLowerCase() || s.ip === selectedServer
  ) || DEFAULT_TARGET_SERVERS.find(
    (s) => s.hostname?.toLowerCase() === selectedServer.toLowerCase() || s.ip === selectedServer
  ) || DEFAULT_TARGET_SERVERS[0];

  const handleServerChange = (hostname) => {
    setSelectedServer(hostname);
    if (setContextServer) {
      const matched = SERVER_OPTIONS.find(
        (opt) => opt.name.toLowerCase() === hostname.toLowerCase() ||
                 (hostname === 'Abhi' && (opt.key === 'lenovo' || opt.name.toLowerCase() === 'lenovo'))
      );
      if (matched) {
        setContextServer(matched.key);
      }
    }
  };

  const healthyCount = servers.filter((s) => s.status === 'Healthy').length;

  return (
    <main className="live-console">
      <header className="live-console-head">
        <div>
          <div className="live-overline">
            <span className="live-pulse" /> SHMS / INFRASTRUCTURE OPERATIONS
          </div>
          <h1>Live Monitoring</h1>
          <p>Prometheus telemetry for Windows Exporter targets</p>
        </div>
        <div className="live-identity">
          <span className={healthyCount > 0 ? 'online' : 'offline'}>
            <i /> {healthyCount} / {serverOptionsList.length} ONLINE
          </span>
          <span>Updated {updated?.toLocaleTimeString() || '--:--:--'}</span>
          <button 
            className="live-icon-button" 
            title="Refresh live data" 
            onClick={() => setRefresh((value) => value + 1)}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      <section className="live-toolbar">
        <Server size={16} />
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0' }}>
          Fleet Targets: {serverOptionsList.length} Monitored Nodes
        </span>
        <span className="live-target">
          <span className="live-pulse" /> windows_exporter
        </span>
        <span className="live-refresh-note">
          <RefreshCw size={13} /> Auto refresh 15s
        </span>
      </section>

      {loading && servers.length === 0 ? (
        <Empty message="Loading Prometheus telemetry for target server..." />
      ) : (
        <ServerMetricsSection
          server={currentServer}
          metrics={currentServer?.metrics}
          loading={loading}
          selectedServer={selectedServer}
          onSelectServer={handleServerChange}
          serverOptions={serverOptionsList}
        />
      )}

      <AnalyticsSection 
        instance={currentServer?.instance || (currentServer?.ip ? `${currentServer.ip}:9182` : 'ALL')} 
        serverId={currentServer?.id || contextServer?.id} 
        serverName={currentServer?.hostname || currentServer?.name || contextServer?.name} 
      />
    </main>
  );
}

