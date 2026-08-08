import { useState } from 'react';
import {
  Typography,
  Box,
  Container,
  Card,
  Grid,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import PaletteIcon from '@mui/icons-material/Palette';
import InfoIcon from '@mui/icons-material/Info';
import StorageIcon from '@mui/icons-material/Storage';
import SaveIcon from '@mui/icons-material/Save';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import { toast } from 'react-toastify';

export default function SettingsPage() {
  // Theme Preference State (persisted in localStorage)
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('shms_theme_mode') || 'dark';
  });

  // Refresh Interval State (persisted in localStorage)
  const [refreshInterval, setRefreshInterval] = useState(() => {
    return localStorage.getItem('shms_refresh_interval') || '30';
  });

  // Compact Mode State (persisted in localStorage)
  const [compactView, setCompactView] = useState(() => {
    return localStorage.getItem('shms_compact_view') === 'true';
  });

  // Read environment variables actually available to frontend
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'Not Configured';
  const mlUrl = import.meta.env.VITE_ML_URL || 'Not Configured';
  const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || 'Not Configured';
  const envMode = import.meta.env.MODE || 'development';

  // Save Preferences to LocalStorage
  const handleSavePreferences = () => {
    localStorage.setItem('shms_theme_mode', themeMode);
    localStorage.setItem('shms_refresh_interval', refreshInterval);
    localStorage.setItem('shms_compact_view', String(compactView));
    toast.success('Settings and preferences saved successfully');
  };

  return (
    <Container maxWidth={false} disableGutters>
      {/* Header Bar */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
            <SettingsIcon sx={{ color: '#3B82F6', fontSize: 28 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
              System Preferences & Settings
            </Typography>
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            Manage UI display preferences, auto-refresh intervals, and review endpoint configurations.
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="small"
          startIcon={<SaveIcon />}
          onClick={handleSavePreferences}
          sx={{
            bgcolor: '#2563EB',
            fontWeight: 600,
            '&:hover': { bgcolor: '#1D4ED8' },
          }}
        >
          Save Preferences
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* 1. Display & UI Preferences */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                <PaletteIcon />
              </Box>
              <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '1rem' }}>
                User Interface Preferences
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Theme Preference */}
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#94A3B8' }}>Theme Mode</InputLabel>
                <Select
                  value={themeMode}
                  label="Theme Mode"
                  onChange={(e) => setThemeMode(e.target.value)}
                  sx={{
                    color: '#F8FAFC',
                    bgcolor: '#0D131F',
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1F2937' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
                  }}
                >
                  <MenuItem value="dark">Dark Theme (Grafana Enterprise Dark)</MenuItem>
                  <MenuItem value="light">Light Theme (Standard Light)</MenuItem>
                  <MenuItem value="system">System Default</MenuItem>
                </Select>
              </FormControl>

              {/* Auto-Refresh Interval */}
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#94A3B8' }}>Dashboard Auto-Refresh Interval</InputLabel>
                <Select
                  value={refreshInterval}
                  label="Dashboard Auto-Refresh Interval"
                  onChange={(e) => setRefreshInterval(e.target.value)}
                  sx={{
                    color: '#F8FAFC',
                    bgcolor: '#0D131F',
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1F2937' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
                  }}
                >
                  <MenuItem value="10">10 Seconds (Fast)</MenuItem>
                  <MenuItem value="30">30 Seconds (Recommended)</MenuItem>
                  <MenuItem value="60">60 Seconds (1 Minute)</MenuItem>
                  <MenuItem value="manual">Manual Refresh Only</MenuItem>
                </Select>
              </FormControl>

              {/* Compact Density Switch */}
              <FormControlLabel
                control={
                  <Switch
                    checked={compactView}
                    onChange={(e) => setCompactView(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
                      Compact Dashboard Density
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Reduces table row padding and metric card height for dense monitoring
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Card>
        </Grid>

        {/* 2. Application & System Info */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                <InfoIcon />
              </Box>
              <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '1rem' }}>
                Application Information
              </Typography>
            </Box>

            <List disablePadding>
              <ListItem sx={{ py: 1, borderBottom: '1px solid #1F2937' }}>
                <ListItemText
                  primary="System Name"
                  secondary="Server Health Monitoring System (SHMS)"
                  primaryTypographyProps={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}
                  secondaryTypographyProps={{ color: '#F8FAFC', fontSize: '0.875rem', fontWeight: 600 }}
                />
              </ListItem>

              <ListItem sx={{ py: 1, borderBottom: '1px solid #1F2937' }}>
                <ListItemText
                  primary="Application Version"
                  secondary="v1.0.0"
                  primaryTypographyProps={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}
                  secondaryTypographyProps={{ color: '#F8FAFC', fontSize: '0.875rem', fontWeight: 600 }}
                />
              </ListItem>

              <ListItem sx={{ py: 1, borderBottom: '1px solid #1F2937' }}>
                <ListItemText
                  primary="Frontend Technology Stack"
                  secondary="React 19, Vite 6, Material UI v5, TanStack Query v5"
                  primaryTypographyProps={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}
                  secondaryTypographyProps={{ color: '#F8FAFC', fontSize: '0.875rem', fontWeight: 600 }}
                />
              </ListItem>

              <ListItem sx={{ py: 1 }}>
                <ListItemText
                  primary="Build Environment Mode"
                  secondary={envMode.toUpperCase()}
                  primaryTypographyProps={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}
                  secondaryTypographyProps={{ color: '#3B82F6', fontSize: '0.875rem', fontWeight: 700 }}
                />
              </ListItem>
            </List>
          </Card>
        </Grid>

        {/* 3. Endpoint Configuration & Service Status Matrix */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                <StorageIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '1rem' }}>
                  Service Endpoint Configuration & Status
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Active environment bindings from .env and connection status display
                </Typography>
              </Box>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderColor: '#1F2937', color: '#64748B', fontSize: '0.75rem', fontWeight: 700 } }}>
                    <TableCell>Service Component</TableCell>
                    <TableCell>Environment Variable</TableCell>
                    <TableCell>Target URL</TableCell>
                    <TableCell>Health Endpoint Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow sx={{ '& td': { borderColor: '#1F2937', py: 1.5 } }}>
                    <TableCell sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.8125rem' }}>
                      Backend API Server
                    </TableCell>
                    <TableCell sx={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      VITE_BACKEND_URL
                    </TableCell>
                    <TableCell sx={{ color: '#3B82F6', fontSize: '0.8125rem' }}>
                      {backendUrl}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<HelpOutlinedIcon sx={{ fontSize: '14px !important', color: '#94A3B8 !important' }} />}
                        label="Unavailable"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          bgcolor: alpha('#94A3B8', 0.12),
                          color: '#94A3B8',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                        }}
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow sx={{ '& td': { borderColor: '#1F2937', py: 1.5 } }}>
                    <TableCell sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.8125rem' }}>
                      ML Analytics Engine
                    </TableCell>
                    <TableCell sx={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      VITE_ML_URL
                    </TableCell>
                    <TableCell sx={{ color: '#3B82F6', fontSize: '0.8125rem' }}>
                      {mlUrl}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<HelpOutlinedIcon sx={{ fontSize: '14px !important', color: '#94A3B8 !important' }} />}
                        label="Unavailable"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          bgcolor: alpha('#94A3B8', 0.12),
                          color: '#94A3B8',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                        }}
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow sx={{ '& td': { borderColor: '#1F2937', py: 1.5 } }}>
                    <TableCell sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.8125rem' }}>
                      Grafana Visualizations
                    </TableCell>
                    <TableCell sx={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      VITE_GRAFANA_URL
                    </TableCell>
                    <TableCell sx={{ color: '#3B82F6', fontSize: '0.8125rem' }}>
                      {grafanaUrl}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<HelpOutlinedIcon sx={{ fontSize: '14px !important', color: '#94A3B8 !important' }} />}
                        label="Unavailable"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          bgcolor: alpha('#94A3B8', 0.12),
                          color: '#94A3B8',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                        }}
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow sx={{ '& td': { borderColor: '#1F2937', py: 1.5 } }}>
                    <TableCell sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.8125rem' }}>
                      Prometheus Metrics Server
                    </TableCell>
                    <TableCell sx={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      —
                    </TableCell>
                    <TableCell sx={{ color: '#64748B', fontSize: '0.8125rem', fontStyle: 'italic' }}>
                      Not Configured
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<HelpOutlinedIcon sx={{ fontSize: '14px !important', color: '#94A3B8 !important' }} />}
                        label="Unavailable"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          bgcolor: alpha('#94A3B8', 0.12),
                          color: '#94A3B8',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
