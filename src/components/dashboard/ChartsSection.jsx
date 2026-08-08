import {
  Grid,
  Card,
  Typography,
  Box,
  Skeleton,
} from '@mui/material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: '#0D131F',
          border: '1px solid #1F2937',
          borderRadius: 1.5,
          p: 1.5,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block', mb: 0.5 }}>
          Time: {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography
            key={`item-${index}`}
            variant="body2"
            sx={{ color: entry.color || '#F8FAFC', fontWeight: 600, fontSize: '0.8125rem' }}
          >
            {entry.name}: {entry.value} {unit}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

const EmptyChartPlaceholder = ({ title, message = 'Data Unavailable' }) => (
  <Box
    sx={{
      height: 230,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'rgba(255, 255, 255, 0.02)',
      borderRadius: 2,
      border: '1px stroke rgba(255, 255, 255, 0.05)',
      p: 2,
    }}
  >
    <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 600, mb: 0.5 }}>
      {title}
    </Typography>
    <Typography variant="caption" sx={{ color: '#64748B' }}>
      {message}
    </Typography>
  </Box>
);

export default function ChartsSection({ cpuTrend, memoryTrend, networkTrend, diskDistribution, isLoading }) {
  if (isLoading) {
    return (
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid key={item} item xs={12} md={6}>
            <Skeleton variant="rectangular" height={280} sx={{ bgcolor: '#111827', borderRadius: 2.5 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  const hasCpuData = Array.isArray(cpuTrend) && cpuTrend.length > 0;
  const hasMemoryData = Array.isArray(memoryTrend) && memoryTrend.length > 0;
  const hasNetworkData = Array.isArray(networkTrend) && networkTrend.length > 0;
  const hasDiskData = Array.isArray(diskDistribution) && diskDistribution.length > 0;

  return (
    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      {/* 1. CPU Trend Chart */}
      <Grid item xs={12} md={6}>
        <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.95rem' }}>
              CPU Utilization Trend
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Real-time CPU percentage over 24h window
            </Typography>
          </Box>
          {hasCpuData ? (
            <Box sx={{ width: '100%', height: 230 }}>
              <ResponsiveContainer>
                <AreaChart data={cpuTrend}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <RechartsTooltip content={<CustomTooltip unit="%" />} />
                  <Area type="monotone" dataKey="usage" name="CPU Usage" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#cpuGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <EmptyChartPlaceholder title="CPU Trend" message="CPU trend metrics unavailable from API" />
          )}
        </Card>
      </Grid>

      {/* 2. Memory Trend Chart */}
      <Grid item xs={12} md={6}>
        <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.95rem' }}>
              Memory Consumption Trend
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              RAM allocation metrics
            </Typography>
          </Box>
          {hasMemoryData ? (
            <Box sx={{ width: '100%', height: 230 }}>
              <ResponsiveContainer>
                <AreaChart data={memoryTrend}>
                  <defs>
                    <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip unit="GB" />} />
                  <Area type="monotone" dataKey="used" name="Used Memory" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#memGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <EmptyChartPlaceholder title="Memory Trend" message="Memory consumption metrics unavailable from API" />
          )}
        </Card>
      </Grid>

      {/* 3. Network Trend Chart */}
      <Grid item xs={12} md={6}>
        <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.95rem' }}>
              Network Throughput
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Data rate throughput (Ingress / Egress)
            </Typography>
          </Box>
          {hasNetworkData ? (
            <Box sx={{ width: '100%', height: 230 }}>
              <ResponsiveContainer>
                <LineChart data={networkTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip unit="MB/s" />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="ingress" name="Ingress MB/s" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="egress" name="Egress MB/s" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <EmptyChartPlaceholder title="Network Throughput" message="Network telemetry metrics unavailable from API" />
          )}
        </Card>
      </Grid>

      {/* 4. Disk Usage Distribution Chart */}
      <Grid item xs={12} md={6}>
        <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.95rem' }}>
              Disk Usage Distribution
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Storage partition breakdown
            </Typography>
          </Box>
          {hasDiskData ? (
            <Box sx={{ width: '100%', height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={diskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {diskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip unit="GB" />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <EmptyChartPlaceholder title="Disk Distribution" message="Disk storage distribution unavailable from API" />
          )}
        </Card>
      </Grid>
    </Grid>
  );
}
