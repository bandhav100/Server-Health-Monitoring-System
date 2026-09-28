import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Download, Search, X } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import api, { unwrap } from '../api';
import { AlertChartPanel, AlertHistoryTable, AlertSummaryCards, AlertTimelineChart, CategoryBarChart, EmptyAlerts, LiveAlertTable, SeverityDonutChart, TopServersTable } from '../components/Alerts/AlertComponents';
import '../components/Alerts/Alerts.css';

const ranges = [['1h', 'Last Hour'], ['6h', 'Last 6 Hours'], ['24h', 'Last 24 Hours'], ['7d', 'Last 7 Days']];
const pageSize = 20;
const Alerts = () => {
  const { selectedServer, selectedServerKey } = useDashboard();
  const [summary, setSummary] = useState(null); const [live, setLive] = useState([]); const [history, setHistory] = useState([]); const [distribution, setDistribution] = useState([]); const [categories, setCategories] = useState([]); const [topServers, setTopServers] = useState([]); const [timeline, setTimeline] = useState([]); const [range, setRange] = useState('24h'); const [filter, setFilter] = useState('ALL'); const [search, setSearch] = useState(''); const [historySeverity, setHistorySeverity] = useState('ALL'); const [historyStatus, setHistoryStatus] = useState('ALL'); const [page, setPage] = useState(1); const [loading, setLoading] = useState(true); const [toast, setToast] = useState(''); const [details, setDetails] = useState(null); const [hiddenResolved, setHiddenResolved] = useState(false);
  const serverParams = selectedServerKey === 'ALL' ? {} : { server_id: selectedServer?.id };
  const query = (path, params = {}) => api.get(path, { params: { ...serverParams, ...params } });

  useEffect(() => {
    if (selectedServerKey !== 'ALL' && !selectedServer?.id) return undefined;
    let cancelled = false;
    const load = async () => {
      try {
        const responses = await Promise.all([query('/alerts/summary'), query('/alerts/live'), query('/alerts/history', { days: range === '7d' ? 7 : range === '24h' ? 1 : 1, limit: 100 }), query('/alerts/severity-distribution'), query('/alerts/categories'), query('/alerts/top-servers'), query('/alerts/timeline', { range })]);
        if (cancelled) return;
        const nextLive = unwrap(responses[1]) || []; const nextSummary = unwrap(responses[0]);
        setSummary(nextSummary); setLive(nextLive); setHistory(unwrap(responses[2])?.alerts || []); setDistribution(unwrap(responses[3]) || []); setCategories(unwrap(responses[4]) || []); setTopServers(unwrap(responses[5]) || []); setTimeline(unwrap(responses[6]) || []);
      } catch (error) { if (!cancelled) setToast('Alert data could not be refreshed'); } finally { if (!cancelled) setLoading(false); }
    };
    setLoading(true); load(); const interval = window.setInterval(load, 5000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [selectedServer?.id, selectedServerKey, range]);

  const visibleLive = useMemo(() => live.filter((alert) => (filter === 'ALL' || alert.severity.toUpperCase() === filter) && (!search || `${alert.metric} ${alert.server_name} ${alert.description}`.toLowerCase().includes(search.toLowerCase()))), [live, filter, search]);
  const visibleHistory = useMemo(() => history.filter((alert) => (!hiddenResolved || alert.status !== 'RESOLVED') && (historySeverity === 'ALL' || alert.severity.toUpperCase() === historySeverity) && (historyStatus === 'ALL' || alert.status === historyStatus)), [history, hiddenResolved, historySeverity, historyStatus]);
  const pagedHistory = visibleHistory.slice((page - 1) * pageSize, page * pageSize);
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3500); };
  const refreshAfterAction = async () => { const response = await query('/alerts/live'); const active = unwrap(response) || []; setLive(active); };
  const acknowledge = async (id) => { await api.post(`/alerts/${id}/acknowledge`); await refreshAfterAction(); notify('Alert acknowledged'); };
  const resolve = async (id) => { await api.post(`/alerts/${id}/resolve`); await refreshAfterAction(); notify('Alert resolved'); };
  const acknowledgeAll = async () => { await api.post('/alerts/acknowledge-all', { ...serverParams }); await refreshAfterAction(); notify('All active alerts acknowledged'); };
  const clearResolved = async () => { await api.delete('/alerts/clear-resolved', { params: serverParams }); setHiddenResolved(true); notify('Resolved alerts cleared from this view'); };
  const exportAlerts = () => { const rows = visibleHistory.map((alert) => [alert.created_at, alert.server_name, alert.metric, alert.current_value, alert.threshold_value, alert.severity, alert.status]); const csv = [['Time', 'Server', 'Metric', 'Value', 'Threshold', 'Severity', 'Status'], ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); const link = document.createElement('a'); link.href = url; link.download = 'shms-alerts.csv'; link.click(); URL.revokeObjectURL(url); };

  return <main className="alerts-page">
    <header className="alerts-header"><div className="alerts-title"><span><AlertCircle size={20} /></span><div><h1>Alerts</h1><p>Real-time Infrastructure Alert Center</p></div></div><div className="alerts-meta"><span className="live"><i /> LIVE</span><span>Auto refresh 5s</span><span>{summary?.last_updated ? new Date(summary.last_updated).toLocaleTimeString() : 'Updating'}</span></div></header>
    <div className="alerts-toolbar"><div className="alerts-filter-group"><Search size={14} color="#94A3B8" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search alert" /><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">All severities</option><option value="CRITICAL">Critical</option><option value="WARNING">Warning</option><option value="INFO">Info</option></select></div><div className="alerts-toolbar-actions"><button className="primary" onClick={exportAlerts}><Download size={13} /> Export Alerts</button><button onClick={acknowledgeAll}>Mark All Read</button><button onClick={clearResolved}>Clear Resolved</button></div></div>
    <h2 className="alerts-section-label">Alert overview</h2><AlertSummaryCards summary={summary} loading={loading} />
    <h2 className="alerts-section-label">Live alerts</h2><section className="alerts-panel"><div className="alerts-panel-heading"><div><h2>Active infrastructure signals</h2><p>Prometheus and prediction thresholds evaluated continuously</p></div><span className="alerts-meta">{visibleLive.length} shown</span></div>{visibleLive.length ? <LiveAlertTable alerts={visibleLive} onAcknowledge={acknowledge} onResolve={resolve} onDetails={setDetails} /> : <EmptyAlerts message="No active alerts in the selected scope." />}</section>
    <h2 className="alerts-section-label">Alert analytics</h2>
    <section className="alerts-chart-grid">
      <AlertChartPanel
        title="Alert timeline"
        subtitle="Alerts grouped by hour"
        timeRange={ranges.find(([v]) => v === range)?.[1] || range}
        server={selectedServer?.name || 'All Servers'}
        data={timeline}
        keys={['critical', 'warning', 'info']}
        legend={[
          { name: 'Critical', color: '#DC2626' },
          { name: 'Warning', color: '#D97706' },
          { name: 'Info', color: '#2563EB' },
        ]}
        controls={
          <select value={range} onChange={(event) => setRange(event.target.value)} aria-label="Alert timeline range">
            {ranges.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        }
      >
        {timeline.length ? <AlertTimelineChart data={timeline} /> : <EmptyAlerts message="No alert activity in this range." />}
      </AlertChartPanel>

      <AlertChartPanel
        title="Severity distribution"
        subtitle="All persisted alert records"
        server={selectedServer?.name || 'All Servers'}
        data={distribution}
        keys={['value']}
        legend={distribution.map((item) => ({
          name: item.name,
          color: { Critical: '#DC2626', Warning: '#D97706', Info: '#2563EB', Resolved: '#94A3B8' }[item.name] || '#94A3B8',
        }))}
      >
        <SeverityDonutChart data={distribution} />
      </AlertChartPanel>
    </section>

    <section className="alerts-two-grid">
      <AlertChartPanel
        title="Alert categories"
        subtitle="Triggered metrics by category"
        server={selectedServer?.name || 'All Servers'}
        data={categories}
        keys={['count']}
        legend={[{ name: 'Alerts', color: '#2563EB' }]}
      >
        <CategoryBarChart data={categories} />
      </AlertChartPanel>
      <div className="alerts-panel">
        <div className="alerts-panel-heading">
          <div>
            <h2>Top triggered servers</h2>
            <p>Highest alert volume</p>
          </div>
        </div>
        {topServers.length ? <TopServersTable servers={topServers} /> : <EmptyAlerts message="No server alert activity." />}
      </div>
    </section>
    <h2 className="alerts-section-label">Alert history</h2><section className="alerts-panel"><div className="alerts-panel-heading"><div><h2>Historical alert records</h2><p>Newest records first</p></div></div><div className="alerts-history-filters"><select value={historySeverity} onChange={(event) => { setHistorySeverity(event.target.value); setPage(1); }}><option value="ALL">All severities</option><option value="CRITICAL">Critical</option><option value="WARNING">Warning</option><option value="INFO">Info</option></select><select value={historyStatus} onChange={(event) => { setHistoryStatus(event.target.value); setPage(1); }}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="ACKNOWLEDGED">Acknowledged</option><option value="RESOLVED">Resolved</option></select></div>{pagedHistory.length ? <AlertHistoryTable alerts={pagedHistory} /> : <EmptyAlerts message="No historical alerts match these filters." />}<div className="alerts-pagination"><button disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {Math.max(1, Math.ceil(visibleHistory.length / pageSize))}</span><button disabled={page >= Math.ceil(visibleHistory.length / pageSize)} onClick={() => setPage((current) => current + 1)}>Next</button></div></section>
    {details && <div className="alerts-details-overlay" onClick={() => setDetails(null)}><div className="alerts-details-modal" onClick={(event) => event.stopPropagation()}><header><h2>Alert details</h2><button onClick={() => setDetails(null)}><X size={18} /></button></header><div className="alerts-details"><strong>{details.title}</strong><span>{details.description}</span><span>Server: {details.server_name}</span><span>Current {Number(details.current_value ?? 0).toFixed(2)} / threshold {Number(details.threshold_value ?? 0).toFixed(2)}</span><span>Status: {details.status}</span></div></div></div>}
    {toast && <div className="alert-toast">{toast}</div>}
  </main>;
};
export default Alerts;
