import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

const colors = {
  cpu: '#2878F0',
};

const timeLabel = (value: any) =>
  value
    ? new Date(Number(value) < 1e12 ? Number(value) * 1000 : value).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

const numeric = (value: any) => (Number.isFinite(Number(value)) ? Number(value) : 0);

export const KpiCard = ({ icon: Icon, title, value, unit, color, trend = 0, lastUpdated = 'now' }: any) => {
  const trendIcon = trend > 0 ? '📈' : '📉';
  return (
    <motion.article className="noc-kpi" whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300 }}>
      <div className="noc-kpi-top">
        <span className="noc-kpi-icon" style={{ color, background: `${color}16` }}>
          <Icon size={18} />
        </span>
        <span className="noc-live">
          <i /> LIVE
        </span>
      </div>
      <p>{title}</p>
      <strong>
        {Number(value).toFixed(1)}<small>{unit}</small>
      </strong>
      <div className="noc-progress">
        <i style={{ width: `${Math.min(100, numeric(value))}%`, background: color }} />
      </div>
      <footer>
        <span style={{ color, display: 'flex', alignItems: 'center', gap: '4px' }}>
          {trendIcon} {Math.abs(trend).toFixed(1)}%
        </span>
        <span>{lastUpdated}</span>
      </footer>
    </motion.article>
  );
};

export const Panel = ({ title, subtitle, children, className = '' }: any) => (
  <section className={`noc-panel ${className}`}>
    <header className="noc-panel-head">
      <div className="noc-panel-title">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <span className="noc-live">
        <i /> LIVE
      </span>
    </header>
    {children}
  </section>
);

export const CpuTrendChart = ({ data }: any) => (
  <Panel title="CPU Usage Trend" subtitle="Average / Peak / Min / Current">
    {data?.length ? (
      <div className="noc-chart" style={{ height: 280 }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.cpu} stopOpacity={0.25} />
                <stop offset="100%" stopColor={colors.cpu} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E8EDF4" vertical={false} />
            <XAxis dataKey="timestamp" tickFormatter={timeLabel} tick={{ fill: '#8A96A8', fontSize: 10 }} minTickGap={35} />
            <YAxis domain={[0, 100]} tick={{ fill: '#8A96A8', fontSize: 10 }} width={35} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E8EDF4', borderRadius: '8px', padding: '10px' }} />
            <Area type="monotone" dataKey="value" name="CPU %" stroke={colors.cpu} fill="url(#cpuGradient)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <div className="noc-empty">No data available</div>
    )}
  </Panel>
);
