import { Grid, Skeleton } from '@mui/material';
import MetricCard from './MetricCard';

export default function TopMetricsRow({ data, isLoading }) {
  if (isLoading) {
    return (
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {['cpu', 'memory', 'disk', 'network'].map((key) => (
          <Grid key={key} item xs={12} sm={6} md={3}>
            <Skeleton
              variant="rectangular"
              height={140}
              sx={{ bgcolor: '#111827', borderRadius: 2.5 }}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  // Extract CPU data safely from real API response
  const cpuData = data?.cpuSummary || data?.metricsSummary?.cpu || data?.cpu || {};
  const cpuValue = data?.cpuUsage ?? cpuData?.value ?? cpuData?.usage ?? data?.cpu;
  const cpuUnit = cpuData?.unit || (typeof cpuValue === 'number' ? '%' : '');
  const cpuStatus = cpuData?.status || data?.cpuStatus;
  const cpuDetails = cpuData?.details;
  const cpuChange = cpuData?.change;

  // Extract Memory data safely
  const memData = data?.memorySummary || data?.metricsSummary?.memory || data?.memory || {};
  const memValue = data?.memoryUsage ?? memData?.value ?? memData?.used ?? data?.memory;
  const memUnit = memData?.unit || (typeof memValue === 'number' ? '%' : '');
  const memStatus = memData?.status || data?.memoryStatus;
  const memDetails = memData?.details;
  const memChange = memData?.change;

  // Extract Disk data safely
  const diskData = data?.diskSummary || data?.metricsSummary?.disk || data?.disk || {};
  const diskValue = data?.diskUsage ?? diskData?.value ?? diskData?.usage ?? data?.disk;
  const diskUnit = diskData?.unit || (typeof diskValue === 'number' ? '%' : '');
  const diskStatus = diskData?.status || data?.diskStatus;
  const diskDetails = diskData?.details;
  const diskChange = diskData?.change;

  // Extract Network data safely
  const netData = data?.networkSummary || data?.metricsSummary?.network || data?.network || {};
  const netValue = data?.networkUsage ?? netData?.value ?? netData?.throughput ?? data?.network;
  const netUnit = netData?.unit || (typeof netValue === 'number' ? 'MB/s' : '');
  const netStatus = netData?.status || data?.networkStatus;
  const netDetails = netData?.details;
  const netChange = netData?.change;

  const metricsConfig = [
    {
      key: 'cpu',
      title: 'CPU Usage',
      value: cpuValue,
      unit: cpuUnit,
      status: cpuStatus,
      details: cpuDetails,
      change: cpuChange,
    },
    {
      key: 'memory',
      title: 'Memory Usage',
      value: memValue,
      unit: memUnit,
      status: memStatus,
      details: memDetails,
      change: memChange,
    },
    {
      key: 'disk',
      title: 'Disk Usage',
      value: diskValue,
      unit: diskUnit,
      status: diskStatus,
      details: diskDetails,
      change: diskChange,
    },
    {
      key: 'network',
      title: 'Network Usage',
      value: netValue,
      unit: netUnit,
      status: netStatus,
      details: netDetails,
      change: netChange,
    },
  ];

  return (
    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      {metricsConfig.map((item) => (
        <Grid key={item.key} item xs={12} sm={6} md={3}>
          <MetricCard
            title={item.title}
            metricKey={item.key}
            rawValue={item.value}
            unit={item.unit}
            status={item.status}
            details={item.details}
            change={item.change}
            isLoading={false}
          />
        </Grid>
      ))}
    </Grid>
  );
}
