import { useState } from 'react';
import {
  Typography,
  Box,
  Container,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Alert,
  AlertTitle,
  Skeleton,
  Grid,
  TextField,
  InputAdornment,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { useMetricsData } from '../../hooks/useMetricsData';

const CustomTooltip = ({ active, payload, label }) => {
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
            {entry.name}: {entry.value}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

export default function MetricsPage() {
  const { data, isLoading, isError, error, refetch } = useMetricsData();
  const [searchQuery, setSearchQuery] = useState('');

  // Extract metrics list safely from API response
  const metricsList = Array.isArray(data)
    ? data
    : Array.isArray(data?.metrics)
    ? data.metrics
    : Array.isArray(data?.content)
    ? data.content
    : Array.isArray(data?.items)
    ? data.items
    : [];

  // Extract trend chart data safely if provided by API
  const trendData = Array.isArray(data?.trends)
    ? data.trends
    : Array.isArray(data?.timeSeries)
    ? data.timeSeries
    : Array.isArray(data?.history)
    ? data.history
    : [];

  const filteredMetrics = metricsList.filter((metric) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (metric.name || metric.metricName || metric.key || '').toLowerCase();
    const cat = (metric.category || metric.type || '').toLowerCase();
    const srv = (metric.serverId || metric.server || '').toLowerCase();
    return name.includes(q) || cat.includes(q) || srv.includes(q);
  });

  return (
    <Container maxWidth={false} disableGutters>
      {/* Header Bar */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em' }} gutterBottom>
            Infrastructure Metrics
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Explore real-time CPU, Memory, Disk, and Network telemetry data.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={isLoading}
          sx={{
            borderColor: '#1F2937',
            color: '#94A3B8',
            '&:hover': {
              borderColor: '#3B82F6',
              color: '#F8FAFC',
              bgcolor: 'rgba(59, 130, 246, 0.08)',
            },
          }}
        >
          Refresh Metrics
        </Button>
      </Box>

      {/* Error & Retry State Banner */}
      {isError && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            bgcolor: '#1E1215',
            color: '#FCA5A5',
            border: '1px solid #7F1D1D',
            '& .MuiAlert-icon': { color: '#EF4444' },
          }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          <AlertTitle sx={{ fontWeight: 700 }}>Failed to load metrics</AlertTitle>
          {error?.message || 'Unable to connect to backend server at http://localhost:8081'}
        </Alert>
      )}

      {/* Telemetry Overview Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                <AssessmentIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Total Metrics Logged
                </Typography>
                {isLoading ? (
                  <Skeleton width={60} height={28} sx={{ bgcolor: '#1F2937' }} />
                ) : (
                  <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 700 }}>
                    {metricsList.length > 0 ? metricsList.length : 'Unavailable'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                <MemoryIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  CPU Metrics
                </Typography>
                {isLoading ? (
                  <Skeleton width={60} height={28} sx={{ bgcolor: '#1F2937' }} />
                ) : (
                  <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 700 }}>
                    {data?.cpuCount !== undefined ? data.cpuCount : metricsList.filter(m => (m.category || m.name || '').toLowerCase().includes('cpu')).length || 'Unavailable'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                <StorageIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Memory / Storage Metrics
                </Typography>
                {isLoading ? (
                  <Skeleton width={60} height={28} sx={{ bgcolor: '#1F2937' }} />
                ) : (
                  <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 700 }}>
                    {data?.memoryCount !== undefined ? data.memoryCount : metricsList.filter(m => (m.category || m.name || '').toLowerCase().match(/mem|storage|disk/)).length || 'Unavailable'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
                <SpeedIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Network Metrics
                </Typography>
                {isLoading ? (
                  <Skeleton width={60} height={28} sx={{ bgcolor: '#1F2937' }} />
                ) : (
                  <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 700 }}>
                    {data?.networkCount !== undefined ? data.networkCount : metricsList.filter(m => (m.category || m.name || '').toLowerCase().includes('net')).length || 'Unavailable'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Telemetry Trend Chart (If provided by API) */}
      <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2.5, mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.95rem' }}>
            Telemetry Metric Trends
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Real-time metric telemetry history from GET /api/metrics
          </Typography>
        </Box>

        {isLoading ? (
          <Skeleton variant="rectangular" height={220} sx={{ bgcolor: '#1F2937', borderRadius: 2 }} />
        ) : trendData.length > 0 ? (
          <Box sx={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" name="Metric Value" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#metricGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255, 255, 255, 0.02)', borderRadius: 2, border: '1px stroke rgba(255, 255, 255, 0.05)' }}>
            <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
              Telemetry trend time-series data unavailable
            </Typography>
          </Box>
        )}
      </Card>

      {/* Metrics Data Table */}
      <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
          <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.95rem' }}>
            Telemetry Metrics Log
          </Typography>

          <TextField
            placeholder="Search metrics..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#64748B', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 260,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#0D131F',
                fontSize: '0.8125rem',
                color: '#F8FAFC',
                '& fieldset': { borderColor: '#1F2937' },
                '&:hover fieldset': { borderColor: '#3B82F6' },
              },
            }}
          />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { borderColor: '#1F2937', color: '#64748B', fontSize: '0.75rem', fontWeight: 700 } }}>
                <TableCell>Metric Key / Name</TableCell>
                <TableCell>Server Node</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Value / Unit</TableCell>
                <TableCell align="right">Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((row) => (
                  <TableRow key={row} sx={{ '& td': { borderColor: '#1F2937', py: 1.5 } }}>
                    <TableCell><Skeleton width={120} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={100} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={80} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell align="right"><Skeleton width={60} height={20} sx={{ bgcolor: '#1F2937', ml: 'auto' }} /></TableCell>
                    <TableCell align="right"><Skeleton width={80} height={20} sx={{ bgcolor: '#1F2937', ml: 'auto' }} /></TableCell>
                  </TableRow>
                ))
              ) : filteredMetrics.length > 0 ? (
                filteredMetrics.map((metric, idx) => {
                  const metricName = metric.name || metric.metricName || metric.key || 'Unavailable';
                  const serverNode = metric.serverName || metric.serverId || metric.server || 'Unavailable';
                  const category = metric.category || metric.type || 'System';
                  const value = metric.value !== undefined && metric.value !== null ? String(metric.value) : 'Unavailable';
                  const unit = metric.unit || '';
                  const timestamp = metric.timestamp || metric.createdAt || metric.time || 'Unavailable';

                  return (
                    <TableRow key={metric.id || idx} sx={{ '& td': { borderColor: '#1F2937', py: 1.25 } }}>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontSize: '0.8125rem', fontWeight: 600 }}>
                          {metricName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8', fontSize: '0.8125rem' }}>
                        {serverNode}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={category}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                            color: '#94A3B8',
                            border: '1px solid #1F2937',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#3B82F6', fontSize: '0.8125rem', fontWeight: 700 }}>
                        {value} {unit}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                        {timestamp}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow sx={{ '& td': { borderColor: '#1F2937' } }}>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#64748B', fontSize: '0.875rem' }}>
                    No telemetry metrics available from GET /api/metrics
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Container>
  );
}
