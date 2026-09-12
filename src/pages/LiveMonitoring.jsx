import React, { useCallback, useEffect, useState } from 'react';
import { 
  Activity, ArrowDown, ArrowUp, Bolt, CheckCircle2, CircleGauge, 
  Cpu, HardDrive, MemoryStick, Monitor, RefreshCw, Server, 
  Thermometer, Timer, XCircle 
} from 'lucide-react';
import api, { unwrap } from '../api';
import { useServerContext } from '../context/ServerContext';
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
const number = (value, digits = 1) => finite(value) ? Number(value).toFixed(digits) : '--';
const percent = (value) => finite(value) ? `${number(value)}%` : '--';
const gigabytes = (value) => finite(value) ? `${number(value, 2)} GB` : '--';
const uptime = (hours) => finite(hours) ? `${Math.floor(hours / 24)}d ${Math.floor(hours % 24)}h ${Math.floor((hours * 60) % 60)}m` : '--';
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
  interval = '5s'
}) {
  const unavailable = (title === 'GPU Voltage' && value === '--') || offline;
  const voltageTooltip = 'GPU Core Voltage\nLive sensor from LibreHardwareMonitor\nMetric: lhm_gpuamd_voltage_volts\nRefresh interval: 5 seconds';

  const renderViz = () => {
    if (offline || value === '--' || value == null) {
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
        return <KpiUptimeIndicator color={color} live={live && !offline} />;
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
        {loading && value === '--' ? (
          <span className="live-kpi-loading-text">Loading...</span>
        ) : (
          <>
            {value}
            <em>{title === 'GPU Voltage' && value === '--' ? ' V' : unit}</em>
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

export default function LiveMonitoring() {
  const { selectedServer, serverOptions, setSelectedServer } = useServerContext();
  const instance = selectedServer.instance;
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setPrometheusAvailable] = useState(true);
  const [updated, setUpdated] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/monitoring/live', { params: { instance } });
      const raw = unwrap(response) || {};
      setMetrics(raw);
      setPrometheusAvailable(true);
      setUpdated(new Date());

      if (Number(raw.up) !== 0) {
        if (!historyBuffer[instance]) {
          historyBuffer[instance] = {};
        }
        const instHist = historyBuffer[instance];

        const freeMemGb = finite(raw.memoryFree) ? Number(raw.memoryFree) / 1024 / 1024 / 1024 : null;
        const totMemGb = finite(raw.memoryTotal) ? Number(raw.memoryTotal) / 1024 / 1024 / 1024 : null;
        const usedMemGb = finite(totMemGb) && finite(freeMemGb) ? Math.max(0, totMemGb - freeMemGb) : null;

        const currentPoints = {
          cpuTemperature: valueFrom(raw.cpuTemperature),
          gpuClock: valueFrom(raw.gpuClock),
          gpuVoltage: valueFrom(raw.gpuVoltage),
          gpuMemoryUsed: valueFrom(raw.gpuMemoryUsed),
          ssdTemperature: valueFrom(raw.ssdTemperature),
          networkReceive: valueFrom(raw.networkReceive),
          networkSend: valueFrom(raw.networkSend),
          diskRead: valueFrom(raw.diskRead),
          diskWrite: valueFrom(raw.diskWrite),
          processCount: valueFrom(raw.processCount),
          threads: valueFrom(raw.threads),
          contextSwitches: valueFrom(raw.contextSwitches),
          queueLength: valueFrom(raw.queueLength),
          systemCalls: valueFrom(raw.systemCalls),
          exceptions: valueFrom(raw.exceptions),
          freeMemory: freeMemGb,
          usedMemory: usedMemGb,
        };

        Object.entries(currentPoints).forEach(([key, val]) => {
          if (finite(val)) {
            if (!instHist[key]) instHist[key] = [];
            instHist[key].push(Number(val));
            if (instHist[key].length > MAX_SAMPLES) {
              instHist[key].shift();
            }
          }
        });

        setTick((t) => t + 1);
      }
    } catch {
      setMetrics({ instance, up: null, status: 'unknown' });
      setPrometheusAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [instance]);

  useEffect(() => { 
    load(); 
    const timer = window.setInterval(load, 5000); 
    return () => window.clearInterval(timer); 
  }, [load, refresh]);

  const data = metrics || {};
  const offline = Number(data.up) === 0;
  const status = Number(data.up) === 1 ? 'ONLINE' : offline ? 'OFFLINE' : 'UNKNOWN';
  const gpuVoltage = valueFrom(data.gpuVoltage);
  const freeMemory = valueFrom(data.memoryFree);
  const totalMemory = valueFrom(data.memoryTotal);
  const memoryUsed = finite(totalMemory) && finite(freeMemory) ? Math.max(0, totalMemory - freeMemory) : null;

  const getHistory = (key) => (historyBuffer[instance] && historyBuffer[instance][key]) || [];

  const kpis = [
    // 1. CPU USAGE (Type A: Percentage)
    {
      icon: Cpu,
      title: 'CPU Usage',
      value: percent(data.cpuUsage),
      unit: '',
      type: 'percentage',
      rawValue: data.cpuUsage,
      color: colors.cyan,
    },
    // 2. RAM USAGE (Type A: Percentage)
    {
      icon: MemoryStick,
      title: 'RAM Usage',
      value: percent(data.ramUsage),
      unit: '',
      type: 'percentage',
      rawValue: data.ramUsage,
      color: colors.blue,
    },
    // 3. DISK USAGE (Type A: Percentage)
    {
      icon: HardDrive,
      title: 'Disk Usage',
      value: percent(data.diskUsage),
      unit: '',
      type: 'percentage',
      rawValue: data.diskUsage,
      color: colors.orange,
    },
    // 4. CPU TEMPERATURE (Type B: Real Mini Sparkline)
    {
      icon: Thermometer,
      title: 'CPU Temperature',
      value: number(data.cpuTemperature),
      unit: ' °C',
      type: 'sparkline',
      rawValue: data.cpuTemperature,
      color: temperatureColor(data.cpuTemperature),
      history: getHistory('cpuTemperature'),
    },
    // 5. GPU USAGE (Type A: Percentage)
    {
      icon: Monitor,
      title: 'GPU Usage',
      value: percent(data.gpuUsage),
      unit: '',
      type: 'percentage',
      rawValue: data.gpuUsage,
      color: colors.green,
    },
    // 6. GPU CLOCK (Type B: Real Mini Sparkline)
    {
      icon: Activity,
      title: 'GPU Clock',
      value: number(data.gpuClock, 2),
      unit: ' GHz',
      type: 'sparkline',
      rawValue: data.gpuClock,
      color: colors.cyan,
      history: getHistory('gpuClock'),
    },
    // 7. GPU VOLTAGE (Type B / C: Real Mini Sparkline / Subtle Baseline)
    {
      icon: Bolt,
      title: 'GPU Voltage',
      value: finite(gpuVoltage) ? gpuVoltage.toFixed(3) : '--',
      unit: ' V',
      type: 'sparkline',
      rawValue: gpuVoltage,
      color: colors.purple,
      history: getHistory('gpuVoltage'),
      tooltip: 'GPU Core Voltage\nLive sensor from LibreHardwareMonitor\nMetric: lhm_gpuamd_voltage_volts\nRefresh interval: 5 seconds',
    },
    // 8. GPU MEMORY USED (Type B: Real Mini Sparkline)
    {
      icon: MemoryStick,
      title: 'GPU Memory Used',
      value: number(data.gpuMemoryUsed, 0),
      unit: ' MB',
      type: 'sparkline',
      rawValue: data.gpuMemoryUsed,
      color: colors.blue,
      history: getHistory('gpuMemoryUsed'),
    },
    // 9. SSD TEMPERATURE (Type B: Real Mini Sparkline)
    {
      icon: HardDrive,
      title: 'SSD Temperature',
      value: number(data.ssdTemperature),
      unit: ' °C',
      type: 'sparkline',
      rawValue: data.ssdTemperature,
      color: temperatureColor(data.ssdTemperature),
      history: getHistory('ssdTemperature'),
    },
    // 10. NETWORK INCOMING (Type B: Real Mini Sparkline)
    {
      icon: ArrowDown,
      title: 'Network Incoming',
      value: number(data.networkReceive, 2),
      unit: ' MB/s',
      type: 'sparkline',
      rawValue: data.networkReceive,
      color: colors.green,
      history: getHistory('networkReceive'),
    },
    // 11. NETWORK OUTGOING (Type B: Real Mini Sparkline)
    {
      icon: ArrowUp,
      title: 'Network Outgoing',
      value: number(data.networkSend, 2),
      unit: ' MB/s',
      type: 'sparkline',
      rawValue: data.networkSend,
      color: colors.orange,
      history: getHistory('networkSend'),
    },
    // 12. DISK READ SPEED (Type B: Real Mini Sparkline)
    {
      icon: HardDrive,
      title: 'Disk Read Speed',
      value: number(data.diskRead, 2),
      unit: ' MB/s',
      type: 'sparkline',
      rawValue: data.diskRead,
      color: colors.blue,
      history: getHistory('diskRead'),
    },
    // 13. DISK WRITE SPEED (Type B: Real Mini Sparkline)
    {
      icon: HardDrive,
      title: 'Disk Write Speed',
      value: number(data.diskWrite, 2),
      unit: ' MB/s',
      type: 'sparkline',
      rawValue: data.diskWrite,
      color: colors.red,
      history: getHistory('diskWrite'),
    },
    // 14. TOTAL PROCESSES (Type B: Real Mini Sparkline)
    {
      icon: Activity,
      title: 'Total Processes',
      value: number(data.processCount, 0),
      unit: '',
      type: 'sparkline',
      rawValue: data.processCount,
      color: colors.indigo,
      history: getHistory('processCount'),
    },
    // 15. TOTAL THREADS (Type B: Real Mini Sparkline)
    {
      icon: Activity,
      title: 'Total Threads',
      value: number(data.threads, 0),
      unit: '',
      type: 'sparkline',
      rawValue: data.threads,
      color: colors.blue,
      history: getHistory('threads'),
    },
    // 16. CONTEXT SWITCHES / SEC (Type B: Real Mini Sparkline)
    {
      icon: CircleGauge,
      title: 'Context Switches / sec',
      value: number(data.contextSwitches, 2),
      unit: ' /s',
      type: 'sparkline',
      rawValue: data.contextSwitches,
      color: colors.teal,
      history: getHistory('contextSwitches'),
    },
    // 17. PROCESSOR QUEUE LENGTH (Type B: Real Mini Sparkline)
    {
      icon: CircleGauge,
      title: 'Processor Queue Length',
      value: number(data.queueLength, 2),
      unit: '',
      type: 'sparkline',
      rawValue: data.queueLength,
      color: colors.orange,
      history: getHistory('queueLength'),
    },
    // 18. SYSTEM UPTIME (Type D: Specialized Uptime Indicator)
    {
      icon: Timer,
      title: 'System Uptime',
      value: uptime(data.uptime),
      unit: '',
      type: 'uptime',
      rawValue: data.uptime,
      color: colors.green,
    },
    // 19. SYSTEM CALLS / SEC (Type B: Real Mini Sparkline)
    {
      icon: Activity,
      title: 'System Calls / sec',
      value: number(data.systemCalls, 2),
      unit: ' /s',
      type: 'sparkline',
      rawValue: data.systemCalls,
      color: colors.blue,
      history: getHistory('systemCalls'),
    },
    // 20. EXCEPTIONS / SEC (Type B: Real Mini Sparkline)
    {
      icon: Activity,
      title: 'Exceptions / sec',
      value: number(data.exceptions, 2),
      unit: ' /s',
      type: 'sparkline',
      rawValue: data.exceptions,
      color: colors.red,
      history: getHistory('exceptions'),
    },
    // 21. AVAILABLE MEMORY (Type B: Real Mini Sparkline)
    {
      icon: ArrowDown,
      title: 'Available Memory',
      value: gigabytes(freeMemory / 1024 / 1024 / 1024),
      unit: '',
      type: 'sparkline',
      rawValue: finite(freeMemory) ? freeMemory / 1024 / 1024 / 1024 : null,
      color: colors.green,
      history: getHistory('freeMemory'),
    },
    // 22. USED MEMORY (Type B: Real Mini Sparkline)
    {
      icon: ArrowUp,
      title: 'Used Memory',
      value: gigabytes(memoryUsed / 1024 / 1024 / 1024),
      unit: '',
      type: 'sparkline',
      rawValue: finite(memoryUsed) ? memoryUsed / 1024 / 1024 / 1024 : null,
      color: colors.orange,
      history: getHistory('usedMemory'),
    },
    // 23. SERVER STATUS (Type D: Specialized Status Badge)
    {
      icon: status === 'ONLINE' ? CheckCircle2 : XCircle,
      title: 'Server Status',
      value: status,
      unit: '',
      type: 'status',
      rawValue: status,
      color: status === 'ONLINE' ? colors.green : colors.red,
      status: status,
    },
  ];

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
          <span className={status === 'ONLINE' ? 'online' : 'offline'}>
            <i /> {status}
          </span>
          <span>{instance}</span>
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
        <select 
          value={selectedServer.key} 
          onChange={(event) => setSelectedServer(event.target.value)} 
          aria-label="Select server"
        >
          {serverOptions
            .filter((option) => option.key !== 'ALL')
            .map((option) => (
              <option key={option.key} value={option.key}>
                {option.name} · {option.instance}
              </option>
            ))}
        </select>
        <span className="live-target">
          <span className="live-pulse" /> windows_exporter
        </span>
        <span className="live-refresh-note">
          <RefreshCw size={13} /> Auto refresh 5s
        </span>
      </section>

      {offline && (
        <div className="live-offline">
          <XCircle size={18} />
          <div>
            <b>Server Offline</b>
            <span>Prometheus reports up = 0. No Prometheus data is available; retrying after refresh.</span>
          </div>
        </div>
      )}

      <div className="live-section-title">
        <span>Live KPI cards</span>
        <small>{kpis.length} signals · {selectedServer.name}</small>
      </div>

      <section className="live-kpi-grid">
        {loading && !metrics ? (
          <Empty message="Loading Prometheus data..." />
        ) : (
          kpis.map((kpi) => (
            <Kpi 
              key={kpi.title} 
              icon={kpi.icon} 
              title={kpi.title} 
              value={offline ? '--' : kpi.value} 
              unit={offline ? '' : kpi.unit} 
              type={kpi.type}
              rawValue={offline ? null : kpi.rawValue}
              color={kpi.color} 
              history={kpi.history}
              tooltip={kpi.tooltip}
              offline={offline}
              status={status}
              loading={loading}
            />
          ))
        )}
      </section>

      <AnalyticsSection 
        instance={instance} 
        serverId={selectedServer?.id} 
        serverName={selectedServer?.name} 
      />
    </main>
  );
}
