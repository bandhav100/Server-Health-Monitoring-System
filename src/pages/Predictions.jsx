import React, { useEffect, useState } from 'react';
import { BrainCircuit, Clock3, RefreshCw, TrendingUp } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import api, { unwrap } from '../api';
import {
  AnomalyTable,
  ConfidenceBar,
  ForecastChart,
  InsightCard,
  PredictionHistoryTable,
  PredictionSummaryCard,
  predictionIcons,
} from '../components/Predictions/PredictionComponents';
import '../components/Predictions/Predictions.css';

const ranges = [
  ['30m', '30 Minutes'],
  ['1h', '1 Hour'],
  ['6h', '6 Hours'],
  ['24h', '24 Hours'],
  ['7d', '7 Days'],
];

const RANGE_LABELS = {
  '30m': '30-minute',
  '1h': '1-hour',
  '6h': '6-hour',
  '24h': '24-hour',
  '7d': '7-day',
};

const number = (value) => (value !== null && value !== undefined && !Number.isNaN(Number(value)) ? Number(value) : null);

const Predictions = () => {
  const { selectedServer, servers, selectedServerKey, setSelectedServer, setSelectedServerId } = useDashboard();

  // Resolve active server: check selectedServer, then match by instance/hostname, or fallback to first available
  const activeServer =
    (selectedServer?.id ? selectedServer : null) ||
    servers?.find((s) => s.id && s.id === selectedServer?.id) ||
    servers?.find((s) => s.id && s.prometheus_instance === selectedServer?.instance) ||
    servers?.find((s) => s.id && (s.hostname || s.name || '').toLowerCase().includes(String(selectedServerKey || '').toLowerCase())) ||
    servers?.find((s) => s.id) ||
    null;

  const serverId = activeServer?.id;
  const [range, setRange] = useState('24h');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [toast, setToast] = useState('');

  const horizonText = RANGE_LABELS[range] || range;

  useEffect(() => {
    if (!serverId) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;

    const load = async () => {
      try {
        const endpoints = [
          `/predictions/summary?server_id=${serverId}&range=${range}`,
          `/predictions/cpu?server_id=${serverId}&range=${range}`,
          `/predictions/ram?server_id=${serverId}&range=${range}`,
          `/predictions/disk?server_id=${serverId}&range=${range}`,
          `/predictions/network?server_id=${serverId}&range=${range}`,
          `/predictions/anomalies?server_id=${serverId}&range=${range}`,
          `/predictions/history?server_id=${serverId}`,
        ];

        const settled = await Promise.allSettled(endpoints.map((endpoint) => api.get(endpoint)));
        if (cancelled) return;

        const unwrapSettled = (item) => (item.status === 'fulfilled' ? unwrap(item.value) : null);

        setData({
          summary: unwrapSettled(settled[0]),
          cpu: unwrapSettled(settled[1]),
          ram: unwrapSettled(settled[2]),
          disk: unwrapSettled(settled[3]),
          network: unwrapSettled(settled[4]),
          anomalies: unwrapSettled(settled[5]),
          history: unwrapSettled(settled[6]),
        });
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading prediction data:', error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    load();
    const interval = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [serverId, range]);

  const retrain = async () => {
    if (!serverId) return;
    setRetraining(true);
    try {
      const response = await api.post(`/predictions/retrain?server_id=${serverId}`);
      const result = unwrap(response);
      const timeStr = result?.last_trained
        ? new Date(result.last_trained).toLocaleTimeString()
        : new Date().toLocaleTimeString();
      setToast(`Model retrained successfully at ${timeStr}`);
      window.setTimeout(() => setToast(''), 5000);

      // Re-fetch all predictions to reflect the new model immediately
      const endpoints = [
        `/predictions/summary?server_id=${serverId}&range=${range}`,
        `/predictions/cpu?server_id=${serverId}&range=${range}`,
        `/predictions/ram?server_id=${serverId}&range=${range}`,
        `/predictions/disk?server_id=${serverId}&range=${range}`,
        `/predictions/network?server_id=${serverId}&range=${range}`,
        `/predictions/anomalies?server_id=${serverId}&range=${range}`,
        `/predictions/history?server_id=${serverId}`,
      ];
      const settled = await Promise.allSettled(endpoints.map((endpoint) => api.get(endpoint)));
      const unwrapSettled = (item) => (item.status === 'fulfilled' ? unwrap(item.value) : null);
      setData({
        summary: unwrapSettled(settled[0]),
        cpu: unwrapSettled(settled[1]),
        ram: unwrapSettled(settled[2]),
        disk: unwrapSettled(settled[3]),
        network: unwrapSettled(settled[4]),
        anomalies: unwrapSettled(settled[5]),
        history: unwrapSettled(settled[6]),
      });
    } catch (err) {
      setToast(`Retraining failed: ${err?.message || 'Server error'}`);
      window.setTimeout(() => setToast(''), 5000);
    } finally {
      setRetraining(false);
    }
  };

  const summary = data?.summary;
  const confidence = summary?.confidence != null ? number(summary.confidence) : null;
  const currentHealth = summary?.health_score != null ? number(summary.health_score) : null;
  const predictedHealth = summary?.predicted_health != null ? number(summary.predicted_health) : null;
  const latest = summary?.last_updated
    ? new Date(summary.last_updated).toLocaleTimeString()
    : loading
    ? 'Loading...'
    : 'No data';

  const cpu = data?.cpu;
  const ram = data?.ram;
  const disk = data?.disk;
  const network = data?.network;

  const cpuPeak = Math.max(
    ...(cpu?.forecast || []).map((item) => number(item.value) || 0),
    number(summary?.predicted_cpu) || 0,
    number(summary?.current_cpu) || 0
  );

  const ramPeak = Math.max(
    ...(ram?.forecast || []).map((item) => number(item.value) || 0),
    number(summary?.predicted_ram) || 0,
    number(summary?.current_ram) || 0
  );

  const diskPredicted = summary?.predicted_disk != null ? number(summary.predicted_disk) : null;
  const diskRemaining = diskPredicted !== null ? Math.max(0, 100 - diskPredicted) : null;

  const tempVal = summary?.current_temp != null ? Number(summary.current_temp) : null;
  const hasTempSensor = tempVal !== null && tempVal > 0;

  return (
    <main className="predictions-page">
      <header className="predictions-header">
        <div className="predictions-title">
          <span><TrendingUp size={20} /></span>
          <div>
            <h1>Predictions</h1>
            <p>AI Powered Forecasts and Resource Intelligence</p>
          </div>
        </div>
        <div className="predictions-meta">
          <span className="live"><i /> {activeServer ? (activeServer.hostname || activeServer.name) : 'Live'}</span>
          <span><Clock3 size={13} /> Updated {latest}</span>
          <span><BrainCircuit size={13} /> Engine: {summary?.engine_status || (loading ? 'INITIALIZING' : 'ACTIVE')}</span>
        </div>
      </header>

      <div className="prediction-toolbar">
        {servers && servers.length > 0 && (
          <div className="prediction-server-select">
            <label htmlFor="prediction-server-choice"><b>Target Server</b></label>
            <select
              id="prediction-server-choice"
              value={activeServer?.id || ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                const s = servers.find((item) => item.id === id);
                if (s && setSelectedServerId) {
                  setSelectedServerId(s.id);
                } else if (s && setSelectedServer) {
                  const key = (s.hostname || s.name || '').toLowerCase();
                  setSelectedServer(key);
                }
              }}
            >
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.hostname || s.name || `Server #${s.id}`} ({s.ip || s.prometheus_instance || `ID: ${s.id}`})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="prediction-range">
          <b>Forecast Horizon</b>
          {ranges.map(([value, label]) => (
            <button
              key={value}
              className={range === value ? 'active' : ''}
              onClick={() => setRange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <button className="retrain-button" onClick={retrain} disabled={retraining}>
          <RefreshCw size={14} className={retraining ? 'prediction-spin' : ''} />
          {retraining ? 'Retraining...' : 'Retrain AI Models'}
        </button>
      </div>

      <h2 className="prediction-section-label">AI prediction summary</h2>
      <section className="prediction-summary-grid">
        <PredictionSummaryCard
          type="health"
          title="Health score"
          current={currentHealth}
          predicted={predictedHealth}
          unit="%"
          icon={predictionIcons.health}
          color="blue"
          loading={loading && !summary}
        />
        <PredictionSummaryCard
          title="CPU forecast"
          current={summary?.current_cpu}
          predicted={summary?.predicted_cpu}
          unit="%"
          extra={cpuPeak > 0 ? `Peak ${cpuPeak.toFixed(1)}%` : undefined}
          icon={predictionIcons.cpu}
          color="green"
          loading={loading && !summary}
        />
        <PredictionSummaryCard
          title="RAM forecast"
          current={summary?.current_ram}
          predicted={summary?.predicted_ram}
          unit="%"
          extra={ramPeak > 0 ? `Peak ${ramPeak.toFixed(1)}%` : undefined}
          icon={predictionIcons.ram}
          color="purple"
          loading={loading && !summary}
        />
        <PredictionSummaryCard
          title="Anomaly score"
          current={summary?.anomaly_score}
          predicted={summary?.anomaly_score}
          unit="%"
          extra={confidence !== null ? `Confidence ${confidence.toFixed(0)}%` : 'Active model'}
          icon={predictionIcons.anomaly}
          color="orange"
          loading={loading && !summary}
        />
      </section>

      <h2 className="prediction-section-label">Forecast analytics</h2>
      <section className="prediction-chart-grid">
        <ForecastChart
          title="CPU forecast timeline"
          subtitle={`Historical CPU and ${horizonText} forecast`}
          horizonLabel={`${horizonText} horizon`}
          data={cpu?.historical || []}
          forecast={cpu?.forecast || []}
          color="#2563EB"
          forecastColor="#16A34A"
          unit="%"
          loading={loading && !cpu}
          server={activeServer?.name || activeServer?.hostname || 'Local Server'}
        />
        <ForecastChart
          title="RAM forecast timeline"
          subtitle={`Memory utilization trend (${horizonText} forecast)`}
          horizonLabel={`${horizonText} horizon`}
          data={ram?.historical || []}
          forecast={ram?.forecast || []}
          color="#2563EB"
          forecastColor="#7C3AED"
          unit="%"
          loading={loading && !ram}
          server={activeServer?.name || activeServer?.hostname || 'Local Server'}
        />
        <ForecastChart
          title="Disk forecast timeline"
          subtitle={`Capacity utilization growth (${horizonText} forecast)`}
          horizonLabel={`${horizonText} horizon`}
          data={disk?.historical || []}
          forecast={disk?.forecast || []}
          color="#E58A20"
          forecastColor="#C96A0B"
          unit="%"
          loading={loading && !disk}
          server={activeServer?.name || activeServer?.hostname || 'Local Server'}
        />
        <ForecastChart
          title="Network forecast timeline"
          subtitle={`Incoming and outgoing throughput (${horizonText} forecast)`}
          horizonLabel={`${horizonText} horizon`}
          data={network?.incoming_history || []}
          forecast={network?.outgoing_prediction || []}
          color="#16A34A"
          forecastColor="#E58A20"
          unit=" MB/s"
          dual
          loading={loading && !network}
          server={activeServer?.name || activeServer?.hostname || 'Local Server'}
        />
      </section>

      <h2 className="prediction-section-label">AI insights and confidence</h2>
      <section className="prediction-panels-grid">
        <div className="prediction-panel">
          <div className="prediction-panel-heading">
            <h2>Infrastructure insights</h2>
            <p>Signals derived from historical metrics</p>
          </div>
          <div className="insights-grid">
            <InsightCard
              loading={loading && !data}
              icon={predictionIcons.cpu}
              title="Peak CPU prediction"
              value={cpuPeak > 0 ? `${cpuPeak.toFixed(1)}%` : '--'}
              time={`next ${horizonText}`}
              tone="orange"
            />
            <InsightCard
              loading={loading && !data}
              icon={predictionIcons.ram}
              title="Peak RAM prediction"
              value={ramPeak > 0 ? `${ramPeak.toFixed(1)}%` : '--'}
              time={`next ${horizonText}`}
              tone="green"
            />
            <InsightCard
              loading={loading && !data}
              icon={predictionIcons.disk}
              title="Disk capacity remaining"
              value={diskRemaining !== null ? `${diskRemaining.toFixed(1)}%` : '--'}
              time="at forecast peak"
              tone="orange"
            />
            <InsightCard
              loading={loading && !data}
              icon={predictionIcons.temperature}
              title="Temperature status"
              value={hasTempSensor ? `${tempVal.toFixed(1)}°C` : 'Sensor unavailable'}
              time={hasTempSensor ? 'latest reading' : 'No thermal sensor reported'}
              tone={hasTempSensor && tempVal > 75 ? 'orange' : 'muted'}
            />
            <InsightCard
              loading={loading && !data}
              icon={predictionIcons.network}
              title="Network anomaly score"
              value={summary?.anomaly_score != null ? `${number(summary.anomaly_score).toFixed(1)}%` : '--'}
              time="based on deviation score"
              tone="green"
            />
            <InsightCard
              loading={loading && !data}
              icon={predictionIcons.activity}
              title="Health score"
              value={currentHealth !== null ? `${currentHealth.toFixed(0)}%` : '--'}
              time="current health estimate"
              tone="green"
            />
          </div>
        </div>

        <div className="prediction-panel confidence-panel">
          <div className="prediction-panel-heading" style={{ padding: 0, border: 0 }}>
            <h2>Model confidence</h2>
            <p>Confidence from available history</p>
          </div>
          <ConfidenceBar
            loading={loading && !summary}
            label="CPU confidence"
            value={summary?.cpu_confidence}
            color="#2563EB"
          />
          <ConfidenceBar
            loading={loading && !summary}
            label="RAM confidence"
            value={summary?.ram_confidence}
            color="#7C3AED"
          />
          <ConfidenceBar
            loading={loading && !summary}
            label="Disk confidence"
            value={summary?.disk_confidence}
            color="#E58A20"
          />
          <ConfidenceBar
            loading={loading && !summary}
            label="Network confidence"
            value={summary?.network_confidence}
            color="#16A34A"
          />
        </div>
      </section>

      <h2 className="prediction-section-label">AI anomaly detection</h2>
      <section className="prediction-panel">
        {data?.anomalies?.anomalies?.length ? (
          <AnomalyTable anomalies={data.anomalies.anomalies} />
        ) : (
          <div className="prediction-empty">No anomalies detected in the latest historical metrics.</div>
        )}
      </section>

      <h2 className="prediction-section-label">Prediction history</h2>
      <section className="prediction-panel">
        {data?.history?.length ? (
          <PredictionHistoryTable history={data.history} />
        ) : (
          <div className="prediction-empty">Retrain the model to create the first prediction snapshot.</div>
        )}
      </section>

      {toast && <div className="prediction-toast">{toast}</div>}
    </main>
  );
};

export default Predictions;
