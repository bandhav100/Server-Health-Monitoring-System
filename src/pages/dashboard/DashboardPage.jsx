import { Typography, Box, Container, Alert, AlertTitle, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useDashboardData } from '../../hooks/useDashboardData';
import { TopMetricsRow, ChartsSection, BottomSection } from '../../components/dashboard';

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboardData();

  return (
    <Container maxWidth={false} disableGutters>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em' }} gutterBottom>
            Server Health Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor your infrastructure in real time.
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
          Refresh
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
          <AlertTitle sx={{ fontWeight: 700 }}>Failed to load dashboard metrics</AlertTitle>
          {error?.message || 'Unable to connect to backend server at http://localhost:8081'}
        </Alert>
      )}

      {/* 1. Top Metrics Row (CPU, Memory, Disk, Network) */}
      <TopMetricsRow data={data} isLoading={isLoading} />

      {/* 2. Charts Section (CPU Trend, Memory Trend, Network Trend, Disk Distribution) */}
      <ChartsSection
        cpuTrend={data?.cpuTrend || data?.cpuHistory}
        memoryTrend={data?.memoryTrend || data?.memoryHistory}
        networkTrend={data?.networkTrend || data?.networkHistory}
        diskDistribution={data?.diskDistribution || data?.diskBreakdown}
        isLoading={isLoading}
      />

      {/* 3. Bottom Section (Recent Alerts, Recent Servers, Recent Metrics) */}
      <BottomSection
        recentAlerts={data?.recentAlerts || data?.alerts}
        recentServers={data?.recentServers || data?.servers}
        recentMetrics={data?.recentMetrics || data?.metrics}
        isLoading={isLoading}
      />
    </Container>
  );
}
