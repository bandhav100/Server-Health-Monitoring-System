import React, { useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Cpu,
  Flame,
  HardDrive,
  Info,
  Maximize2,
  MemoryStick,
  Minus,
  Network,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wifi,
} from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSettings } from '../../context/SettingsContext';
import ChartActions from '../UI/ChartActions';
import ChartModal from '../UI/ChartModal';
import { exportChartAsCsv, exportChartAsJson, exportChartAsPng } from '../../utils/chartExport';

export const LoadingSkeleton = () => (
  <div className="prediction-skeleton" aria-label="Loading prediction telemetry">
    <i />
    <i />
    <i />
  </div>
);

// ── Custom Tooltip for Dual-Series Forecasts ─────────────────────────────────
const ForecastTooltip = ({ active, payload, label, unit = '%' }) => {
  if (!active || !payload || !payload.length) return null;

  const currentItem = payload[0]?.payload || {};
  const isForecast = currentItem.history === null && currentItem.forecast !== null;
  const isTransition = currentItem.history !== null && currentItem.forecast !== null;

  const timeStr = label ? new Date(label).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : '--';

  return (
    <div className="bg-black border border-[#222222] p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[170px] backdrop-blur-md">
      <div className="font-semibold text-slate-300 border-b border-[#1a1a1a] pb-1 flex items-center justify-between">
        <span>{timeStr}</span>
        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${isForecast ? 'bg-cyan-500/20 text-cyan-300' : 'bg-[#141414] text-slate-400'}`}>
          {isForecast ? 'ML FORECAST' : isTransition ? 'CURRENT (NOW)' : 'HISTORICAL'}
        </span>
      </div>

      {currentItem.history !== null && (
        <div className="flex justify-between items-center text-slate-200">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Prometheus Observed:
          </span>
          <span className="font-bold text-white">
            {Number(currentItem.history).toFixed(1)}{unit}
          </span>
        </div>
      )}

      {currentItem.forecast !== null && (
        <div className="flex justify-between items-center text-cyan-200">
          <span className="text-cyan-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-dashed border-cyan-300" />
            Projected Value:
          </span>
          <span className="font-bold text-cyan-300">
            {Number(currentItem.forecast).toFixed(1)}{unit}
          </span>
        </div>
      )}

      {currentItem.upper_bound !== null && currentItem.lower_bound !== null && (
        <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
          <span>95% Confidence Band:</span>
          <span className="font-mono text-slate-300">
            [{Number(currentItem.lower_bound).toFixed(1)} - {Number(currentItem.upper_bound).toFixed(1)}]
          </span>
        </div>
      )}
    </div>
  );
};

// ── 7 KPI Cards Component ───────────────────────────────────────────────────
export const MetricKpiCard = ({
  title,
  icon: Icon,
  current,
  forecast,
  changePct,
  trend = 'stable',
  confidence,
  unit = '%',
  extraInfo,
  color = '#06B6D4',
  loading,
}) => {
  const isUp = changePct > 0.5;
  const isDown = changePct < -0.5;

  // Good/Bad color depending on metric
  const isHealthMetric = title.toLowerCase().includes('health');
  const isPositiveGood = isHealthMetric;
  const isWarning = isPositiveGood ? isDown : isUp;

  return (
    <article className="p-4 rounded-2xl bg-black border border-[#1a1a1a] shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:border-[#333333]">
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-70"
        style={{ background: color }}
      />

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${color}18`, color }}
            >
              <Icon size={16} />
            </div>
            <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
              {title}
            </span>
          </div>

          {confidence != null && (
            <span className="text-[11px] font-semibold text-slate-400 bg-[#0d0d0d] px-2 py-0.5 rounded-full border border-[#222222]" title="Model Goodness-of-Fit Confidence">
              {Number(confidence).toFixed(0)}% Conf
            </span>
          )}
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Current
              </span>
              <div className="text-xl font-bold text-white">
                {current != null ? `${Number(current).toFixed(1)}${unit}` : '--'}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider">
                Forecast
              </span>
              <div className="text-xl font-bold text-cyan-300">
                {forecast != null ? `${Number(forecast).toFixed(1)}${unit}` : '--'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#1a1a1a] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 font-medium">
          {isUp ? (
            <span className={`inline-flex items-center gap-0.5 ${isWarning ? 'text-rose-400' : 'text-emerald-400'}`}>
              <ArrowUpRight size={14} /> +{changePct}%
            </span>
          ) : isDown ? (
            <span className={`inline-flex items-center gap-0.5 ${isWarning ? 'text-rose-400' : 'text-emerald-400'}`}>
              <ArrowDownRight size={14} /> {changePct}%
            </span>
          ) : (
            <span className="text-slate-400 inline-flex items-center gap-0.5">
              <Minus size={14} /> 0.0% Stable
            </span>
          )}
        </div>

        {extraInfo && (
          <span className="text-[11px] text-slate-400 font-medium truncate max-w-[130px]" title={extraInfo}>
            {extraInfo}
          </span>
        )}
      </div>
    </article>
  );
};

// ── Dual Forecast Chart (Solid History + Dashed Future + Confidence Area) ────
export const DualForecastChart = ({
  title,
  subtitle,
  data = [],
  color = '#06B6D4',
  forecastColor = '#67E8F9',
  unit = '%',
  horizonLabel = '24 Hours',
  server = '',
  loading,
  yDomain = [0, 100],
  alertThreshold,
  alertLabel,
}) => {
  const { chartTheme } = useSettings();
  const [modalOpen, setModalOpen] = useState(false);
  const panelRef = useRef(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const hasPoints = Array.isArray(data) && data.length > 0;

  // Find transition timestamp (first point with both history & forecast)
  const transitionPoint = data.find((p) => p.history !== null && p.forecast !== null);
  const transitionTime = transitionPoint?.time;

  // Compute confidence interval delta for area band
  const formattedData = data.map((d) => ({
    ...d,
    ci_range: d.lower_bound != null && d.upper_bound != null ? [d.lower_bound, d.upper_bound] : null,
  }));

  const handleDownload = async (format) => {
    try {
      if (!hasPoints) {
        showToast('No data available for this forecast.', true);
        return;
      }
      if (format === 'csv') {
        exportChartAsCsv({ title, data, keys: ['history', 'forecast', 'upper_bound', 'lower_bound'], timeKey: 'time' });
        showToast('Downloaded CSV forecast telemetry.');
      } else if (format === 'json') {
        exportChartAsJson({
          title,
          server,
          timeRange: horizonLabel,
          metric: title,
          data,
          keys: ['history', 'forecast', 'upper_bound', 'lower_bound'],
        });
        showToast('Downloaded JSON forecast telemetry.');
      } else {
        await exportChartAsPng({
          containerElement: panelRef.current,
          title,
          subtitle,
          server,
          timeRange: horizonLabel,
          legend: [
            { name: 'Historical (Observed)', color },
            { name: 'Forecast (ML Prediction)', color: forecastColor },
          ],
        });
        showToast('Downloaded PNG forecast chart.');
      }
    } catch (err) {
      console.error('Forecast export error:', err);
      showToast('Unable to export chart.', true);
    }
  };

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={formattedData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={`ci-gradient-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={forecastColor} stopOpacity={0.25} />
            <stop offset="100%" stopColor={forecastColor} stopOpacity={0.05} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="#161616" strokeDasharray="3 3" vertical={false} />

        <XAxis
          dataKey="time"
          tickFormatter={(value) => {
            if (!value) return '';
            const d = new Date(value);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }}
          stroke="#64748B"
          fontSize={11}
          minTickGap={35}
        />

        <YAxis
          domain={yDomain}
          stroke="#64748B"
          fontSize={11}
          unit={unit}
          allowDecimals={false}
        />

        <Tooltip content={<ForecastTooltip unit={unit} />} />

        {/* Shaded Confidence Interval Band */}
        <Area
          type="monotone"
          dataKey="upper_bound"
          fill={`url(#ci-gradient-${title.replace(/\s+/g, '')})`}
          stroke="none"
          connectNulls={false}
          name="95% Confidence Band"
        />

        {/* Vertical Transition Line between History and Future Prediction */}
        {transitionTime && (
          <ReferenceLine
            x={transitionTime}
            stroke="#94a3b8"
            strokeDasharray="3 3"
            label={{
              value: 'NOW',
              fill: '#94a3b8',
              fontSize: 10,
              fontWeight: 700,
              position: 'insideTopLeft',
            }}
          />
        )}

        {/* Optional threshold alert line (e.g. RAM > 90% or Temp > 85°C) */}
        {alertThreshold != null && (
          <ReferenceLine
            y={alertThreshold}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{
              value: alertLabel || `${alertThreshold}${unit} LIMIT`,
              fill: '#ef4444',
              fontSize: 10,
              fontWeight: 700,
              position: 'insideTopRight',
            }}
          />
        )}

        {/* Solid Historical Line */}
        <Line
          type="monotone"
          dataKey="history"
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, stroke: '#fff', strokeWidth: 1.5 }}
          name="Historical (Prometheus)"
          connectNulls={false}
        />

        {/* Dashed Future Forecast Line */}
        <Line
          type="monotone"
          dataKey="forecast"
          stroke={forecastColor}
          strokeWidth={2.5}
          strokeDasharray="6 5"
          dot={false}
          activeDot={{ r: 5, stroke: forecastColor, strokeWidth: 2 }}
          name="Forecast (ML Projection)"
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <section className="rounded-2xl bg-black border border-[#1a1a1a] p-5 shadow-xl flex flex-col justify-between hover:border-[#2a2a2a] transition-all" ref={panelRef}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>{title}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend indicator */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded" style={{ background: color }} />
              Historical
            </span>
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-3 h-0.5 border-b-2 border-dashed" style={{ borderColor: forecastColor }} />
              Forecast
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded opacity-40" style={{ background: forecastColor }} />
              95% CI
            </span>
          </div>

          <ChartActions
            title={title}
            onExpand={() => setModalOpen(true)}
            onDownload={handleDownload}
            disabled={loading || !hasPoints}
          />
        </div>
      </div>

      <div className="h-64 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <LoadingSkeleton />
          </div>
        ) : hasPoints ? (
          renderChart()
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Insufficient historical telemetry to build forecast curves.
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
        <div style={{ height: '480px', width: '100%' }}>
          {renderChart()}
        </div>
      </ChartModal>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl text-white ${toast.isError ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.message}
        </div>
      )}
    </section>
  );
};

// ── Predictive Alerts Banner ────────────────────────────────────────────────
export const PredictiveAlertsBanner = ({ alerts = [] }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-black border border-[#1a1a1a] text-xs text-slate-400 flex items-center gap-2.5">
        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
        <span>No future threshold breaches projected within the selected prediction horizon.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {alerts.map((alert, idx) => {
        const isCritical = alert.severity === 'critical';
        return (
          <div
            key={idx}
            className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
              isCritical
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {isCritical ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}
              </div>
              <div>
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <span>{alert.metric}</span>
                  {alert.eta && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isCritical ? 'bg-rose-500/25 text-rose-300' : 'bg-amber-500/25 text-amber-300'}`}>
                      ETA: {alert.eta}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-slate-300">{alert.message}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── AI Forecast Insights List ───────────────────────────────────────────────
export const AIInsightsSection = ({ insights = [], serverName, rangeLabel }) => {
  return (
    <section className="rounded-2xl bg-black border border-[#1a1a1a] p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AI Forecast Insights</h3>
            <p className="text-xs text-slate-400">Statistical pattern evaluation for {serverName} ({rangeLabel})</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          Live Model Analysis
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-[#050505] border border-[#1a1a1a] text-xs text-slate-300 flex items-start gap-2.5"
          >
            <Info size={15} className="text-cyan-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{insight}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
