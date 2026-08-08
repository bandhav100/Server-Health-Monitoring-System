import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAlertsData } from '../../hooks/useAlertsData';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { data: alertsData, isLoading, isError, error, refetch } = useAlertsData('unresolved');

  // Extract unresolved alerts
  const activeAlerts = Array.isArray(alertsData)
    ? alertsData
    : Array.isArray(alertsData?.alerts)
    ? alertsData.alerts
    : Array.isArray(alertsData?.content)
    ? alertsData.content
    : [];

  return (
    <Container maxWidth={false} disableGutters>
      {/* Header Bar */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
            <NotificationsActiveIcon sx={{ color: '#EF4444', fontSize: 28 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
              System Notifications
            </Typography>
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            Real-time incident notifications and active alert dispatches
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
          Refresh Notifications
        </Button>
      </Box>

      {/* Error State Banner */}
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
          <AlertTitle sx={{ fontWeight: 700 }}>Failed to fetch notifications</AlertTitle>
          {error?.message || 'Unable to connect to notifications service.'}
        </Alert>
      )}

      {/* Main Notifications List */}
      <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '1rem' }}>
            Active Incident Notifications ({activeAlerts.length})
          </Typography>

          <Button
            variant="text"
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/alerts')}
            sx={{ color: '#3B82F6', fontWeight: 600 }}
          >
            Manage Alerts Center
          </Button>
        </Box>

        <Divider sx={{ borderColor: '#1F2937', mb: 2 }} />

        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[1, 2, 3].map((row) => (
              <Skeleton key={row} height={60} sx={{ bgcolor: '#1F2937', borderRadius: 2 }} />
            ))}
          </Box>
        ) : activeAlerts.length > 0 ? (
          <List disablePadding>
            {activeAlerts.map((alert, idx) => {
              const alertMsg = alert.message || alert.description || alert.title || 'System Alert Incident';
              const serverName = alert.serverName || alert.serverId || alert.server || 'Unavailable';
              const severity = alert.severity || alert.level || 'CRITICAL';
              const timestamp = alert.timestamp || alert.time || alert.createdAt || 'Unavailable';

              return (
                <ListItem
                  key={alert.id || idx}
                  button
                  onClick={() => navigate('/alerts')}
                  sx={{
                    borderRadius: 2,
                    mb: 1.5,
                    p: 2,
                    bgcolor: '#0D131F',
                    border: '1px solid #1F2937',
                    '&:hover': { borderColor: '#3B82F6', bgcolor: 'rgba(59, 130, 246, 0.04)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: '#EF4444' }}>
                    <ErrorOutlineIcon fontSize="medium" />
                  </ListItemIcon>

                  <ListItemText
                    primary={alertMsg}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5, alignItems: 'center' }}>
                        <span>Target Server: <strong>{serverName}</strong></span>
                        <span>•</span>
                        <span>Timestamp: {timestamp}</span>
                      </Box>
                    }
                    primaryTypographyProps={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: '#64748B', fontSize: '0.75rem' }}
                  />

                  <Chip
                    label={String(severity).toUpperCase()}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      bgcolor: 'rgba(239, 68, 68, 0.12)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: '#64748B', fontSize: '0.9rem' }}>
              No active unresolved notifications at this time. All systems operating normally.
            </Typography>
          </Box>
        )}
      </Card>
    </Container>
  );
}
