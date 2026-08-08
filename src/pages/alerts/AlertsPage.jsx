import { useState } from 'react';
import {
  Typography,
  Box,
  Container,
  Card,
  Grid,
  Chip,
  Button,
  Alert,
  AlertTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  CircularProgress,
  alpha,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CheckIcon from '@mui/icons-material/Check';
import { useAlertsData, useAlertDashboardSummary, useResolveAlertMutation } from '../../hooks/useAlertsData';

const SEVERITY_MAP = {
  critical: { color: '#EF4444', bg: '#EF4444', label: 'CRITICAL' },
  warning: { color: '#F59E0B', bg: '#F59E0B', label: 'WARNING' },
  info: { color: '#3B82F6', bg: '#3B82F6', label: 'INFO' },
};

const STATUS_MAP = {
  resolved: { color: '#10B981', label: 'RESOLVED' },
  unresolved: { color: '#EF4444', label: 'UNRESOLVED' },
  active: { color: '#F59E0B', label: 'ACTIVE' },
  firing: { color: '#EF4444', label: 'FIRING' },
};

export default function AlertsPage() {
  const [tabFilter, setTabFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: alertsData, isLoading, isError, error, refetch } = useAlertsData(tabFilter);
  const { data: summaryData, isLoading: isSummaryLoading } = useAlertDashboardSummary();
  const resolveMutation = useResolveAlertMutation();

  // Safely extract alerts array
  const alertsList = Array.isArray(alertsData)
    ? alertsData
    : Array.isArray(alertsData?.alerts)
    ? alertsData.alerts
    : Array.isArray(alertsData?.content)
    ? alertsData.content
    : Array.isArray(alertsData?.items)
    ? alertsData.items
    : [];

  // Safely compute summary counts from dashboard summary API or alerts list
  const totalCount = summaryData?.total ?? summaryData?.totalAlerts ?? (Array.isArray(alertsData) ? alertsData.length : undefined);
  const unresolvedCount = summaryData?.unresolved ?? summaryData?.unresolvedAlerts ?? summaryData?.activeCount ?? alertsList.filter(a => !(a.resolved || (a.status || '').toLowerCase() === 'resolved')).length;
  const resolvedCount = summaryData?.resolved ?? summaryData?.resolvedAlerts ?? alertsList.filter(a => a.resolved || (a.status || '').toLowerCase() === 'resolved').length;
  const criticalCount = summaryData?.critical ?? summaryData?.criticalAlerts ?? alertsList.filter(a => (a.severity || '').toLowerCase() === 'critical').length;

  const filteredAlerts = alertsList.filter((alert) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const server = (alert.serverName || alert.serverId || alert.server || '').toLowerCase();
    const msg = (alert.message || alert.description || alert.title || '').toLowerCase();
    const sev = (alert.severity || '').toLowerCase();
    return server.includes(q) || msg.includes(q) || sev.includes(q);
  });

  const handleResolveAlert = (alertId) => {
    if (!alertId) return;
    resolveMutation.mutate(alertId);
  };

  return (
    <Container maxWidth={false} disableGutters>
      {/* Header Bar */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em' }} gutterBottom>
            System Alerts & Incidents
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Track active incidents, threshold triggers, and resolve server alerts in real time.
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
          Refresh Alerts
        </Button>
      </Box>

      {/* Error & Retry Banner */}
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
          <AlertTitle sx={{ fontWeight: 700 }}>Failed to load alerts</AlertTitle>
          {error?.message || 'Unable to connect to backend server at http://localhost:8081'}
        </Alert>
      )}

      {/* Summary KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                <NotificationsActiveIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Total Alerts
                </Typography>
                {isLoading || isSummaryLoading ? (
                  <Skeleton width={60} height={28} sx={{ bgcolor: '#1F2937' }} />
                ) : (
                  <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 700 }}>
                    {totalCount !== undefined && totalCount !== null ? totalCount : 'Unavailable'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                <ErrorIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Unresolved Alerts
                </Typography>
                {isLoading || isSummaryLoading ? (
                  <Skeleton width={60} height={28} sx={{ bgcolor: '#1F2937' }} />
                ) : (
                  <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 700 }}>
                    {unresolvedCount !== undefined && unresolvedCount !== null ? unresolvedCount : 'Unavailable'}
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
                <CheckCircleIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Resolved Alerts
                </Typography>
                {isLoading || isSummaryLoading ? (
                  <Skeleton width={60} height={28} sx={{ bgcolor: '#1F2937' }} />
                ) : (
                  <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 700 }}>
                    {resolvedCount !== undefined && resolvedCount !== null ? resolvedCount : 'Unavailable'}
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
                <WarningAmberIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Critical Incidents
                </Typography>
                {isLoading || isSummaryLoading ? (
                  <Skeleton width={60} height={28} sx={{ bgcolor: '#1F2937' }} />
                ) : (
                  <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                    {criticalCount !== undefined && criticalCount !== null ? criticalCount : 'Unavailable'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table & Filters */}
      <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {/* Tabs Filter */}
          <Tabs
            value={tabFilter}
            onChange={(e, val) => setTabFilter(val)}
            sx={{
              minHeight: 38,
              '& .MuiTab-root': {
                minHeight: 38,
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#94A3B8',
                '&.Mui-selected': { color: '#3B82F6' },
              },
              '& .MuiTabs-indicator': { bgcolor: '#3B82F6' },
            }}
          >
            <Tab value="all" label="All Alerts" />
            <Tab value="unresolved" label="Unresolved" />
            <Tab value="resolved" label="Resolved" />
          </Tabs>

          {/* Search Filter Input */}
          <TextField
            placeholder="Search alerts or servers..."
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
                <TableCell>Alert ID</TableCell>
                <TableCell>Server Node</TableCell>
                <TableCell>Incident Message</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((row) => (
                  <TableRow key={row} sx={{ '& td': { borderColor: '#1F2937', py: 1.5 } }}>
                    <TableCell><Skeleton width={80} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={120} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={180} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={70} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={80} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={90} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell align="right"><Skeleton width={80} height={26} sx={{ bgcolor: '#1F2937', ml: 'auto' }} /></TableCell>
                  </TableRow>
                ))
              ) : filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert, idx) => {
                  const alertId = alert.id || alert.alertId || `ALT-${idx + 1}`;
                  const serverName = alert.serverName || alert.serverId || alert.server || 'Unavailable';
                  const message = alert.message || alert.description || alert.title || alert.ruleName || 'Unavailable';
                  const sevKey = (alert.severity || alert.level || 'info').toLowerCase();
                  const severity = SEVERITY_MAP[sevKey] || { color: '#94A3B8', bg: '#94A3B8', label: (alert.severity || 'INFO').toUpperCase() };

                  const isResolved = alert.resolved || (alert.status || '').toLowerCase() === 'resolved';
                  const stKey = isResolved ? 'resolved' : (alert.status || 'unresolved').toLowerCase();
                  const statusInfo = STATUS_MAP[stKey] || (isResolved ? STATUS_MAP.resolved : STATUS_MAP.unresolved);
                  const timestamp = alert.timestamp || alert.createdAt || alert.time || 'Unavailable';

                  const isResolving = resolveMutation.isLoading && resolveMutation.variables === alert.id;

                  return (
                    <TableRow key={alert.id || idx} sx={{ '& td': { borderColor: '#1F2937', py: 1.25 } }}>
                      <TableCell sx={{ color: '#3B82F6', fontWeight: 600, fontSize: '0.8125rem' }}>
                        {alertId}
                      </TableCell>
                      <TableCell sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.8125rem' }}>
                        {serverName}
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8', fontSize: '0.8125rem' }}>
                        {message}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={severity.label}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            bgcolor: alpha(severity.bg, 0.12),
                            color: severity.color,
                            border: `1px solid ${alpha(severity.bg, 0.3)}`,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusInfo.label}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            bgcolor: alpha(statusInfo.color, 0.12),
                            color: statusInfo.color,
                            border: `1px solid ${alpha(statusInfo.color, 0.3)}`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                        {timestamp}
                      </TableCell>
                      <TableCell align="right">
                        {!isResolved ? (
                          <Button
                            variant="outlined"
                            size="small"
                            color="success"
                            startIcon={isResolving ? <CircularProgress size={12} color="inherit" /> : <CheckIcon sx={{ fontSize: 14 }} />}
                            onClick={() => handleResolveAlert(alert.id)}
                            disabled={resolveMutation.isLoading}
                            sx={{
                              height: 26,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'none',
                              borderColor: 'rgba(16, 185, 129, 0.4)',
                              color: '#10B981',
                              '&:hover': {
                                bgcolor: 'rgba(16, 185, 129, 0.12)',
                                borderColor: '#10B981',
                              },
                            }}
                          >
                            Resolve
                          </Button>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                            Resolved
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow sx={{ '& td': { borderColor: '#1F2937' } }}>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#64748B', fontSize: '0.875rem' }}>
                    No alerts found for the selected view
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
