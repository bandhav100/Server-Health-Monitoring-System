import React, { useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Server, ShieldAlert } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSettings } from '../../context/SettingsContext';
import ChartActions from '../UI/ChartActions';
import ChartModal from '../UI/ChartModal';
import { exportChartAsCsv, exportChartAsJson, exportChartAsPng } from '../../utils/chartExport';

const severityIcon = { Critical: AlertCircle, Warning: AlertTriangle, Info, Healthy: CheckCircle2 };
export const SeverityBadge = ({ severity }) => { const Icon = severityIcon[severity?.replace(/^[a-z]/, (letter) => letter.toUpperCase())] || Info; const normalized = (severity || 'Info').toLowerCase(); return <span className={`alert-severity ${normalized}`}><Icon size={12} /> {severity || 'Info'}</span>; };
export const StatusBadge = ({ status }) => <span className={`alert-status ${(status || 'ACTIVE').toLowerCase()}`}>{status || 'ACTIVE'}</span>;
export const AlertSummaryCards = ({ summary, loading }) => { const cards = [{ label: 'Active Alerts', value: summary?.active_alerts, tone: summary?.active_alerts ? 'critical' : 'healthy', icon: ShieldAlert }, { label: 'Critical Alerts', value: summary?.critical_alerts, tone: 'critical', icon: AlertCircle }, { label: 'Warning Alerts', value: summary?.warning_alerts, tone: 'warning', icon: AlertTriangle }, { label: 'Resolved Today', value: summary?.resolved_today, tone: 'info', icon: CheckCircle2 }]; return <section className="alerts-summary-grid">{cards.map(({ label, value, tone, icon: Icon }) => <article className={`alerts-summary-card ${tone}`} key={label}><span><Icon size={17} /></span><div><p>{label}</p><strong>{loading ? '...' : value}</strong></div></article>)}</section>; };

export const LiveAlertTable = ({ alerts, onAcknowledge, onResolve, onDetails }) => <div className="alerts-table-scroll"><table className="alerts-table"><thead><tr><th>Severity</th><th>Metric</th><th>Server</th><th>Current</th><th>Threshold</th><th>Status</th><th>Time</th><th>Actions</th></tr></thead><tbody>{alerts.map((alert) => <tr key={alert.id}><td><SeverityBadge severity={alert.severity} /></td><td><b>{alert.metric}</b><small>{alert.category}</small></td><td><span className="alert-server"><Server size={12} />{alert.server_name}</span></td><td>{Number(alert.current_value ?? 0).toFixed(2)}</td><td>{Number(alert.threshold_value ?? 0).toFixed(2)}</td><td><StatusBadge status={alert.status} /></td><td>{new Date(alert.created_at).toLocaleString()}</td><td><div className="alert-actions">{alert.status === 'ACTIVE' && <button onClick={() => onAcknowledge(alert.id)}>Acknowledge</button>}<button onClick={() => onResolve(alert.id)}>Resolve</button><button onClick={() => onDetails(alert)}>Details</button></div></td></tr>)}</tbody></table></div>;

const chartTooltip = ({ active, payload, label }) => active && payload?.length ? <div className="alerts-tooltip"><strong>{new Date(label).toLocaleString()}</strong>{payload.map((item) => <span key={item.dataKey} style={{ color: item.color }}>{item.name}: {item.value}</span>)}</div> : null;
export const AlertTimelineChart = ({ data }) => {
  const { chartTheme } = useSettings();
  return <div className="alerts-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid stroke={chartTheme?.grid || '#E8EDF3'} vertical={false} /><XAxis dataKey="time" tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} tick={{ fontSize: 10, fill: chartTheme?.tick || '#94A3B8' }} minTickGap={24} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: chartTheme?.tick || '#94A3B8' }} /><Tooltip content={chartTooltip} /><Bar dataKey="critical" name="Critical" stackId="severity" fill="#DC2626" /><Bar dataKey="warning" name="Warning" stackId="severity" fill="#D97706" /><Bar dataKey="info" name="Info" stackId="severity" fill="#2563EB" /></BarChart></ResponsiveContainer></div>;
};
export const SeverityDonutChart = ({ data }) => <div className="alerts-donut"><ResponsiveContainer width="58%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>{data.map((item) => <Cell key={item.name} fill={{ Critical: '#DC2626', Warning: '#D97706', Info: '#2563EB', Resolved: '#94A3B8' }[item.name]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{data.reduce((sum, item) => sum + item.value, 0)}</strong><span>Total alerts</span></div><div className="donut-legend">{data.map((item) => <span key={item.name}><i style={{ background: { Critical: '#DC2626', Warning: '#D97706', Info: '#2563EB', Resolved: '#94A3B8' }[item.name] }} />{item.name}<b>{item.value}</b></span>)}</div></div>;
export const CategoryBarChart = ({ data }) => {
  const { chartTheme } = useSettings();
  return <div className="alerts-category-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ left: 18, right: 12 }}><CartesianGrid stroke={chartTheme?.grid || '#E8EDF3'} horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: chartTheme?.tick || '#94A3B8' }} /><YAxis type="category" dataKey="category" width={78} tick={{ fontSize: 10, fill: chartTheme?.tick || '#64748B' }} /><Tooltip /><Bar dataKey="count" name="Alerts" fill="#2563EB" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>;
};

export const AlertHistoryTable = ({ alerts }) => <div className="alerts-table-scroll"><table className="alerts-table history"><thead><tr><th>Time</th><th>Server</th><th>Metric</th><th>Value</th><th>Threshold</th><th>Severity</th><th>Status</th><th>Duration</th></tr></thead><tbody>{alerts.map((alert) => <tr key={alert.id}><td>{new Date(alert.created_at).toLocaleString()}</td><td>{alert.server_name}</td><td>{alert.metric}</td><td>{Number(alert.current_value ?? 0).toFixed(2)}</td><td>{Number(alert.threshold_value ?? 0).toFixed(2)}</td><td><SeverityBadge severity={alert.severity} /></td><td><StatusBadge status={alert.status} /></td><td>{alert.resolved_at ? `${Math.max(0, Math.round((new Date(alert.resolved_at) - new Date(alert.created_at)) / 60000))} min` : 'Active'}</td></tr>)}</tbody></table></div>;
export const TopServersTable = ({ servers }) => <div className="alerts-table-scroll"><table className="alerts-table top-servers"><thead><tr><th>Server</th><th>Total</th><th>Critical</th><th>Warning</th><th>Last Alert</th></tr></thead><tbody>{servers.map((server) => <tr key={server.server_name}><td><span className="alert-server"><Server size={12} />{server.server_name}</span></td><td><b>{server.total_alerts}</b></td><td>{server.critical || 0}</td><td>{server.warning || 0}</td><td>{new Date(server.last_alert_time).toLocaleString()}</td></tr>)}</tbody></table></div>;
export const EmptyAlerts = ({ message }) => <div className="alerts-empty"><CheckCircle2 size={18} />{message}</div>;

export const AlertChartPanel = ({
  title,
  subtitle,
  children,
  data = [],
  keys = [],
  legend = [],
  timeRange = '',
  server = 'All Servers',
  controls = null,
  renderEnlarged = null,
}) => {
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
          showToast('No data available for this chart.', true);
          return;
        }
        exportChartAsCsv({ title, data, keys });
        showToast('Downloaded CSV alert data.');
      } else if (format === 'json') {
        if (!data || !data.length) {
          showToast('No data available for this chart.', true);
          return;
        }
        exportChartAsJson({ title, server, timeRange, metric: title, data, keys });
        showToast('Downloaded JSON alert telemetry.');
      } else {
        await exportChartAsPng({
          containerElement: panelRef.current,
          title,
          subtitle,
          server,
          timeRange,
          legend,
        });
        showToast('Downloaded PNG alert chart.');
      }
    } catch (err) {
      console.error('Alert export error:', err);
      showToast(format === 'png' ? 'Unable to export chart.' : 'Unable to export chart data.', true);
    }
  };

  return (
    <div className="alerts-panel alerts-chart-panel" ref={panelRef}>
      <div className="alerts-panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {controls}
          <ChartActions
            title={title}
            onExpand={() => setModalOpen(true)}
            onDownload={handleDownload}
            disabled={!data || !data.length}
          />
        </div>
      </div>

      {children}

      <ChartModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={title}
        subtitle={subtitle}
        server={server}
        timeRange={timeRange}
        updated={new Date().toLocaleTimeString()}
        onDownload={handleDownload}
      >
        <div className="chart-modal-content" style={{ height: '500px', width: '100%' }}>
          {renderEnlarged ? renderEnlarged() : children}
        </div>
      </ChartModal>

      {toast && (
        <div className={`chart-export-toast ${toast.isError ? 'error' : 'success'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

