import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Bell, Box, CalendarDays, ChevronLeft, ChevronRight,
  CircleAlert, Clock3, Download, FileText, RefreshCw, Search, Server, Settings2,
  ShieldCheck, User, UserRoundCheck, XCircle, DoorOpen,
} from 'lucide-react';
import api, { unwrap } from '../api';

const PAGE_SIZE = 25;
const REFRESH_MS = 15000;
const severityStyles = {
  INFO: 'info', SUCCESS: 'success', WARNING: 'warning', ERROR: 'error', CRITICAL: 'critical',
};
const severityColors = { SUCCESS: '#16a34a', INFO: '#2563eb', WARNING: '#d97706', ERROR: '#dc2626', CRITICAL: '#991b1b' };

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
  if (text.includes('predict')) return 'Predictions';
  if (text.includes('alert')) return 'Alerts';
  if (text.includes('server') || text.includes('monitor')) return 'Monitoring';
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
  if (text.includes('predict')) return CircleAlert;
  if (text.includes('docker') || text.includes('container')) return Box;
  if (text.includes('setting')) return Settings2;
  return FileText;
};

const parseDate = (log) => new Date(log.created_at || log.timestamp);
const formatDate = (date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const formatTime = (date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const formatLastRefresh = (date) => date ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : 'Waiting...';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ search: '', actor: '', action: '', severity: '', dateFrom: '', dateTo: '' });
  const [page, setPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get('/logs', { params: { days: 30, limit: 1000 } });
      setLogs(unwrap(response)?.logs || []);
      setLastRefresh(new Date());
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const decorate = (log) => ({ ...log, severity: getSeverity(log), module: getModule(log) });
  const enrichedLogs = logs.map(decorate);
  const filteredLogs = enrichedLogs.filter((log) => {
    const date = parseDate(log);
    const searchText = normalized(`${log.actor} ${log.action} ${log.details} ${log.module}`);
    return (!filters.search || searchText.includes(normalized(filters.search)))
      && (!filters.actor || normalized(log.actor).includes(normalized(filters.actor)))
      && (!filters.action || normalized(log.action).includes(normalized(filters.action)))
      && (!filters.severity || log.severity === filters.severity)
      && (!filters.dateFrom || date.toISOString().slice(0, 10) >= filters.dateFrom)
      && (!filters.dateTo || date.toISOString().slice(0, 10) <= filters.dateTo);
  });
  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const visibleLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = enrichedLogs.filter((log) => parseDate(log).toISOString().slice(0, 10) === today);
  const count = (predicate) => enrichedLogs.filter(predicate).length;
  const successfulLogins = count((log) => normalized(log.action).includes('login') && log.severity === 'SUCCESS');
  const failedLogins = count((log) => normalized(log.action).includes('login') && log.severity === 'ERROR');
  const errorEvents = count((log) => ['ERROR', 'CRITICAL'].includes(log.severity));
  const distribution = ['SUCCESS', 'INFO', 'WARNING', 'ERROR'].map((severity) => ({ severity, count: count((log) => log.severity === severity) }));
  const maxActionCount = Math.max(1, ...Object.values(enrichedLogs.reduce((result, log) => { result[log.action] = (result[log.action] || 0) + 1; return result; }, {})));
  const actionCounts = Object.entries(enrichedLogs.reduce((result, log) => { result[log.action] = (result[log.action] || 0) + 1; return result; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const download = async (format) => {
    const response = await api.get(`/logs/download/${format}`);
    const data = unwrap(response);
    const content = format === 'csv' ? data.csv : JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `shms-logs.${format}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const updateFilter = (key, value) => { setPage(1); setFilters((current) => ({ ...current, [key]: value })); };
  const donutTotal = distribution.reduce((total, item) => total + item.count, 0);
  const donutStyle = distribution.reduce((result, item, index) => {
    const start = distribution.slice(0, index).reduce((total, entry) => total + entry.count, 0) / Math.max(1, donutTotal) * 100;
    const end = start + (item.count / Math.max(1, donutTotal) * 100);
    return `${result}${severityColors[item.severity]} ${start}% ${end}%, `;
  }, '').slice(0, -2);

  return (
    <motion.div className="logs-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <header className="logs-header">
        <div className="logs-heading"><span className="logs-heading-icon"><FileText size={20} /></span><div><h1>Logs</h1><p>System and application audit logs.</p></div></div>
        <div className="logs-badges">
          <span><b>{todayLogs.length}</b>Total logs today</span><span><b>{successfulLogins}</b>Login events</span><span><b>{count((log) => log.severity === 'WARNING')}</b>Warning events</span><span><b>{errorEvents}</b>Error events</span><span className="logs-refresh-badge"><Clock3 size={13} /> {formatLastRefresh(lastRefresh)} <small>· 15s</small></span>
        </div>
      </header>

      <section className="logs-kpis" aria-label="Log summary">
        <Kpi icon={FileText} tone="blue" label="Total logs" value={enrichedLogs.length} subtitle="All events in the live window" />
        <Kpi icon={UserRoundCheck} tone="green" label="Successful logins" value={successfulLogins} subtitle="Authenticated sessions" />
        <Kpi icon={XCircle} tone="red" label="Failed logins" value={failedLogins} subtitle="Rejected login attempts" />
        <Kpi icon={ShieldCheck} tone="orange" label="Error events" value={errorEvents} subtitle="Errors and critical events" />
      </section>

      <section className="logs-toolbar" aria-label="Log filters">
        <label className="logs-search"><Search size={15} /><input placeholder="Search logs..." value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} /></label>
        <select value={filters.actor} onChange={(event) => updateFilter('actor', event.target.value)}><option value="">All actors</option>{[...new Set(logs.map((log) => log.actor).filter(Boolean))].map((actor) => <option key={actor} value={actor}>{actor}</option>)}</select>
        <select value={filters.action} onChange={(event) => updateFilter('action', event.target.value)}><option value="">All actions</option>{[...new Set(logs.map((log) => log.action).filter(Boolean))].map((action) => <option key={action} value={action}>{action}</option>)}</select>
        <select value={filters.severity} onChange={(event) => updateFilter('severity', event.target.value)}><option value="">All severity</option>{Object.keys(severityStyles).map((severity) => <option key={severity} value={severity}>{severity}</option>)}</select>
        <label className="logs-date"><CalendarDays size={14} /><input aria-label="From date" type="date" value={filters.dateFrom} onChange={(event) => updateFilter('dateFrom', event.target.value)} /></label>
        <label className="logs-date"><span>to</span><input aria-label="To date" type="date" value={filters.dateTo} onChange={(event) => updateFilter('dateTo', event.target.value)} /></label>
        <button className="logs-icon-button" title="Refresh logs" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'logs-spin' : ''} /></button>
        <button className="logs-export" onClick={() => download('csv')}><Download size={14} /> CSV</button>
        <button className="logs-export" onClick={() => download('json')}><Download size={14} /> JSON</button>
      </section>

      <div className="logs-main-grid">
        <section className="logs-table-card">
          <div className="logs-card-heading"><div><h2>Audit events</h2><p>{filteredLogs.length} matching events</p></div><span className={`logs-connection ${connected ? 'connected' : 'disconnected'}`}><i /> {connected ? 'Backend connected' : 'Backend unavailable'}</span></div>
          <div className="logs-table-wrap"><table className="logs-table"><thead><tr><th>Time</th><th>Severity</th><th>Actor</th><th>Action</th><th>Module</th><th>Details</th><th>Status</th></tr></thead><tbody>{visibleLogs.map((log) => <LogRow key={log.id} log={log} />)}</tbody></table>{!visibleLogs.length && <div className="logs-empty">{loading ? 'Loading live logs...' : 'No logs match the selected filters.'}</div>}</div>
          <div className="logs-pagination"><span>Showing {filteredLogs.length ? (page - 1) * PAGE_SIZE + 1 : 0}-{Math.min(page * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}</span><div><button title="Previous page" disabled={page === 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={15} /></button><strong>Page {page} of {pageCount}</strong><button title="Next page" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}><ChevronRight size={15} /></button></div></div>
        </section>
        <aside className="logs-side-column"><ActivityTimeline logs={enrichedLogs.slice(0, 10)} /><section className="logs-chart-card"><div className="logs-card-heading"><div><h2>Event distribution</h2><p>Severity across live logs</p></div></div><div className="logs-distribution"><div className="logs-donut" style={{ background: `conic-gradient(${donutStyle || '#e5e7eb 0 100%'})` }}><div><b>{donutTotal}</b><span>events</span></div></div><div className="logs-legend">{distribution.map((item) => <span key={item.severity}><i style={{ background: severityColors[item.severity] }} />{item.severity}<b>{item.count}</b></span>)}</div></div><div className="logs-actions-title">Top log actions</div><div className="logs-bars">{actionCounts.length ? actionCounts.map(([action, actionCount]) => <div className="logs-bar-row" key={action}><span>{action}</span><div><i style={{ width: `${actionCount / maxActionCount * 100}%` }} /></div><b>{actionCount}</b></div>) : <div className="logs-empty">No action data yet.</div>}</div></section></aside>
      </div>
      <footer className="logs-footer"><span><b>{filteredLogs.length}</b> total logs loaded</span><span>Current page <b>{page}</b></span><span>Last sync <b>{formatLastRefresh(lastRefresh)}</b></span><span className={connected ? 'footer-ok' : 'footer-bad'}><i /> {connected ? 'Backend connected' : 'Backend disconnected'}</span><span className="footer-muted">Prometheus connected</span><span className="footer-version">SHMS v3.0</span></footer>
    </motion.div>
  );
};

const Kpi = ({ icon: Icon, tone, label, value, subtitle }) => <article className="logs-kpi"><span className={`logs-kpi-icon ${tone}`}><Icon size={17} /></span><div><span>{label}</span><strong>{value}</strong><small>{subtitle}</small></div></article>;
const LogRow = ({ log }) => { const Icon = getActionIcon(log.action); const date = parseDate(log); return <tr><td className="logs-time"><span>{formatDate(date)}</span><small>{formatTime(date)}</small></td><td><span className={`severity-pill ${severityStyles[log.severity]}`}>{log.severity}</span></td><td className="logs-actor">{log.actor || 'System'}</td><td><span className="logs-action">{React.createElement(Icon, { size: 14 })}{log.action || 'Event'}</span></td><td><span className="logs-module">{log.module}</span></td><td className="logs-details" title={asText(log.details)}>{log.details || 'No details recorded'}</td><td><span className={`logs-status ${log.severity === 'ERROR' || log.severity === 'CRITICAL' ? 'failed' : 'completed'}`}>{getStatus(log.severity)}</span></td></tr>; };
const ActivityTimeline = ({ logs }) => <section className="logs-activity-card"><div className="logs-card-heading"><div><h2>Recent activity</h2><p>Latest 10 events</p></div><ActivityIcon /></div><div className="logs-timeline">{logs.length ? logs.map((log) => <div className="logs-timeline-item" key={log.id}><i className={severityStyles[log.severity]} /><div><b>{log.actor || 'System'}</b><span>{log.details || log.action}</span><small>{formatTime(parseDate(log))}</small></div></div>) : <div className="logs-empty">No recent activity.</div>}</div></section>;
const ActivityIcon = () => <span className="logs-card-symbol"><AlertTriangle size={14} /></span>;

export default Logs;
