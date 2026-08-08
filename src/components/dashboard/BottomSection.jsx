import {
  Grid,
  Card,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  alpha,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StorageIcon from '@mui/icons-material/Storage';
import AssessmentIcon from '@mui/icons-material/Assessment';

const SEVERITY_MAP = {
  critical: { color: '#EF4444', label: 'CRITICAL' },
  warning: { color: '#F59E0B', label: 'WARNING' },
  info: { color: '#3B82F6', label: 'INFO' },
};

const SERVER_STATUS_MAP = {
  online: { color: '#10B981', label: 'ONLINE' },
  healthy: { color: '#10B981', label: 'HEALTHY' },
  warning: { color: '#F59E0B', label: 'WARNING' },
  offline: { color: '#EF4444', label: 'OFFLINE' },
  unhealthy: { color: '#EF4444', label: 'UNHEALTHY' },
};

export default function BottomSection({ recentAlerts = [], recentServers = [], recentMetrics = [], isLoading }) {
  if (isLoading) {
    return (
      <Grid container spacing={2.5}>
        {[1, 2, 3].map((item) => (
          <Grid key={item} item xs={12} lg={4}>
            <Skeleton variant="rectangular" height={320} sx={{ bgcolor: '#111827', borderRadius: 2.5 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  const alertsList = Array.isArray(recentAlerts) ? recentAlerts : [];
  const serversList = Array.isArray(recentServers) ? recentServers : [];
  const metricsList = Array.isArray(recentMetrics) ? recentMetrics : [];

  return (
    <Grid container spacing={2.5}>
      {/* 1. Recent Alerts */}
      <Grid item xs={12} lg={4}>
        <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <WarningAmberIcon sx={{ color: '#F59E0B', fontSize: 22 }} />
            <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.95rem' }}>
              Recent System Alerts
            </Typography>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { borderColor: '#1F2937', color: '#64748B', fontSize: '0.75rem' } }}>
                  <TableCell>Alert / Server</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell align="right">Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alertsList.length > 0 ? (
                  alertsList.map((alert, idx) => {
                    const sevKey = (alert.severity || alert.level || 'info').toLowerCase();
                    const severity = SEVERITY_MAP[sevKey] || { color: '#94A3B8', label: (alert.severity || 'INFO').toUpperCase() };
                    const serverName = alert.serverName || alert.serverId || alert.server || 'Unavailable';
                    const message = alert.message || alert.description || alert.title || 'Unavailable';
                    const timestamp = alert.timestamp || alert.createdAt || alert.time || 'Unavailable';

                    return (
                      <TableRow key={alert.id || idx} sx={{ '& td': { borderColor: '#1F2937', py: 1.25 } }}>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontSize: '0.8125rem', fontWeight: 600 }}>
                            {serverName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem' }}>
                            {message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={severity.label}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              bgcolor: alpha(severity.color, 0.12),
                              color: severity.color,
                              border: `1px solid ${alpha(severity.color, 0.3)}`,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                          {timestamp}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow sx={{ '& td': { borderColor: '#1F2937' } }}>
                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: '#64748B', fontSize: '0.8125rem' }}>
                      No recent alerts available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>

      {/* 2. Recent Servers */}
      <Grid item xs={12} lg={4}>
        <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <StorageIcon sx={{ color: '#3B82F6', fontSize: 22 }} />
            <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.95rem' }}>
              Active Registered Servers
            </Typography>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { borderColor: '#1F2937', color: '#64748B', fontSize: '0.75rem' } }}>
                  <TableCell>Hostname / IP</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">CPU / RAM</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serversList.length > 0 ? (
                  serversList.map((server, idx) => {
                    const stKey = (server.status || 'online').toLowerCase();
                    const status = SERVER_STATUS_MAP[stKey] || { color: '#94A3B8', label: (server.status || 'ONLINE').toUpperCase() };
                    const serverId = server.name || server.hostname || server.id || 'Unavailable';
                    const ip = server.ipAddress || server.ip || 'Unavailable';
                    const region = server.region || server.location || 'Unavailable';
                    const cpu = server.cpuLoad || server.cpuUsage ? `${server.cpuLoad || server.cpuUsage}%` : 'Unavailable';
                    const ram = server.ramLoad || server.memoryUsage ? `${server.ramLoad || server.memoryUsage}%` : 'Unavailable';

                    return (
                      <TableRow key={server.id || idx} sx={{ '& td': { borderColor: '#1F2937', py: 1.25 } }}>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontSize: '0.8125rem', fontWeight: 600 }}>
                            {serverId}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                            {ip} • {region}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status.label}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              bgcolor: alpha(status.color, 0.12),
                              color: status.color,
                              border: `1px solid ${alpha(status.color, 0.3)}`,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }}>
                          {cpu} / {ram}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow sx={{ '& td': { borderColor: '#1F2937' } }}>
                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: '#64748B', fontSize: '0.8125rem' }}>
                      No active servers available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>

      {/* 3. Recent Metrics */}
      <Grid item xs={12} lg={4}>
        <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AssessmentIcon sx={{ color: '#10B981', fontSize: 22 }} />
            <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.95rem' }}>
              Live Telemetry Metrics
            </Typography>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { borderColor: '#1F2937', color: '#64748B', fontSize: '0.75rem' } }}>
                  <TableCell>Metric Key</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metricsList.length > 0 ? (
                  metricsList.map((metric, idx) => {
                    const metricName = metric.metricName || metric.name || metric.key || 'Unavailable';
                    const category = metric.category || metric.type || 'System';
                    const value = metric.value !== undefined && metric.value !== null ? String(metric.value) : 'Unavailable';
                    const unit = metric.unit || '';
                    const timestamp = metric.timestamp || metric.time || 'Unavailable';

                    return (
                      <TableRow key={metric.id || idx} sx={{ '& td': { borderColor: '#1F2937', py: 1.25 } }}>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontSize: '0.8125rem', fontWeight: 600 }}>
                            {metricName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                            Logged at {timestamp}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={category}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.625rem',
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
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow sx={{ '& td': { borderColor: '#1F2937' } }}>
                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: '#64748B', fontSize: '0.8125rem' }}>
                      No telemetry metrics available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  );
}
