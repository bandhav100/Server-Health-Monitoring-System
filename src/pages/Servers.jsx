import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CircleAlert, CircleX, Cpu, RefreshCw, Search, Server, Wifi, X } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

const formatTime = (date) => date.toLocaleTimeString([], { hour12: false });
const formatPercent = (value) => (value == null ? '--' : `${Math.round(Number(value))}%`);
const formatUptime = (value) => {
  if (value == null) return '--';
  const totalMinutes = Math.max(0, Math.floor(Number(value) * 60));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return [days ? `${days}d` : '', hours ? `${hours}h` : '', `${minutes}m`].filter(Boolean).join(' ');
};
const metricValue = (value) => (value == null ? null : Math.min(100, Math.max(0, Number(value))));

const MetricBar = ({ value, tone }) => {
  const width = metricValue(value);
  return <div className="servers-metric"><div className="servers-metric-track"><span className={tone} style={{ width: width == null ? '0%' : `${width}%` }} /></div><strong>{formatPercent(value)}</strong></div>;
};

const Status = ({ status }) => {
  const normalized = status === 'healthy' ? 'healthy' : status === 'warning' ? 'warning' : 'offline';
  const Icon = normalized === 'healthy' ? Check : normalized === 'warning' ? CircleAlert : X;
  return <span className={`servers-status ${normalized}`}><Icon size={13} strokeWidth={2.5} />{normalized[0].toUpperCase() + normalized.slice(1)}</span>;
};

const KpiCard = ({ icon: Icon, label, value, tone }) => <div className="servers-kpi"><div className={`servers-kpi-icon ${tone}`}><Icon size={17} /></div><div><span>{label}</span><strong>{value}</strong></div></div>;

const Servers = () => {
  const { servers, serverOptions, refreshServers } = useDashboard();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('ALL');
  const [sort, setSort] = useState({ key: null, direction: 'desc' });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => setLastRefresh(new Date()), [servers]);

  const healthyCount = servers.filter((server) => server.status === 'healthy').length;
  const discoveredOptions = servers.length ? serverOptions : [];
  const onlineServers = servers.filter((server) => server.status === 'healthy');
  const averageCpu = onlineServers.length ? Math.round(onlineServers.reduce((total, server) => total + Number(server.cpu || 0), 0) / onlineServers.length) : null;
  const filteredServers = useMemo(() => {
    const search = query.trim().toLowerCase();
    const rows = servers.filter((server) => {
      const hostname = server.hostname || server.name || '';
      const matchesSearch = !search || `${hostname} ${server.ip || ''} ${server.prometheus_instance || ''}`.toLowerCase().includes(search);
      const matchesSelected = selected === 'ALL' || server.prometheus_instance === selected || hostname.toLowerCase() === selected.toLowerCase();
      return matchesSearch && matchesSelected;
    });
    if (!sort.key) return rows;
    return [...rows].sort((first, second) => {
      const firstValue = sort.key === 'status' ? first.status : Number(first[sort.key]);
      const secondValue = sort.key === 'status' ? second.status : Number(second[sort.key]);
      const result = sort.key === 'status' ? String(firstValue).localeCompare(String(secondValue)) : (Number.isNaN(firstValue) ? -1 : firstValue) - (Number.isNaN(secondValue) ? -1 : secondValue);
      return sort.direction === 'asc' ? result : -result;
    });
  }, [query, selected, servers, sort]);
  const toggleSort = (key) => setSort((current) => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }));
  const refresh = () => { refreshServers(); setLastRefresh(new Date()); };

  return (
    <motion.div
      className="servers-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <header className="servers-header">
        <div><div className="servers-title"><Server size={22} /><h1>Servers</h1></div><p>Live infrastructure inventory from Prometheus.</p></div>
        <div className="servers-badges">
          <span><Wifi size={14} />Connected Targets: <b>{servers.length}</b></span><span className="healthy"><Check size={14} />Online: <b>{healthyCount}</b></span><span className="offline"><CircleX size={14} />Offline: <b>{servers.length - healthyCount}</b></span><span>Last Refresh: <b>{formatTime(lastRefresh)}</b></span><span className="refresh-label"><RefreshCw size={14} />Auto Refresh: <b>15s</b></span>
        </div>
      </header>

      <section className="servers-kpi-grid" aria-label="Server summary">
        <KpiCard icon={Server} label="Total Servers" value={servers.length} tone="blue" /><KpiCard icon={Check} label="Healthy Servers" value={healthyCount} tone="green" /><KpiCard icon={CircleX} label="Offline Servers" value={servers.length - healthyCount} tone="red" /><KpiCard icon={Cpu} label="Average CPU Usage" value={averageCpu == null ? '--' : `${averageCpu}%`} tone="orange" />
      </section>

      <section className="servers-inventory">
        <div className="servers-toolbar"><label className="servers-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Server" aria-label="Search Server" /></label><select value={selected} onChange={(event) => setSelected(event.target.value)} aria-label="Server filter"><option value="ALL">All Servers</option>{discoveredOptions.map((option) => <option key={option.key} value={option.instance || option.key}>{option.name}</option>)}</select><button type="button" className="servers-refresh" onClick={refresh} title="Refresh server inventory"><RefreshCw size={16} />Refresh</button></div>
        <div className="servers-table-wrap"><table className="servers-table"><thead><tr><th>Hostname</th><th>IP Address</th><th>OS</th>{['cpu', 'ram', 'disk'].map((key) => <th key={key}><button type="button" onClick={() => toggleSort(key)}>{key.toUpperCase()} {sort.key === key ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</button></th>)}<th>Uptime</th><th><button type="button" onClick={() => toggleSort('status')}>Status {sort.key === 'status' ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</button></th></tr></thead><tbody>{filteredServers.map((server) => { const hostname = server.hostname || server.name || 'Unknown server'; return <tr key={server.id || server.prometheus_instance || hostname}><td><div className="servers-host"><span><Server size={16} /></span><div><strong>{server.displayName || hostname}</strong><small>{server.operating_system || 'Unknown operating system'}</small></div></div></td><td>{server.ip || server.tailscale_ip || '--'}</td><td>{server.operating_system || '--'}</td><td><MetricBar value={server.cpu} tone="blue" /></td><td><MetricBar value={server.ram} tone="orange" /></td><td><MetricBar value={server.disk} tone="red" /></td><td>{formatUptime(server.uptime)}</td><td><Status status={server.status} /></td></tr>; })}</tbody></table>{!filteredServers.length && <div className="servers-empty">No Prometheus targets match this view.</div>}</div>
      </section>

      <footer className="servers-footer"><span>Prometheus Targets: <b>{servers.length}</b></span><span>Windows Exporter Online: <b>{healthyCount}</b></span><span>Last Sync: <b>{formatTime(lastRefresh)}</b></span><span>Version: <b>SHMS v3.0</b></span></footer>
    </motion.div>
  );
};

export default Servers;
