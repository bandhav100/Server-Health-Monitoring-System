import React, { useRef, useState } from 'react';
import { Activity, AlertTriangle, BrainCircuit, Cpu, HardDrive, MemoryStick, Network, ShieldCheck, Thermometer, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSettings } from '../../context/SettingsContext';
import ChartActions from '../UI/ChartActions';
import ChartModal from '../UI/ChartModal';
import { exportChartAsCsv, exportChartAsJson, exportChartAsPng } from '../../utils/chartExport';

export const LoadingSkeleton = () => (
  <div className="prediction-skeleton" aria-label="Loading prediction data">
    <i />
    <i />
    <i />
  </div>
);

export const PredictionSummaryCard = ({ type, title, current, predicted, unit, extra, icon: Icon, color, loading }) => {
  const health = type === 'health';
  const hasCurrent = current !== null && current !== undefined && !Number.isNaN(Number(current));
  const hasPredicted = predicted !== null && predicted !== undefined && !Number.isNaN(Number(predicted));
  const numCurrent = hasCurrent ? Number(current) : null;
  const numPredicted = hasPredicted ? Number(predicted) : null;

  const status = health && numCurrent !== null
    ? (numCurrent >= 80 ? 'Healthy' : numCurrent >= 60 ? 'Watch' : 'Critical')
    : null;

  return (
    <article className={`prediction-summary-card ${color}`}>
      <div className="prediction-card-head">
        <span className="prediction-card-icon"><Icon size={17} /></span>
        <span className="prediction-card-label">{title}</span>
        {health && status && <span className={`prediction-status ${status.toLowerCase()}`}>{status}</span>}
      </div>
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <div className="prediction-main-value">
            {numCurrent !== null ? numCurrent.toFixed(1) : '--'}
            <small>{unit}</small>
          </div>
          <div className="prediction-card-sub">
            <span>Predicted {numPredicted !== null ? `${numPredicted.toFixed(1)}${unit}` : '--'}</span>
            <TrendingUp size={14} />
          </div>
          {health ? (
            <div className="health-ring" style={{ '--health': `${numCurrent !== null ? numCurrent : 0}%` }}>
              <strong>{numCurrent !== null ? `${numCurrent.toFixed(0)}%` : '--'}</strong>
              <span>current health</span>
            </div>
          ) : (
            <div className="prediction-meter">
              <i style={{ width: `${numCurrent !== null ? Math.min(Math.max(numCurrent, 0), 100) : 0}%` }} />
            </div>
          )}
          {extra && <p className="prediction-extra">{extra}</p>}
        </>
      )}
    </article>
  );
};

const tooltip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div className="prediction-tooltip">
      <strong>{new Date(label).toLocaleString()}</strong>
      {payload.map((entry) => (
        <span key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {Number(entry.value).toFixed(2)}
        </span>
      ))}
    </div>
  ) : null;

export const ForecastChart = ({
  title,
  subtitle,
  data = [],
  forecast = [],
  color,
  forecastColor,
  unit,
  dual,
  horizonLabel,
  loading,
  server = '',
}) => {
  const { chartTheme } = useSettings();
  const [modalOpen, setModalOpen] = useState(false);
  const panelRef = useRef(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const chartData = [
    ...data.map((point) => ({ ...point, time: point.timestamp, historical: point.value })),
    ...forecast.map((point) => ({ ...point, time: point.timestamp, predicted: point.value })),
  ];

  const hasPoints = chartData.length > 0;
  const legend = [
    { name: dual ? 'Incoming' : 'Historical', color },
    { name: dual ? 'Outgoing forecast' : 'Forecast', color: forecastColor || color },
  ];

  const handleDownload = async (format) => {
    try {
      if (format === 'csv') {
        if (!hasPoints) {
          showToast('No data available for this forecast.', true);
          return;
        }
        exportChartAsCsv({ title, data: chartData, keys: ['historical', 'predicted'], timeKey: 'time' });
        showToast('Downloaded CSV forecast data.');
      } else if (format === 'json') {
        if (!hasPoints) {
          showToast('No data available for this forecast.', true);
          return;
        }
        exportChartAsJson({
          title,
          server,
          timeRange: horizonLabel,
          metric: title,
          data: chartData,
          keys: ['historical', 'predicted'],
        });
        showToast('Downloaded JSON forecast telemetry.');
      } else {
        await exportChartAsPng({
          containerElement: panelRef.current,
          title,
          subtitle,
          server,
          timeRange: horizonLabel,
          legend,
        });
        showToast('Downloaded PNG forecast chart.');
      }
    } catch (err) {
      console.error('Forecast export error:', err);
      showToast(format === 'png' ? 'Unable to export chart.' : 'Unable to export chart data.', true);
    }
  };

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`fill-${title}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={chartTheme?.grid || '#E8EDF3'} vertical={false} />
        <XAxis
          dataKey="time"
          tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          tick={{ fontSize: 10, fill: chartTheme?.tick || '#94A3B8' }}
          minTickGap={30}
        />
        <YAxis unit={unit} tick={{ fontSize: 10, fill: chartTheme?.tick || '#94A3B8' }} />
        <Tooltip content={tooltip} />
        {dual ? (
          <>
            <Line type="monotone" dataKey="historical" name="Incoming" stroke={color} strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="predicted" name="Outgoing forecast" stroke={forecastColor} strokeWidth={2} dot={false} strokeDasharray="5 5" connectNulls />
          </>
        ) : (
          <>
            <Area type="monotone" dataKey="historical" name="Historical" stroke={color} fill={`url(#fill-${title})`} strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="predicted" name="Forecast" stroke={forecastColor || color} strokeWidth={2} dot={false} strokeDasharray="6 5" connectNulls />
          </>
        )}
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <section className="prediction-panel prediction-chart-panel" ref={panelRef}>
      <div className="prediction-panel-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="prediction-live">
            <i /> {horizonLabel || 'forecast horizon'}
          </span>
          <ChartActions
            title={title}
            onExpand={() => setModalOpen(true)}
            onDownload={handleDownload}
            disabled={loading || !hasPoints}
          />
        </div>
      </div>
      <div className="prediction-chart">
        {loading ? (
          <LoadingSkeleton />
        ) : hasPoints ? (
          renderChart()
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: '12px' }}>
            Not enough historical data for this forecast.
          </div>
        )}
      </div>

      <ChartModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={title}
        subtitle={subtitle}
        server={server}
        timeRange={horizonLabel}
        updated={new Date().toLocaleTimeString()}
        onDownload={handleDownload}
      >
        <div className="prediction-chart" style={{ height: '480px', width: '100%' }}>
          {renderChart()}
        </div>
      </ChartModal>

      {toast && (
        <div className={`chart-export-toast ${toast.isError ? 'error' : 'success'}`}>
          {toast.message}
        </div>
      )}
    </section>
  );
};

export const InsightCard = ({ icon: Icon, title, value, time, tone, loading }) => (
  <article className={`insight-card ${tone}`}>
    <span><Icon size={16} /></span>
    <div>
      <p>{title}</p>
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <strong>{value}</strong>
          <small>{time}</small>
        </>
      )}
    </div>
  </article>
);

export const ConfidenceBar = ({ label, value, color, loading }) => {
  const hasValue = value !== null && value !== undefined && !Number.isNaN(Number(value));
  const displayValue = loading ? 'Loading...' : hasValue ? `${Number(value).toFixed(0)}%` : 'Not provided by model';
  const widthPercent = hasValue && !loading ? Math.min(100, Math.max(0, Number(value))) : 0;

  return (
    <div className="confidence-row">
      <div>
        <span>{label}</span>
        <strong>{displayValue}</strong>
      </div>
      <div className="confidence-track">
        <i style={{ width: `${widthPercent}%`, background: color }} />
      </div>
    </div>
  );
};

export const AnomalyTable = ({ anomalies = [] }) => (
  <div className="prediction-table-wrap">
    <table className="prediction-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Metric</th>
          <th>Current</th>
          <th>Expected</th>
          <th>Deviation</th>
          <th>Severity</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>
        {anomalies.map((item) => (
          <tr key={`${item.time}-${item.metric}`}>
            <td>{new Date(item.time).toLocaleString()}</td>
            <td><b>{item.metric}</b></td>
            <td>{item.current_value != null ? item.current_value.toFixed(2) : '--'}</td>
            <td>{item.expected_value != null ? item.expected_value.toFixed(2) : '--'}</td>
            <td>{item.deviation != null ? `${item.deviation.toFixed(1)}%` : '--'}</td>
            <td><span className={`severity-badge ${item.severity || 'warning'}`}>{item.severity || 'warning'}</span></td>
            <td>{item.reason}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const PredictionHistoryTable = ({ history = [] }) => (
  <div className="prediction-table-wrap">
    <table className="prediction-table">
      <thead>
        <tr>
          <th>Generated</th>
          <th>Health</th>
          <th>CPU</th>
          <th>RAM</th>
          <th>Disk</th>
          <th>Anomaly</th>
          <th>Confidence</th>
        </tr>
      </thead>
      <tbody>
        {history.map((item) => (
          <tr key={item.id}>
            <td>{item.created_at ? new Date(item.created_at).toLocaleString() : '--'}</td>
            <td><b>{item.health_score != null ? `${item.health_score.toFixed(1)}%` : '--'}</b></td>
            <td>{item.cpu_forecast != null ? `${item.cpu_forecast.toFixed(1)}%` : '--'}</td>
            <td>{item.ram_forecast != null ? `${item.ram_forecast.toFixed(1)}%` : '--'}</td>
            <td>{item.predicted_disk != null ? `${item.predicted_disk.toFixed(1)}%` : '--'}</td>
            <td>{item.anomaly_score != null ? `${item.anomaly_score.toFixed(1)}%` : '--'}</td>
            <td>{item.confidence != null ? `${item.confidence.toFixed(1)}%` : '--'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const predictionIcons = {
  cpu: Cpu,
  ram: MemoryStick,
  disk: HardDrive,
  network: Network,
  health: ShieldCheck,
  anomaly: AlertTriangle,
  temperature: Thermometer,
  activity: Activity,
  model: BrainCircuit,
};

