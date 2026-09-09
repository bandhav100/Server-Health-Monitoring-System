import React, { useCallback, useEffect, useState } from 'react';
import { Activity, ArrowDown, ArrowUp, Bolt, CheckCircle2, CircleGauge, Cpu, HardDrive, MemoryStick, Monitor, RefreshCw, Server, Thermometer, Timer, XCircle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { unwrap } from '../api';
import { useServerContext } from '../context/ServerContext';

const colors = { cyan: '#4de1d2', blue: '#6ea8fe', green: '#5ee17b', yellow: '#f3c969', orange: '#f59e67', red: '#ff6b7a' };
const finite = (value) => value != null && Number.isFinite(Number(value));
const number = (value, digits = 1) => finite(value) ? Number(value).toFixed(digits) : '--';
const percent = (value) => finite(value) ? `${number(value)}%` : '--';
const gigabytes = (value) => finite(value) ? `${number(value, 2)} GB` : '--';
const uptime = (hours) => finite(hours) ? `${Math.floor(hours / 24)}d ${Math.floor(hours % 24)}h ${Math.floor((hours * 60) % 60)}m` : '--';
const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));
const valueFrom = (value) => finite(value) ? Number(value) : null;
const temperatureColor = (value) => !finite(value) ? colors.red : value > 85 ? colors.red : value > 75 ? colors.orange : value > 60 ? colors.yellow : colors.green;
const usageColor = (value) => !finite(value) ? colors.blue : value > 85 ? colors.red : value > 70 ? colors.orange : value > 50 ? colors.yellow : colors.green;
const voltageColor = (value) => !finite(value) ? colors.yellow : value <= 0.3 ? colors.green : value <= 0.7 ? colors.yellow : value <= 0.9 ? colors.orange : colors.red;

function Kpi({ icon: Icon, title, value, unit, color, meterValue, live = true, tooltip }) {
  const unavailable = title === 'GPU Voltage' && value === '--';
  const voltageTooltip = 'GPU Core Voltage\nLive sensor from LibreHardwareMonitor\nMetric: lhm_gpuamd_voltage_volts\nRefresh interval: 5 seconds';
  return <article className="live-kpi" title={tooltip || (title === 'GPU Voltage' ? voltageTooltip : undefined)}><div className="live-kpi-top"><span className="live-kpi-icon" style={{ color }}><Icon size={17} /></span><span className={`panel-signal${live && !unavailable ? '' : ' muted'}`}><i /> LIVE</span></div><small>{title}</small><strong>{value}<em>{title === 'GPU Voltage' && value === '--' ? ' V' : unit}</em></strong><div className="live-meter"><i style={{ width: `${finite(meterValue) ? clamp(meterValue) : 0}%`, background: color }} /></div><footer><span>Prometheus</span><span>5s</span></footer></article>;
}

function Panel({ title, subtitle, children }) {
  return <section className="live-panel"><header className="live-panel-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><span className="panel-signal"><i /> LIVE</span></header>{children}</section>;
}

function Empty({ message = 'No Prometheus data.' }) {
  return <div className="live-empty">{message}</div>;
}

function Gauge({ value, label }) {
  return <div className="gauge-center"><div className="live-gauge" style={{ '--gauge': `${clamp(value) * 3.6}deg`, '--gauge-color': clamp(value) > 80 ? colors.red : colors.green }}><strong>{percent(value)}</strong></div><span>{label}</span></div>;
}

export default function LiveMonitoring() {
  const { selectedServer, serverOptions, setSelectedServer } = useServerContext();
  const instance = selectedServer.instance;
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prometheusAvailable, setPrometheusAvailable] = useState(true);
  const [updated, setUpdated] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/monitoring/live', { params: { instance } });
      setMetrics(unwrap(response) || {});
      setPrometheusAvailable(true);
      setUpdated(new Date());
    } catch {
      setMetrics({ instance, up: null, status: 'unknown' });
      setPrometheusAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [instance]);

  useEffect(() => { load(); const timer = window.setInterval(load, 5000); return () => window.clearInterval(timer); }, [load, refresh]);

  const data = metrics || {};
  const offline = Number(data.up) === 0;
  const status = Number(data.up) === 1 ? 'ONLINE' : offline ? 'OFFLINE' : 'UNKNOWN';
  const totalMemory = valueFrom(data.memoryTotal);
  const freeMemory = valueFrom(data.memoryFree);
  const diskTotal = valueFrom(data.diskTotal);
  const diskFree = valueFrom(data.diskFree);
  const memoryUsed = finite(totalMemory) && finite(freeMemory) ? totalMemory - freeMemory : null;
  const memory = [{ name: 'Used', value: memoryUsed, color: colors.red }, { name: 'Free', value: freeMemory, color: colors.green }, { name: 'Cached', value: valueFrom(data.memoryCache), color: colors.blue }].filter((item) => finite(item.value) && item.value >= 0);
  const diskUsed = finite(diskTotal) && finite(diskFree) ? diskTotal - diskFree : null;
  const coreUsage = (data.coreUsage || []).map((item) => ({ core: item.core || 'CPU', usage: item.value }));
  const gpuVoltage = valueFrom(data.gpuVoltage);
  const kpis = [[Cpu, 'CPU Usage', percent(data.cpuUsage), '', colors.cyan, data.cpuUsage], [MemoryStick, 'RAM Usage', percent(data.ramUsage), '', colors.blue, data.ramUsage], [HardDrive, 'Disk Usage', percent(data.diskUsage), '', colors.orange, data.diskUsage], [Thermometer, 'CPU Temperature', number(data.cpuTemperature), ' °C', temperatureColor(data.cpuTemperature), data.cpuTemperature], [Monitor, 'GPU Usage', percent(data.gpuUsage), '', usageColor(data.gpuUsage), data.gpuUsage], [Activity, 'GPU Clock', number(data.gpuClock, 2), ' GHz', colors.cyan, data.gpuClock], [Bolt, 'GPU Voltage', number(data.gpuVoltage, 2), ' V', colors.yellow, data.gpuVoltage], [MemoryStick, 'GPU Memory Used', number(data.gpuMemoryUsed, 0), ' MB', colors.blue, null], [HardDrive, 'SSD Temperature', number(data.ssdTemperature), ' °C', temperatureColor(data.ssdTemperature), data.ssdTemperature], [ArrowDown, 'Network Incoming', number(data.networkReceive, 2), ' MB/s', colors.green, null], [ArrowUp, 'Network Outgoing', number(data.networkSend, 2), ' MB/s', colors.orange, null], [HardDrive, 'Disk Read Speed', number(data.diskRead, 2), ' MB/s', colors.blue, null], [HardDrive, 'Disk Write Speed', number(data.diskWrite, 2), ' MB/s', colors.red, null], [Activity, 'Total Processes', number(data.processCount, 0), '', colors.cyan, null], [Activity, 'Total Threads', number(data.threads, 0), '', colors.blue, null], [CircleGauge, 'Context Switches / sec', number(data.contextSwitches, 2), ' /s', colors.yellow, null], [CircleGauge, 'Processor Queue Length', number(data.queueLength, 2), '', colors.orange, null], [Timer, 'System Uptime', uptime(data.uptime), '', colors.green, null], [Activity, 'System Calls / sec', number(data.systemCalls, 2), ' /s', colors.cyan, null], [Activity, 'Exceptions / sec', number(data.exceptions, 2), ' /s', colors.orange, null], [ArrowDown, 'Available Memory', gigabytes(freeMemory / 1024 / 1024 / 1024), '', colors.green, null], [ArrowUp, 'Used Memory', gigabytes(memoryUsed / 1024 / 1024 / 1024), '', colors.orange, null], [status === 'ONLINE' ? CheckCircle2 : XCircle, 'Server Status', status, '', status === 'ONLINE' ? colors.green : colors.red, null]];

  kpis[6] = [Bolt, 'GPU Voltage', finite(gpuVoltage) ? gpuVoltage.toFixed(3) : '--', ' V', voltageColor(gpuVoltage), finite(gpuVoltage) ? (gpuVoltage / 1.2) * 100 : null, 'GPU Core Voltage\nLive sensor from LibreHardwareMonitor\nMetric: lhm_gpuamd_voltage_volts\nRefresh interval: 5 seconds', prometheusAvailable];

  return <main className="live-console"><header className="live-console-head"><div><div className="live-overline"><span className="live-pulse" /> SHMS / INFRASTRUCTURE OPERATIONS</div><h1>Live Monitoring</h1><p>Prometheus telemetry for Windows Exporter targets</p></div><div className="live-identity"><span className={status === 'ONLINE' ? 'online' : 'offline'}><i /> {status}</span><span>{instance}</span><span>Updated {updated?.toLocaleTimeString() || '--:--:--'}</span><button className="live-icon-button" title="Refresh live data" onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={16} /></button></div></header>
    <section className="live-toolbar"><Server size={16} /><select value={selectedServer.key} onChange={(event) => setSelectedServer(event.target.value)} aria-label="Select server">{serverOptions.filter((option) => option.key !== 'ALL').map((option) => <option key={option.key} value={option.key}>{option.name} · {option.instance}</option>)}</select><span className="live-target"><span className="live-pulse" /> windows_exporter</span><span className="live-refresh-note"><RefreshCw size={13} /> Auto refresh 5s</span></section>
    {offline && <div className="live-offline"><XCircle size={18} /><div><b>Server Offline</b><span>Prometheus reports up = 0. No Prometheus data is available; retrying after refresh.</span></div></div>}
    <div className="live-section-title"><span>Live KPI cards</span><small>{kpis.length} signals · {selectedServer.name}</small></div><section className="live-kpi-grid">{loading && !metrics ? <Empty message="Loading Prometheus data..." /> : kpis.map(([icon, title, value, unit, color, meterValue]) => <Kpi key={title} icon={icon} title={title} value={offline ? '--' : value} unit={offline ? '' : unit} color={color} meterValue={offline ? null : meterValue} />)}</section>
    <div className="live-section-title"><span>Analytics</span><small>Current state from the selected Windows Exporter target</small></div><section className="live-grid live-grid-3"><Panel title="CPU core utilization" subtitle="Usage % by CPU core">{coreUsage.length ? <ResponsiveContainer width="100%" height={250}><BarChart data={coreUsage}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="core" /><YAxis domain={[0, 100]} unit="%" /><Tooltip formatter={(value) => `${number(value)}%`} /><Bar dataKey="usage" fill={colors.cyan} /></BarChart></ResponsiveContainer> : <Empty />}</Panel><Panel title="Memory distribution" subtitle="Used, free, and cached RAM">{memory.length ? <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={memory} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86}>{memory.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value) => `${number(Number(value) / 1024 / 1024 / 1024, 2)} GB`} /></PieChart></ResponsiveContainer> : <Empty />}</Panel><Panel title="Disk capacity" subtitle="C: volume"><div className="gauge-center"><Gauge value={data.diskUsage} label="USED" /><p>{gigabytes(diskUsed / 1024 / 1024 / 1024)} used of {gigabytes(diskTotal / 1024 / 1024 / 1024)}</p></div></Panel></section>
    <section className="live-grid live-grid-2"><Panel title="Network distribution" subtitle="Incoming and outgoing MB/s"><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={[{ name: 'Incoming', value: data.networkReceive }, { name: 'Outgoing', value: data.networkSend }].filter((item) => finite(item.value))} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86}>{[colors.green, colors.orange].map((color) => <Cell key={color} fill={color} />)}</Pie><Tooltip formatter={(value) => `${number(value, 2)} MB/s`} /></PieChart></ResponsiveContainer></Panel><Panel title="Memory pressure" subtitle="Committed memory / commit limit"><Gauge value={data.commitPressure} label="COMMIT PRESSURE" /></Panel></section>
  </main>;
}
