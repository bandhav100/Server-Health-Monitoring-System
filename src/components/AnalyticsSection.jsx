import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, RefreshCw } from 'lucide-react';
import api, { unwrap } from '../api';
import { useSettings } from '../context/SettingsContext';
import ChartActions from './ui/ChartActions';
import ChartModal from './ui/ChartModal';
import { exportChartAsCsv, exportChartAsJson, exportChartAsPng } from '../utils/chartExport';
import './AnalyticsSection.css';

const colors = { green: '#16a34a', blue: '#2563eb', orange: '#f97316', red: '#dc2626', purple: '#9333ea', cyan: '#0891b2', teal: '#0faaa0', muted: '#64748b', grid: '#e5e7eb' };

const ranges = [
  { label: '15m', hours: 0.25, name: '15 Minutes' },
  { label: '30m', hours: 0.5, name: '30 Minutes' },
  { label: '1h', hours: 1, name: '1 Hour' },
  { label: '6h', hours: 6, name: '6 Hours' },
  { label: '12h', hours: 12, name: '12 Hours' },
  { label: '24h', hours: 24, name: '24 Hours' },
  { label: '7d', hours: 168, name: '7 Days' },
];

const endpoints = [
  'cpu-timeline',
  'cpu-cores',
  'memory-trend',
  'memory-distribution',
  'disk-capacity',
  'disk-io',
  'network',
  'network-history',
  'network-historical',
  'packets',
  'temperature',
  'processes',
  'system-calls',
  'memory-pressure',
  'history',
];

const finite = (value) => Number.isFinite(Number(value));
const format = (value, digits = 1) => finite(value) ? Number(value).toFixed(digits) : '--';

function formatAxisTime(val, rangeHours, settings) {
  if (!val) return '';
  const date = new Date(val);
  if (isNaN(date.getTime())) return String(val);

  const tz = settings?.timezone && settings.timezone !== 'auto' ? settings.timezone : undefined;
  const is12h = settings?.time_format === '12h';

  try {
    if (rangeHours <= 1) {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: is12h,
      }).format(date);
    } else if (rangeHours <= 12) {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: is12h,
      }).format(date);
    } else if (rangeHours <= 24) {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: is12h,
      }).format(date);
    } else {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: is12h,
      }).format(date);
    }
  } catch {
    return date.toLocaleTimeString();
  }
}

function formatTooltipTime(val, settings) {
  if (!val) return '--';
  const date = new Date(val);
  if (isNaN(date.getTime())) return String(val);

  const tz = settings?.timezone && settings.timezone !== 'auto' ? settings.timezone : undefined;
  const is12h = settings?.time_format === '12h';

  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: is12h,
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

const merge = (series, names) => {
  const rows = new Map();
  names.forEach((name) => (series?.[name] || []).forEach((item) => {
    const time = item.time;
    rows.set(time, { ...(rows.get(time) || { time }), [name]: finite(item.value) ? Number(item.value) : null });
  }));
  return [...rows.values()];
};

const summary = (rows, key) => {
  const values = rows.map((row) => Number(row[key])).filter(Number.isFinite);
  return {
    current: values.at(-1),
    average: values.length ? values.reduce((total, value) => total + value, 0) / values.length : null,
    peak: values.length ? Math.max(...values) : null,
  };
};

function Empty({ message = 'No historical data available for this time range.', onRetry = null }) {
  return (
    <div className="analytics-empty">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="analytics-retry-btn" onClick={onRetry}>
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  );
}

function Tip({ active, payload, label, chartTheme, settings }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="analytics-tooltip"
      style={{
        backgroundColor: chartTheme?.tooltipBg,
        borderColor: chartTheme?.tooltipBorder,
        color: chartTheme?.tooltipText,
      }}
    >
      <strong style={{ color: chartTheme?.tooltipText }}>{formatTooltipTime(label, settings)}</strong>
      {payload.map((entry) => (
        <span key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {format(entry.value, 2)}
        </span>
      ))}
    </div>
  );
}

function Stats({ rows, keyName, suffix = '' }) {
  const values = summary(rows, keyName);
  return (
    <footer className="analytics-stats">
      <span>Current <b>{format(values.current)}{suffix}</b></span>
      <span>Average <b>{format(values.average)}{suffix}</b></span>
      <span>Peak <b>{format(values.peak)}{suffix}</b></span>
    </footer>
  );
}

function Chart({ rows, keys, palette, type = 'line', suffix = '', domain, thresholds = [], chartTheme, rangeHours, settings }) {
  if (!rows.length) return <Empty />;
  const gridColor = chartTheme?.grid || '#151515';
  const tickColor = chartTheme?.tick || '#A3A3A3';
  const axisLineProp = chartTheme?.axis ? { stroke: chartTheme.axis } : false;
  const tickLineProp = chartTheme?.ticks ? { stroke: chartTheme.ticks } : false;
  const axis = (
    <>
      <CartesianGrid stroke={gridColor} vertical={false} />
      <XAxis 
        dataKey="time" 
        tick={{ fill: tickColor, fontSize: 9 }} 
        axisLine={axisLineProp} 
        tickLine={tickLineProp}
        minTickGap={35}
        interval="preserveStartEnd"
        tickFormatter={(t) => formatAxisTime(t, rangeHours, settings)}
      />
      <YAxis 
        domain={domain || ['auto', 'auto']} 
        tick={{ fill: tickColor, fontSize: 9 }} 
        axisLine={axisLineProp} 
        tickLine={tickLineProp} 
      />
      <Tooltip content={<Tip chartTheme={chartTheme} settings={settings} />} />
      {thresholds.map((threshold) => {
        const value = typeof threshold === 'number' ? threshold : threshold.value;
        return (
          <ReferenceLine 
            key={value} 
            y={value} 
            stroke={typeof threshold === 'number' ? colors.red : threshold.color} 
            strokeDasharray="4 4" 
            label={`${value}%`} 
          />
        );
      })}
    </>
  );
  const series = keys.map((key) =>
    type === 'bar' ? (
      <Bar key={key} dataKey={key} name={key} fill={palette[key]} radius={[3, 3, 0, 0]} />
    ) : type === 'area' ? (
      <Area 
        key={key} 
        type="monotone" 
        dataKey={key} 
        name={key} 
        stroke={palette[key]} 
        fill={palette[key]} 
        fillOpacity={0.14} 
        strokeWidth={2} 
        dot={false}
        connectNulls={false}
      />
    ) : (
      <Line 
        key={key} 
        type="monotone" 
        dataKey={key} 
        name={key} 
        stroke={palette[key]} 
        strokeWidth={2} 
        dot={false}
        connectNulls={false}
      />
    )
  );
  return (
    <>
      <div className="analytics-chart">
        <ResponsiveContainer>
          {type === 'bar' ? <BarChart data={rows}>{axis}{series}</BarChart> : type === 'area' ? <AreaChart data={rows}>{axis}{series}</AreaChart> : <LineChart data={rows}>{axis}{series}</LineChart>}
        </ResponsiveContainer>
      </div>
      <div className="analytics-legend">
        {keys.map((key) => (
          <span key={key}>
            <i style={{ background: palette[key] }} />
            {key}
          </span>
        ))}
      </div>
      {keys.length === 1 && <Stats rows={rows} keyName={keys[0]} suffix={suffix} />}
    </>
  );
}

function CoreChart({ cores, chartTheme }) {
  if (!cores.length) return <Empty />;
  const highest = Math.max(...cores.map((core) => Number(core.usage)));
  const rows = cores.map((core) => ({ ...core, usage: Number(core.usage) }));
  const gridColor = chartTheme?.grid || '#151515';
  const tickColor = chartTheme?.tick || '#A3A3A3';
  const axisLineProp = chartTheme?.axis ? { stroke: chartTheme.axis } : false;
  const tickLineProp = chartTheme?.ticks ? { stroke: chartTheme.ticks } : false;
  return (
    <>
      <div className="analytics-chart">
        <ResponsiveContainer>
          <BarChart data={rows}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="core" tick={{ fill: tickColor, fontSize: 9 }} axisLine={axisLineProp} tickLine={tickLineProp} tickFormatter={(core) => `Core ${core}`} />
            <YAxis domain={[0, 100]} tick={{ fill: tickColor, fontSize: 9 }} axisLine={axisLineProp} tickLine={tickLineProp} />
            <Tooltip content={<Tip chartTheme={chartTheme} />} formatter={(value) => [`${format(value)}%`, 'CPU Usage']} labelFormatter={(core) => `Core ${core}`} />
            <Bar dataKey="usage" name="CPU Usage" radius={[3, 3, 0, 0]}>
              {rows.map((row) => (
                <Cell key={row.core} fill={row.usage === highest ? colors.orange : colors.teal} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Stats rows={rows} keyName="usage" suffix="%" />
    </>
  );
}

function PressureChart({ rows, chartTheme, rangeHours, settings }) {
  if (!rows.length) return <Empty />;
  const gridColor = chartTheme?.grid || '#151515';
  const tickColor = chartTheme?.tick || '#A3A3A3';
  const axisLineProp = chartTheme?.axis ? { stroke: chartTheme.axis } : false;
  const tickLineProp = chartTheme?.ticks ? { stroke: chartTheme.ticks } : false;
  return (
    <>
      <div className="analytics-chart">
        <ResponsiveContainer>
          <LineChart data={rows}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis 
              dataKey="time" 
              tick={{ fill: tickColor, fontSize: 9 }} 
              axisLine={axisLineProp} 
              tickLine={tickLineProp}
              minTickGap={35}
              interval="preserveStartEnd"
              tickFormatter={(t) => formatAxisTime(t, rangeHours, settings)}
            />
            <YAxis domain={[0, 100]} tick={{ fill: tickColor, fontSize: 9 }} axisLine={axisLineProp} tickLine={tickLineProp} tickFormatter={(value) => `${value}%`} />
            <Tooltip content={<Tip chartTheme={chartTheme} settings={settings} />} />
            <Area type="monotone" dataKey="pressure" name="Memory Pressure" stroke={colors.purple} fill={colors.purple} fillOpacity={0.16} strokeWidth={2} dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="pressure" name="Memory Pressure" stroke={colors.purple} strokeWidth={2} dot={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Stats rows={rows} keyName="pressure" suffix="%" />
    </>
  );
}

function Panel({
  title,
  subtitle,
  updated,
  server = '',
  timeRange = '',
  data = [],
  keys = [],
  legend = [],
  stats = null,
  children,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const panelRef = useRef(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDownload = async (format) => {
    try {
      if (format === 'csv') {
        if (!data || !data.length) {
          showToast('No data available for this time range.', true);
          return;
        }
        exportChartAsCsv({ title, data, keys });
        showToast('Downloaded CSV data successfully.');
      } else if (format === 'json') {
        if (!data || !data.length) {
          showToast('No data available for this time range.', true);
          return;
        }
        exportChartAsJson({ title, server, timeRange, metric: title, data, keys });
        showToast('Downloaded JSON telemetry successfully.');
      } else {
        await exportChartAsPng({
          containerElement: panelRef.current,
          title,
          subtitle,
          server,
          timeRange,
          legend,
          stats,
        });
        showToast('Downloaded PNG chart image successfully.');
      }
    } catch (err) {
      console.error('Export error:', err);
      showToast(format === 'png' ? 'Unable to export chart.' : 'Unable to export chart data.', true);
    }
  };

  return (
    <article className="analytics-panel" ref={panelRef}>
      <header className="analytics-panel-head">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <ChartActions
          title={title}
          onExpand={() => setModalOpen(true)}
          onDownload={handleDownload}
        />
      </header>

      {children}

      <small className="analytics-updated">Last updated {updated || '--:--:--'}</small>

      <ChartModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={title}
        subtitle={subtitle}
        server={server}
        timeRange={timeRange}
        updated={updated}
        onDownload={handleDownload}
      >
        {children}
      </ChartModal>

      {toast && (
        <div className={`chart-export-toast ${toast.isError ? 'error' : 'success'}`}>
          {toast.message}
        </div>
      )}
    </article>
  );
}

function Heatmap({ cores }) {
  if (!cores.length) return <Empty />;
  return (
    <div className="analytics-heatmap">
      {cores.map((core) => {
        const value = Number(core.usage);
        const background = value > 90 ? colors.red : value > 80 ? colors.orange : value > 60 ? '#eab308' : '#86efac';
        return (
          <div key={core.core} style={{ background }} title={`Core ${core.core}: ${format(value)}%`}>
            <small>Core {core.core}</small>
            <b>{format(value)}%</b>
          </div>
        );
      })}
    </div>
  );
}

function Donut({ memory }) {
  const data = [
    { name: 'Used', value: memory.used, color: colors.blue },
    { name: 'Free', value: memory.free, color: colors.green },
    { name: 'Cached', value: memory.cached, color: colors.orange },
  ].filter((item) => finite(item.value));
  if (!data.length) return <Empty />;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="analytics-donut">
      <ResponsiveContainer width="55%" height={210}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={2}>
            {data.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${format(value, 2)} GB`} />
        </PieChart>
      </ResponsiveContainer>
      <div className="analytics-donut-center">
        <strong>{total > 0 ? format((memory.used / total) * 100) : '--'}%</strong>
        <span>USED MEMORY</span>
      </div>
      <div className="analytics-donut-legend">
        {data.map((item) => (
          <span key={item.name}>
            <i style={{ background: item.color }} />
            {item.name}
            <b>{format(item.value)} GB</b>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsSection({ instance, serverId, serverName }) {
  const { chartTheme, settings } = useSettings();
  const [range, setRange] = useState(ranges[1]); // Default 30m
  const [isLive, setIsLive] = useState(true);
  const [data, setData] = useState({});
  const [updated, setUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  const refreshSec = Number(settings?.refresh_interval) || 5;
  const isAutoRefreshActive = isLive && settings?.refresh_interval !== 'off' && refreshSec > 0;

  const load = useCallback(async (isBackground = false) => {
    if (!instance || instance === 'ALL') return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentRequestId = ++requestIdRef.current;
    if (!isBackground) {
      setLoading(true);
    }
    setError(null);

    try {
      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          api.get(`/analytics/${endpoint}`, {
            params: {
              instance,
              server_id: serverId,
              range: range.label,
              hours: range.hours,
            },
            signal: controller.signal,
          }).then(unwrap)
        )
      );

      if (currentRequestId !== requestIdRef.current) {
        return; // Ignore stale responses
      }

      setData(Object.fromEntries(endpoints.map((endpoint, index) => [endpoint, responses[index] || {}])));

      const now = new Date();
      const tz = settings?.timezone && settings.timezone !== 'auto' ? settings.timezone : undefined;
      const is12h = settings?.time_format === '12h';
      const updatedStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: is12h,
      }).format(now);
      setUpdated(updatedStr);
      setError(null);
    } catch (err) {
      if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') {
        return;
      }
      if (currentRequestId === requestIdRef.current) {
        setError('Unable to load historical data.');
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [instance, serverId, range.label, range.hours, settings]);

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    if (!isAutoRefreshActive) return;
    const timer = window.setInterval(() => {
      load(true);
    }, refreshSec * 1000);
    return () => window.clearInterval(timer);
  }, [isAutoRefreshActive, refreshSec, load]);

  const cpu = data['cpu-timeline']?.cpu || [];
  const cores = data['cpu-cores']?.cores || [];
  const memory = data['memory-distribution'] || {};
  const memoryRows = merge(data['memory-trend'], ['used', 'free']);
  const networkRows = merge(data.network, ['incoming', 'outgoing']);
  const networkTrafficHistoryRows = merge(data['network-history'], ['incoming', 'outgoing']);
  const networkHistoricalRows = merge(data['network-historical'], ['incoming', 'outgoing']);
  const packetRows = merge(data.packets, ['received', 'sent']);
  const diskRows = merge(data['disk-io'], ['read', 'write']);
  const iopsRows = merge(data['disk-io'], ['readOps', 'writeOps']);
  const temperatureRows = merge(data.temperature, ['cpu', 'ssd']);
  const processRows = merge(data.processes, ['processes', 'threads']);
  const systemRows = merge(data['system-calls'], ['contextSwitches', 'systemCalls', 'queue']);

  // Database metrics history rows for Historical Performance section
  const dbHistory = data.history?.series || [];
  const dbHistoryCpu = useMemo(() => dbHistory.map((r) => ({ time: r.time, value: r.cpu })), [dbHistory]);
  const dbHistoryRam = useMemo(() => dbHistory.map((r) => ({ time: r.time, used: r.ram })), [dbHistory]);
  const dbHistoryNet = useMemo(() => dbHistory.map((r) => ({ time: r.time, incoming: r.networkReceive, outgoing: r.networkSend })), [dbHistory]);
  const dbHistoryDisk = useMemo(() => dbHistory.map((r) => ({ time: r.time, read: r.disk, write: r.disk })), [dbHistory]);
  const dbHistoryResource = useMemo(
    () =>
      dbHistory.map((r) => ({
        time: r.time,
        CPU: r.cpu,
        RAM: r.ram,
        Disk: r.disk,
        Network: r.network,
      })),
    [dbHistory]
  );

  const queueRows = useMemo(
    () => systemRows.map((row, index) => ({ ...row, average: summary(systemRows.slice(0, index + 1), 'queue').average })),
    [systemRows]
  );

  const resourceRows = useMemo(
    () =>
      (dbHistoryResource.length > 0 ? dbHistoryResource : cpu.map((row, index) => ({
        time: row.time,
        CPU: row.value,
        RAM: memoryRows[index]?.used,
        Disk: diskRows[index]?.write,
        Network: networkRows[index]?.incoming,
      }))),
    [dbHistoryResource, cpu, memoryRows, diskRows, networkRows]
  );

  const panel = (rows, keys, palette, type, title, subtitle, suffix = '', domain, thresholds) => (
    <Panel
      title={title}
      subtitle={subtitle}
      updated={updated}
      server={serverName || instance}
      timeRange={range.label}
      data={rows}
      keys={keys}
      legend={keys.map((k) => ({ name: k, color: palette[k] }))}
    >
      <Chart
        rows={rows}
        keys={keys}
        palette={palette}
        type={type}
        suffix={suffix}
        domain={domain}
        thresholds={thresholds}
        chartTheme={chartTheme}
        rangeHours={range.hours}
        settings={settings}
      />
    </Panel>
  );

  const thermal = (key) => {
    const values = summary(temperatureRows, key);
    const state = values.current > 80 ? 'Critical' : values.current > 70 ? 'Warning' : 'Healthy';
    return (
      <div className="thermal-item">
        <b>{key === 'cpu' ? 'CPU' : 'SSD'}</b>
        <strong>{format(values.current)} °C</strong>
        <span>Average {format(values.average)} · Peak {format(values.peak)}</span>
        <em className={state.toLowerCase()}>{state}</em>
      </div>
    );
  };

  const exportAllAnalytics = () => {
    try {
      exportChartAsJson({
        title: 'Full Prometheus & Database Telemetry Analytics',
        server: serverName || instance,
        timeRange: range.label,
        metric: 'all-analytics',
        data: [{
          timestamp: new Date().toISOString(),
          range: range.label,
          hours: range.hours,
          cpu,
          cores,
          memory,
          networkRows,
          diskRows,
          temperatureRows,
          processRows,
          systemRows,
          history: dbHistory,
        }],
      });
    } catch (err) {
      console.error(err);
    }
  };

  const sections = [
    ['CPU ANALYTICS', [
      panel(cpu, ['value'], { value: colors.green }, 'area', 'CPU usage live timeline', 'Windows exporter idle rate', '%', [0, 100]),
      <Panel title="CPU core utilization" subtitle="Highest core highlighted" updated={updated} server={serverName || instance} timeRange={range.label} data={cores} keys={['usage']} legend={[{ name: 'CPU Usage', color: colors.teal }]}><CoreChart cores={cores} chartTheme={chartTheme} /></Panel>,
      <Panel title="CPU load heatmap" subtitle="Utilization by core across range" updated={updated} server={serverName || instance} timeRange={range.label} data={cores} keys={['usage']}><Heatmap cores={cores} /></Panel>
    ]],
    ['MEMORY ANALYTICS', [
      panel(memoryRows, ['used', 'free'], { used: colors.blue, free: colors.green }, 'area', 'RAM usage timeline', 'Used and available memory', ' GB'),
      <Panel title="RAM usage distribution" subtitle="Used, free, and cached memory" updated={updated} server={serverName || instance} timeRange={range.label} data={[{ name: 'Used', value: memory.used }, { name: 'Free', value: memory.free }, { name: 'Cached', value: memory.cached }]} keys={['value']} legend={[{ name: 'Used', color: colors.blue }, { name: 'Free', color: colors.green }, { name: 'Cached', color: colors.orange }]}><Donut memory={memory} /></Panel>,
      <Panel title="Memory pressure timeline" subtitle="Commit ratio threshold bands" updated={updated} server={serverName || instance} timeRange={range.label} data={data['memory-pressure']?.pressure || []} keys={['pressure']} legend={[{ name: 'Memory Pressure', color: colors.purple }]}><PressureChart rows={data['memory-pressure']?.pressure || []} chartTheme={chartTheme} rangeHours={range.hours} settings={settings} /></Panel>
    ]],
    ['NETWORK ANALYTICS', [
      panel(networkRows, ['incoming', 'outgoing'], { incoming: colors.green, outgoing: colors.orange }, 'area', 'Network upload & download', 'Incoming and outgoing throughput', ' MB/s'),
      panel(networkTrafficHistoryRows, ['incoming', 'outgoing'], { incoming: colors.green, outgoing: colors.orange }, 'line', 'Network traffic history', 'Smoothed traffic rate', ' MB/s'),
      panel(packetRows, ['received', 'sent'], { received: colors.blue, sent: colors.orange }, 'line', 'Network packets timeline', 'Packets per second', ' p/s'),
      panel(networkHistoricalRows, ['incoming', 'outgoing'], { incoming: colors.purple, outgoing: colors.purple }, 'line', 'Network historical analytics', 'Selected time range', ' MB/s')
    ]],
    ['DISK ANALYTICS', [
      panel(diskRows, ['read', 'write'], { read: colors.blue, write: colors.orange }, 'area', 'Disk read vs write speed', 'C: volume throughput', ' MB/s'),
      panel(iopsRows, ['readOps', 'writeOps'], { readOps: colors.blue, writeOps: colors.orange }, 'line', 'Disk IOPS timeline', 'Read and write operations', ' IOPS'),
      panel(diskRows, ['read', 'write'], { read: colors.blue, write: colors.orange }, 'line', 'Disk usage timeline', 'C: volume activity', ' MB/s'),
      panel(diskRows, ['read', 'write'], { read: colors.blue, write: colors.orange }, 'line', 'Disk historical analytics', 'Disk usage and used GB', ' MB/s')
    ]],
    ['SYSTEM PERFORMANCE', [
      panel(processRows, ['processes', 'threads'], { processes: colors.green, threads: colors.blue }, 'area', 'Processes timeline', 'Processes and threads'),
      panel(systemRows, ['contextSwitches'], { contextSwitches: colors.purple }, 'line', 'Context switches timeline', 'Rate per second', ' /s'),
      panel(systemRows, ['systemCalls'], { systemCalls: colors.cyan }, 'line', 'System calls timeline', 'Rate per second', ' /s'),
      panel(queueRows, ['queue', 'average'], { queue: colors.orange, average: colors.blue }, 'line', 'Processor queue timeline', 'Queue length and moving average')
    ]],
    ['TEMPERATURE ANALYTICS', [
      panel(temperatureRows, ['cpu'], { cpu: colors.red }, 'line', 'CPU temperature timeline', '70 warning · 80 high · 90 critical', ' °C', undefined, [70, 80, 90]),
      panel(temperatureRows, ['ssd'], { ssd: colors.orange }, 'line', 'SSD temperature timeline', 'Composite temperature', ' °C'),
      <Panel title="Thermal health summary" subtitle="Current, average, and peak temperature" updated={updated} server={serverName || instance} timeRange={range.label} data={temperatureRows} keys={['cpu', 'ssd']} legend={[{ name: 'CPU', color: colors.red }, { name: 'SSD', color: colors.orange }]}><div className="thermal-summary">{thermal('cpu')}{thermal('ssd')}</div></Panel>
    ]],
    ['HISTORICAL PERFORMANCE', [
      panel(dbHistoryCpu.length > 0 ? dbHistoryCpu : cpu, ['value'], { value: colors.green }, 'line', 'CPU historical analytics', 'PostgreSQL database history', '%'),
      panel(dbHistoryRam.length > 0 ? dbHistoryRam : merge(data['memory-trend'], ['used']), ['used'], { used: colors.blue }, 'line', 'RAM historical analytics', 'PostgreSQL database history', ' GB'),
      panel(dbHistoryNet.length > 0 ? dbHistoryNet : networkHistoricalRows, ['incoming', 'outgoing'], { incoming: colors.purple, outgoing: colors.purple }, 'line', 'Network historical analytics', 'Incoming & outgoing throughput', ' MB/s'),
      panel(dbHistoryDisk.length > 0 ? dbHistoryDisk : diskRows, ['read', 'write'], { read: colors.blue, write: colors.orange }, 'line', 'Disk historical analytics', 'Disk activity history', ' MB/s'),
      panel(resourceRows, ['CPU', 'RAM', 'Disk', 'Network'], { CPU: colors.green, RAM: colors.blue, Disk: colors.orange, Network: colors.purple }, 'line', 'Resource comparison', 'CPU, RAM, disk, and network')
    ]],
  ];

  return (
    <section className="analytics-section">
      <div className="analytics-heading">
        <div>
          <span>ANALYTICS DASHBOARD</span>
          <h2>Live Performance Analytics</h2>
        </div>
        <div className="analytics-toolbar">
          <button
            type="button"
            className={`analytics-live-btn ${isLive ? 'active' : 'paused'}`}
            onClick={() => setIsLive((prev) => !prev)}
            title={isLive ? 'Live updates active (Click to pause)' : 'Live updates paused (Click to resume)'}
            aria-label={isLive ? 'Pause live updates' : 'Resume live updates'}
          >
            <i className={`analytics-live-dot ${isLive ? 'live-pulse' : ''}`} />
            <span>{isLive ? 'LIVE' : 'PAUSED'}</span>
          </button>
          <span className="analytics-refresh-badge">
            Auto Refresh {isLive && settings?.refresh_interval !== 'off' ? `${refreshSec}s` : 'Off'}
          </span>
          <select
            value={range.hours}
            onChange={(event) => {
              const selected = ranges.find((item) => item.hours === Number(event.target.value)) || ranges[1];
              setRange(selected);
            }}
            aria-label="Analytics time range"
          >
            {ranges.map((item) => (
              <option key={item.label} value={item.hours}>
                {item.label} ({item.name})
              </option>
            ))}
          </select>
          <button
            type="button"
            title="Export full analytics payload (JSON)"
            aria-label="Export full analytics payload"
            onClick={exportAllAnalytics}
          >
            <Download size={14} />
          </button>
          <button 
            type="button" 
            title="Refresh analytics" 
            aria-label="Refresh analytics" 
            onClick={() => load(false)}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'analytics-spin' : ''} />
          </button>
        </div>
      </div>

      {error && !Object.keys(data).length && (
        <div className="analytics-error-banner">
          <span>{error}</span>
          <button type="button" onClick={() => load(false)}>Retry</button>
        </div>
      )}

      {loading && !Object.keys(data).length ? (
        <div className="analytics-loading">Loading telemetry and history...</div>
      ) : (
        <div className={`analytics-content ${loading ? 'analytics-reloading' : ''}`}>
          {loading && <div className="analytics-reloading-indicator" />}
          {sections.map(([title, cards]) => (
            <React.Fragment key={title}>
              <div className="analytics-section-label">{title}</div>
              <div className="analytics-grid">
                {cards.map((card, i) => (
                  <React.Fragment key={i}>{card}</React.Fragment>
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </section>
  );
}