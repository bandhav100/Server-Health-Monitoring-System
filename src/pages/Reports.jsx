import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FileBarChart,
  Download,
  Calendar,
  Filter,
  CheckSquare,
  Square,
  Clock,
  Server,
  Trash2,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import api, { unwrap } from '../api';
import { useSettings } from '../context/SettingsContext';
import { exportChartAsCsv, exportChartAsJson, exportChartAsPng } from '../utils/chartExport';
import './Reports.css';

const AVAILABLE_METRICS = [
  { id: 'cpu_usage', name: 'CPU Usage', unit: '%', category: 'Compute', color: '#16a34a' },
  { id: 'processes', name: 'System Processes', unit: 'count', category: 'Compute', color: '#0891b2' },
  { id: 'threads', name: 'System Threads', unit: 'count', category: 'Compute', color: '#6366f1' },
  { id: 'queue', name: 'Processor Queue', unit: 'length', category: 'Compute', color: '#f97316' },
  { id: 'context_switches', name: 'Context Switches', unit: '/s', category: 'Compute', color: '#9333ea' },
  { id: 'system_calls', name: 'System Calls', unit: '/s', category: 'Compute', color: '#06b6d4' },
  { id: 'exceptions', name: 'Exceptions', unit: '/s', category: 'Compute', color: '#ef4444' },

  { id: 'ram_usage', name: 'RAM Usage', unit: '%', category: 'Memory', color: '#2563eb' },
  { id: 'used_memory', name: 'Used Memory', unit: 'GB', category: 'Memory', color: '#3b82f6' },
  { id: 'free_memory', name: 'Available Memory', unit: 'GB', category: 'Memory', color: '#10b981' },

  { id: 'disk_usage', name: 'Disk Usage', unit: '%', category: 'Storage', color: '#d97706' },
  { id: 'disk_read', name: 'Disk Read Speed', unit: 'MB/s', category: 'Storage', color: '#0284c7' },
  { id: 'disk_write', name: 'Disk Write Speed', unit: 'MB/s', category: 'Storage', color: '#ea580c' },

  { id: 'network_in', name: 'Network Incoming', unit: 'MB/s', category: 'Network', color: '#10b981' },
  { id: 'network_out', name: 'Network Outgoing', unit: 'MB/s', category: 'Network', color: '#f59e0b' },
  { id: 'network_usage', name: 'Total Bandwidth', unit: 'MB/s', category: 'Network', color: '#8b5cf6' },

  { id: 'temperature', name: 'CPU Temperature', unit: '°C', category: 'Thermal & System', color: '#dc2626' },
  { id: 'uptime', name: 'System Uptime', unit: 'hours', category: 'Thermal & System', color: '#14b8a6' },
];

const TIME_RANGES = [
  { id: '15m', label: 'Last 15 Minutes' },
  { id: '30m', label: 'Last 30 Minutes' },
  { id: '1h', label: 'Last 1 Hour' },
  { id: '6h', label: 'Last 6 Hours' },
  { id: '12h', label: 'Last 12 Hours' },
  { id: '24h', label: 'Last 24 Hours' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'custom', label: 'Custom Range' },
];

function formatAxisTime(val, rangeId, settings) {
  if (!val) return '';
  const date = new Date(val);
  if (isNaN(date.getTime())) return String(val);

  const tz = settings?.timezone && settings.timezone !== 'auto' ? settings.timezone : undefined;
  const is12h = settings?.time_format === '12h';

  try {
    if (rangeId === '15m' || rangeId === '30m' || rangeId === '1h') {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: is12h,
      }).format(date);
    } else if (rangeId === '6h' || rangeId === '12h' || rangeId === '24h') {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        month: 'short',
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
        hour12: is12h,
      }).format(date);
    }
  } catch {
    return date.toLocaleTimeString();
  }
}

export default function Reports() {
  const { chartTheme, settings } = useSettings();

  // Filters State
  const [servers, setServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState('ALL');
  const [selectedMetrics, setSelectedMetrics] = useState(['cpu_usage', 'ram_usage', 'disk_usage']);
  const [timeRange, setTimeRange] = useState('24h');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Report Data & Preview State
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // History State
  const [recentReports, setRecentReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const previewRef = useRef(null);

  const showToast = (msg, isErr = false) => {
    setToastMessage({ msg, isErr });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load registered servers
  const loadServers = useCallback(async () => {
    try {
      const res = await api.get('/servers');
      const list = unwrap(res) || [];
      setServers(list);
    } catch (err) {
      console.error('Failed to load servers:', err);
    }
  }, []);

  // Load report history from backend
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/reports');
      const list = unwrap(res) || [];
      setRecentReports(list);
    } catch (err) {
      console.error('Failed to load reports history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadServers();
    loadHistory();
  }, [loadServers, loadHistory]);

  // Set default custom date/time bounds
  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 3600 * 1000);
    setCustomEnd(end.toISOString().slice(0, 16));
    setCustomStart(start.toISOString().slice(0, 16));
  }, []);

  const handleMetricToggle = (metricId) => {
    setSelectedMetrics((prev) => {
      if (prev.includes(metricId)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((id) => id !== metricId);
      }
      return [...prev, metricId];
    });
  };

  const handleSelectAllMetrics = () => {
    setSelectedMetrics(AVAILABLE_METRICS.map((m) => m.id));
  };

  const handleClearMetrics = () => {
    setSelectedMetrics(['cpu_usage']);
  };

  // Generate real report data
  const handleGenerateReport = async () => {
    if (selectedMetrics.length === 0) {
      setReportError('Please select at least one metric to generate a report.');
      return;
    }

    if (timeRange === 'custom') {
      if (!customStart || !customEnd) {
        setReportError('Please select both start and end date/time for custom range.');
        return;
      }
      if (new Date(customStart) >= new Date(customEnd)) {
        setReportError('Start date must be strictly earlier than end date.');
        return;
      }
    }

    setGenerating(true);
    setReportError(null);

    const payload = {
      server_id: selectedServerId === 'ALL' ? null : Number(selectedServerId),
      metrics: selectedMetrics,
      time_range: timeRange,
      start_time: timeRange === 'custom' ? new Date(customStart).toISOString() : undefined,
      end_time: timeRange === 'custom' ? new Date(customEnd).toISOString() : undefined,
    };

    try {
      const res = await api.post('/reports/data', payload);
      const data = unwrap(res);
      setReportData(data);
      showToast('Report generated successfully with real historical data.');
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to generate report.';
      setReportError(msg);
    } finally {
      setGenerating(false);
    }
  };

  // Download PDF from backend generator
  const handleDownloadPdf = async () => {
    if (!reportData) return;
    try {
      showToast('Compiling PDF report...');
      const payload = {
        server_id: selectedServerId === 'ALL' ? null : Number(selectedServerId),
        metrics: selectedMetrics,
        time_range: timeRange,
        format: 'PDF',
        start_time: reportData.start,
        end_time: reportData.end,
      };
      const res = await api.post('/reports/generate', payload);
      const data = unwrap(res);

      if (data?.download_url || data?.id) {
        // Strip /api prefix because axios baseURL is already /api
        const relativeUrl = data.download_url
          ? data.download_url.replace(/^\/api/, '')
          : `/reports/${data.id}/download`;

        const fileRes = await api.get(relativeUrl, { responseType: 'blob' });
        const blob = new Blob([fileRes.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.name || 'shms-performance-report.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('Downloaded PDF report successfully.');
        loadHistory();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to download PDF report.', true);
    }
  };

  // Download stored report from history table
  const handleDownloadStoredReport = async (rep) => {
    try {
      showToast(`Downloading ${rep.name}...`);
      const relativeUrl = rep.download_url
        ? rep.download_url.replace(/^\/api/, '')
        : `/reports/${rep.id}/download`;
      const fileRes = await api.get(relativeUrl, { responseType: 'blob' });
      const mimeTypes = {
        PDF: 'application/pdf',
        CSV: 'text/csv',
        JSON: 'application/json',
      };
      const blob = new Blob([fileRes.data], { type: mimeTypes[rep.format] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = rep.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast(`Downloaded ${rep.name} successfully.`);
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to download report file.', true);
    }
  };

  // Download CSV
  const handleDownloadCsv = () => {
    if (!reportData?.series?.length) {
      showToast('No data available to export.', true);
      return;
    }
    const sName = reportData.server?.name?.toLowerCase()?.replace(/\s+/g, '-') || 'all-servers';
    const filename = `shms-${sName}-${timeRange}.csv`;
    exportChartAsCsv({
      title: filename.replace('.csv', ''),
      data: reportData.series,
      keys: selectedMetrics,
      timeKey: 'time',
    });
    showToast('Downloaded CSV data successfully.');
  };

  // Download PNG chart capture
  const handleDownloadPng = async () => {
    if (!previewRef.current) return;
    try {
      const sName = reportData?.server?.name?.toLowerCase()?.replace(/\s+/g, '-') || 'all-servers';
      await exportChartAsPng({
        containerElement: previewRef.current,
        title: `SHMS Infrastructure Report - ${reportData?.server?.name || 'All Servers'}`,
        subtitle: `Time Window: ${timeRange.toUpperCase()}`,
        server: reportData?.server?.name || 'All Servers',
        timeRange: timeRange.toUpperCase(),
      });
      showToast('Downloaded PNG chart successfully.');
    } catch (err) {
      showToast('Failed to export chart image.', true);
    }
  };

  // Download JSON
  const handleDownloadJson = () => {
    if (!reportData) return;
    const sName = reportData.server?.name?.toLowerCase()?.replace(/\s+/g, '-') || 'all-servers';
    exportChartAsJson({
      title: `SHMS Telemetry Report - ${reportData.server?.name || 'All Servers'}`,
      server: reportData.server?.name || 'All Servers',
      timeRange,
      metric: selectedMetrics.join(', '),
      data: [reportData],
    });
    showToast('Downloaded JSON report successfully.');
  };

  // Delete historical report
  const handleDeleteReport = async (id) => {
    try {
      await api.delete(`/reports/${id}`);
      setRecentReports((prev) => prev.filter((r) => r.id !== id));
      showToast('Report deleted from history.');
    } catch (err) {
      showToast('Failed to delete report.', true);
    }
  };

  // Group selected metrics by unit to render proper scale-separated charts
  const metricGroupsByUnit = useMemo(() => {
    const groups = {};
    selectedMetrics.forEach((mId) => {
      const def = AVAILABLE_METRICS.find((m) => m.id === mId);
      if (!def) return;
      const unitKey = def.unit;
      if (!groups[unitKey]) groups[unitKey] = [];
      groups[unitKey].push(def);
    });
    return groups;
  }, [selectedMetrics]);

  return (
    <main className="reports-page">
      {/* Page Header */}
      <header className="reports-header">
        <div>
          <div className="reports-badge">
            <FileBarChart size={12} /> ENTERPRISE REPORTING ENGINE
          </div>
          <h1>Reports</h1>
          <p>Generate historical infrastructure performance reports</p>
        </div>

        <button
          type="button"
          className="reports-gen-btn"
          onClick={handleGenerateReport}
          disabled={generating}
        >
          <RefreshCw size={14} className={generating ? 'reports-spin' : ''} />
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </header>

      {/* Filter Panel */}
      <section className="reports-filter-panel">
        <div className="reports-filter-grid">
          {/* Server Selector */}
          <div className="reports-filter-item">
            <label htmlFor="report-server-select">
              <Server size={13} /> Target Server:
            </label>
            <select
              id="report-server-select"
              value={selectedServerId}
              onChange={(e) => setSelectedServerId(e.target.value)}
            >
              <option value="ALL">All Servers (Aggregated)</option>
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName || s.name} ({s.ip || s.tailscale_ip})
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="reports-filter-item">
            <label htmlFor="report-range-select">
              <Clock size={13} /> Time Range:
            </label>
            <select
              id="report-range-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {TIME_RANGES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Bounds */}
          {timeRange === 'custom' && (
            <>
              <div className="reports-filter-item">
                <label htmlFor="custom-start-dt">
                  <Calendar size={13} /> Start Date & Time:
                </label>
                <input
                  id="custom-start-dt"
                  type="datetime-local"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="reports-filter-item">
                <label htmlFor="custom-end-dt">
                  <Calendar size={13} /> End Date & Time:
                </label>
                <input
                  id="custom-end-dt"
                  type="datetime-local"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {/* Multi-Metric Selector */}
        <div className="reports-metric-picker">
          <div className="reports-metric-picker-head">
            <label>
              <Filter size={13} /> Select Performance Metrics ({selectedMetrics.length} selected):
            </label>
            <div className="reports-metric-shortcuts">
              <button type="button" onClick={handleSelectAllMetrics}>
                Select All
              </button>
              <span>·</span>
              <button type="button" onClick={handleClearMetrics}>
                Reset
              </button>
            </div>
          </div>

          <div className="reports-metric-chips-grid">
            {AVAILABLE_METRICS.map((m) => {
              const isSelected = selectedMetrics.includes(m.id);
              return (
                <button
                  type="button"
                  key={m.id}
                  className={`reports-metric-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => handleMetricToggle(m.id)}
                >
                  {isSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                  <span>{m.name}</span>
                  <small>({m.unit})</small>
                </button>
              );
            })}
          </div>
        </div>

        {reportError && (
          <div className="reports-error-banner">
            <AlertCircle size={14} /> {reportError}
          </div>
        )}
      </section>

      {/* Report Preview */}
      {reportData && (
        <section className="reports-preview-section" ref={previewRef}>
          <div className="reports-preview-header">
            <div>
              <h2>Infrastructure Performance Report</h2>
              <div className="reports-preview-meta">
                <span>Server: <b>{reportData.server?.name || 'All Servers'}</b></span>
                <span>Range: <b>{reportData.time_range?.toUpperCase()}</b></span>
                <span>Points: <b>{reportData.series?.length || 0}</b></span>
                <span>Generated: <b>{reportData.generated_at?.slice(0, 19).replace('T', ' ')} UTC</b></span>
              </div>
            </div>

            {/* Export Toolbar */}
            <div className="reports-export-toolbar">
              <button type="button" onClick={handleDownloadPdf} className="export-btn pdf" title="Download formatted PDF">
                <FileText size={13} /> PDF Report
              </button>
              <button type="button" onClick={handleDownloadCsv} className="export-btn csv" title="Download CSV series data">
                <FileSpreadsheet size={13} /> CSV Data
              </button>
              <button type="button" onClick={handleDownloadPng} className="export-btn png" title="Download high-DPI chart PNG">
                <ImageIcon size={13} /> PNG Chart
              </button>
              <button type="button" onClick={handleDownloadJson} className="export-btn json" title="Download JSON payload">
                <Download size={13} /> JSON
              </button>
            </div>
          </div>

          {/* Metric Charts grouped by Unit to prevent incorrect axis sharing */}
          <div className="reports-charts-grid">
            {Object.entries(metricGroupsByUnit).map(([unit, mDefs]) => {
              const keys = mDefs.map((m) => m.id);
              return (
                <div key={unit} className="reports-chart-card">
                  <div className="reports-chart-card-head">
                    <div>
                      <h3>
                        {mDefs.map((m) => m.name).join(' vs ')} ({unit})
                      </h3>
                      <p>Time window: {reportData.time_range?.toUpperCase()} · Real historical samples</p>
                    </div>
                  </div>

                  <div className="reports-chart-plot">
                    {reportData.series?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={reportData.series}>
                          <CartesianGrid stroke={chartTheme?.grid || '#1a1a1a'} vertical={false} />
                          <XAxis
                            dataKey="time"
                            tick={{ fill: chartTheme?.tick || '#a3a3a3', fontSize: 9 }}
                            tickFormatter={(t) => formatAxisTime(t, reportData.time_range, settings)}
                            minTickGap={35}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fill: chartTheme?.tick || '#a3a3a3', fontSize: 9 }}
                            domain={['auto', 'auto']}
                            tickFormatter={(v) => `${v}${unit === '%' ? '%' : ''}`}
                          />
                          <Tooltip
                            contentStyle={{
                              background: chartTheme?.tooltipBg || '#080808',
                              border: `1px solid ${chartTheme?.tooltipBorder || '#242424'}`,
                              color: chartTheme?.tooltipText || '#ffffff',
                              borderRadius: '8px',
                              fontSize: '11px',
                            }}
                            labelFormatter={(l) => String(l).replace('T', ' ').replace('Z', '')}
                          />
                          {mDefs.map((m) => (
                            <Line
                              key={m.id}
                              type="monotone"
                              dataKey={m.id}
                              name={m.name}
                              stroke={m.color}
                              strokeWidth={2}
                              dot={false}
                              connectNulls={false}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="reports-no-data">
                        No historical data available for the selected server and time range.
                      </div>
                    )}
                  </div>

                  <div className="reports-chart-legend">
                    {mDefs.map((m) => (
                      <span key={m.id}>
                        <i style={{ background: m.color }} />
                        {m.name} ({unit})
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Real Statistics Table */}
          <div className="reports-stats-table-box">
            <h3>Metric Performance Statistics</h3>
            <div className="reports-table-responsive">
              <table className="reports-stats-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Unit</th>
                    <th>Minimum</th>
                    <th>Average</th>
                    <th>Peak / Max</th>
                    <th>Latest</th>
                    <th>Peak Time (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMetrics.map((mId) => {
                    const stat = reportData.statistics?.[mId] || {};
                    return (
                      <tr key={mId}>
                        <td>
                          <b>{stat.name || mId}</b>
                        </td>
                        <td>{stat.unit || '--'}</td>
                        <td>{stat.min !== null && stat.min !== undefined ? `${stat.min} ${stat.unit}` : '--'}</td>
                        <td>{stat.avg !== null && stat.avg !== undefined ? `${stat.avg} ${stat.unit}` : '--'}</td>
                        <td className="peak-cell">{stat.peak !== null && stat.peak !== undefined ? `${stat.peak} ${stat.unit}` : '--'}</td>
                        <td>{stat.latest !== null && stat.latest !== undefined ? `${stat.latest} ${stat.unit}` : '--'}</td>
                        <td>{stat.peak_time ? stat.peak_time.slice(0, 19).replace('T', ' ') : '--'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Recent Reports History */}
      <section className="reports-history-section">
        <div className="reports-history-head">
          <div>
            <h2>Recent Reports</h2>
            <p>Saved historical exports and run records</p>
          </div>
          <button type="button" className="reports-btn-ghost" onClick={loadHistory} disabled={loadingHistory}>
            <RefreshCw size={13} className={loadingHistory ? 'reports-spin' : ''} /> Refresh History
          </button>
        </div>

        {recentReports.length > 0 ? (
          <div className="reports-table-responsive">
            <table className="reports-history-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Server</th>
                  <th>Metrics</th>
                  <th>Range</th>
                  <th>Created</th>
                  <th>Format</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((rep) => (
                  <tr key={rep.id}>
                    <td>
                      <b>{rep.name}</b>
                    </td>
                    <td>{rep.server_name}</td>
                    <td>
                      <span className="reports-metric-tags" title={rep.metrics?.join(', ')}>
                        {rep.metrics?.length || 0} metrics
                      </span>
                    </td>
                    <td>{rep.time_range?.toUpperCase()}</td>
                    <td>{rep.created_at ? rep.created_at.slice(0, 16).replace('T', ' ') : '--'}</td>
                    <td>
                      <span className={`reports-format-badge ${rep.format?.toLowerCase()}`}>
                        {rep.format}
                      </span>
                    </td>
                    <td>
                      <span className="reports-status-ok">● {rep.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="reports-action-group">
                        <button
                          type="button"
                          className="reports-icon-btn"
                          onClick={() => handleDownloadStoredReport(rep)}
                          title="Download report"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          type="button"
                          className="reports-icon-btn danger"
                          onClick={() => handleDeleteReport(rep.id)}
                          title="Delete report"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reports-empty-history">
            No reports generated yet. Click "Generate Report" above to build your first infrastructure report.
          </div>
        )}
      </section>

      {/* Toast notifications */}
      {toastMessage && (
        <div className={`reports-toast ${toastMessage.isErr ? 'error' : 'success'}`}>
          {toastMessage.isErr ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          <span>{toastMessage.msg}</span>
        </div>
      )}
    </main>
  );
}
