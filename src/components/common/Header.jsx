import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  InputBase,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Tooltip,
  Divider,
  Chip,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  ClickAwayListener,
  alpha,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import ErrorIcon from '@mui/icons-material/Error';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HeaderBreadcrumbs from './HeaderBreadcrumbs';
import { useColorMode } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useAlertsData } from '../../hooks/useAlertsData';
import { useServersData } from '../../hooks/useServersData';

const METRICS_INDEX = [
  { name: 'CPU Utilization Trend', category: 'Metrics', path: '/metrics' },
  { name: 'Memory Usage Log', category: 'Metrics', path: '/metrics' },
  { name: 'Disk I/O & Storage Distribution', category: 'Metrics', path: '/metrics' },
  { name: 'Network Inbound/Outbound Throughput', category: 'Metrics', path: '/metrics' },
];

export default function Header({ sidebarOpen, onToggleSidebar, drawerWidth = 260 }) {
  const navigate = useNavigate();
  const { mode, toggleColorMode } = useColorMode();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Profile Menu State
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const isProfileMenuOpen = Boolean(profileAnchorEl);

  // Notification Popover State
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const isNotifOpen = Boolean(notifAnchorEl);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Queries for real backend data
  const { data: alertsData } = useAlertsData('unresolved');
  const { data: allAlertsData } = useAlertsData('all');
  const { data: serversData } = useServersData();

  // Extract arrays safely
  const activeAlerts = Array.isArray(alertsData)
    ? alertsData
    : Array.isArray(alertsData?.alerts)
    ? alertsData.alerts
    : Array.isArray(alertsData?.content)
    ? alertsData.content
    : [];

  const allAlerts = Array.isArray(allAlertsData)
    ? allAlertsData
    : Array.isArray(allAlertsData?.alerts)
    ? allAlertsData.alerts
    : [];

  const serversList = Array.isArray(serversData)
    ? serversData
    : Array.isArray(serversData?.servers)
    ? serversData.servers
    : [];

  const unreadCount = activeAlerts.length;

  // Filter Search Results dynamically across real servers, alerts, and metrics
  const trimmedQuery = searchQuery.trim().toLowerCase();

  const matchingServers = trimmedQuery
    ? serversList.filter((s) => {
        const name = (s.name || s.hostname || s.id || '').toLowerCase();
        const ip = (s.ipAddress || s.ip || '').toLowerCase();
        return name.includes(trimmedQuery) || ip.includes(trimmedQuery);
      })
    : [];

  const matchingAlerts = trimmedQuery
    ? allAlerts.filter((a) => {
        const msg = (a.message || a.description || a.title || '').toLowerCase();
        const server = (a.serverName || a.serverId || '').toLowerCase();
        const sev = (a.severity || '').toLowerCase();
        return msg.includes(trimmedQuery) || server.includes(trimmedQuery) || sev.includes(trimmedQuery);
      })
    : [];

  const matchingMetrics = trimmedQuery
    ? METRICS_INDEX.filter((m) => m.name.toLowerCase().includes(trimmedQuery))
    : [];

  const hasSearchResults =
    matchingServers.length > 0 || matchingAlerts.length > 0 || matchingMetrics.length > 0;

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
        ml: { xs: 0, md: `${drawerWidth}px` },
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: (theme) =>
          mode === 'dark' ? '#0B0F19' : theme.palette.background.paper,
        color: (theme) => theme.palette.text.primary,
        boxShadow: 'none',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        transition: (theme) =>
          theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}>
        {/* Toggle Mobile/Desktop Sidebar */}
        <IconButton
          color="inherit"
          aria-label="toggle drawer"
          onClick={onToggleSidebar}
          edge="start"
          sx={{ mr: 2, color: '#94A3B8' }}
        >
          {sidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>

        {/* Application Title & Breadcrumbs Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MonitorHeartIcon
              sx={{
                color: '#3B82F6',
                mr: 1,
                fontSize: 26,
              }}
            />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                letterSpacing: '-0.01em',
                background: (theme) =>
                  mode === 'dark'
                    ? 'linear-gradient(90deg, #60A5FA 0%, #3B82F6 100%)'
                    : 'linear-gradient(90deg, #1E40AF 0%, #3B82F6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Server Health Monitoring System
            </Typography>
          </Box>

          <Divider
            orientation="vertical"
            flexItem
            sx={{
              display: { xs: 'none', md: 'block' },
              borderColor: 'rgba(255, 255, 255, 0.1)',
              my: 1.5,
            }}
          />

          {/* Dynamic Breadcrumbs */}
          <HeaderBreadcrumbs />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Global Search Component */}
        <ClickAwayListener onClickAway={() => setIsSearchFocused(false)}>
          <Box
            sx={{
              position: 'relative',
              mr: 2,
              width: '100%',
              maxWidth: 320,
              display: { xs: 'none', lg: 'block' },
            }}
          >
            <Box
              sx={{
                borderRadius: 2,
                backgroundColor: (theme) =>
                  mode === 'dark'
                    ? alpha(theme.palette.common.white, 0.04)
                    : alpha(theme.palette.common.black, 0.04),
                '&:hover': {
                  backgroundColor: (theme) =>
                    mode === 'dark'
                      ? alpha(theme.palette.common.white, 0.07)
                      : alpha(theme.palette.common.black, 0.07),
                },
                display: 'flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.5,
                border: '1px solid',
                borderColor: isSearchFocused ? '#3B82F6' : mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'divider',
              }}
            >
              <SearchIcon sx={{ color: '#94A3B8', mr: 1, fontSize: 18 }} />
              <InputBase
                placeholder="Search servers, metrics, alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                sx={{
                  color: 'inherit',
                  width: '100%',
                  fontSize: '0.8125rem',
                }}
                inputProps={{ 'aria-label': 'global search' }}
              />
            </Box>

            {/* Global Search Results Dropdown */}
            {isSearchFocused && trimmedQuery && (
              <Paper
                elevation={8}
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  mt: 1,
                  bgcolor: '#0D131F',
                  border: '1px solid #1F2937',
                  borderRadius: 2,
                  maxHeight: 360,
                  overflowY: 'auto',
                  zIndex: 1300,
                  p: 1,
                }}
              >
                {!hasSearchResults ? (
                  <Box sx={{ p: 2, textAlign: 'center', color: '#64748B', fontSize: '0.8125rem' }}>
                    No matching servers, alerts, or metrics found for "{searchQuery}"
                  </Box>
                ) : (
                  <Box>
                    {/* Matching Servers */}
                    {matchingServers.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" sx={{ px: 1, color: '#3B82F6', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                          Servers ({matchingServers.length})
                        </Typography>
                        {matchingServers.slice(0, 3).map((srv) => (
                          <MenuItem
                            key={srv.id || srv.name}
                            onClick={() => {
                              setIsSearchFocused(false);
                              setSearchQuery('');
                              navigate(srv.id ? `/servers/${srv.id}` : '/servers');
                            }}
                            sx={{ borderRadius: 1, py: 0.75, px: 1, my: 0.25 }}
                          >
                            <StorageIcon sx={{ mr: 1, fontSize: 16, color: '#3B82F6' }} />
                            <Box>
                              <Typography variant="body2" sx={{ color: '#F8FAFC', fontSize: '0.8125rem', fontWeight: 600 }}>
                                {srv.name || srv.hostname || srv.id}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                                {srv.ipAddress || srv.ip || 'Unavailable'}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Box>
                    )}

                    {/* Matching Alerts */}
                    {matchingAlerts.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" sx={{ px: 1, color: '#EF4444', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                          Alerts ({matchingAlerts.length})
                        </Typography>
                        {matchingAlerts.slice(0, 3).map((alt) => (
                          <MenuItem
                            key={alt.id}
                            onClick={() => {
                              setIsSearchFocused(false);
                              setSearchQuery('');
                              navigate('/alerts');
                            }}
                            sx={{ borderRadius: 1, py: 0.75, px: 1, my: 0.25 }}
                          >
                            <ErrorIcon sx={{ mr: 1, fontSize: 16, color: '#EF4444' }} />
                            <Box sx={{ overflow: 'hidden' }}>
                              <Typography variant="body2" noWrap sx={{ color: '#F8FAFC', fontSize: '0.8125rem', fontWeight: 600 }}>
                                {alt.message || alt.description || 'Alert Incident'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                                Node: {alt.serverName || alt.serverId || 'Unavailable'}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Box>
                    )}

                    {/* Matching Metrics */}
                    {matchingMetrics.length > 0 && (
                      <Box>
                        <Typography variant="caption" sx={{ px: 1, color: '#10B981', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                          Metrics Analytics
                        </Typography>
                        {matchingMetrics.map((met) => (
                          <MenuItem
                            key={met.name}
                            onClick={() => {
                              setIsSearchFocused(false);
                              setSearchQuery('');
                              navigate('/metrics');
                            }}
                            sx={{ borderRadius: 1, py: 0.75, px: 1, my: 0.25 }}
                          >
                            <AssessmentIcon sx={{ mr: 1, fontSize: 16, color: '#10B981' }} />
                            <Typography variant="body2" sx={{ color: '#F8FAFC', fontSize: '0.8125rem' }}>
                              {met.name}
                            </Typography>
                          </MenuItem>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        </ClickAwayListener>

        {/* Right Action Icons & Profile Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Dark / Light Mode Toggle */}
          <Tooltip title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} Mode`}>
            <IconButton onClick={toggleColorMode} color="inherit" size="small" sx={{ p: 1 }}>
              {mode === 'dark' ? (
                <Brightness7Icon sx={{ color: '#FBBF24', fontSize: 20 }} />
              ) : (
                <Brightness4Icon sx={{ color: '#64748B', fontSize: 20 }} />
              )}
            </IconButton>
          </Tooltip>

          {/* System Notification Bell & Popover */}
          <Tooltip title="System Notifications">
            <IconButton
              color="inherit"
              onClick={(e) => setNotifAnchorEl(e.currentTarget)}
              size="small"
              sx={{ p: 1 }}
            >
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon sx={{ color: unreadCount > 0 ? '#F8FAFC' : '#94A3B8', fontSize: 20 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Notifications Popover Menu */}
          <Popover
            open={isNotifOpen}
            anchorEl={notifAnchorEl}
            onClose={() => setNotifAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                width: 320,
                bgcolor: '#0D131F',
                border: '1px solid #1F2937',
                borderRadius: 2.5,
                p: 2,
                mt: 1,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.9rem' }}>
                Active Alerts ({unreadCount})
              </Typography>
              <Chip
                label={`${unreadCount} Unresolved`}
                size="small"
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}
              />
            </Box>

            <Divider sx={{ borderColor: '#1F2937', mb: 1.5 }} />

            {activeAlerts.length > 0 ? (
              <List disablePadding sx={{ maxHeight: 260, overflowY: 'auto' }}>
                {activeAlerts.slice(0, 4).map((alert, idx) => (
                  <ListItem
                    key={alert.id || idx}
                    button
                    onClick={() => {
                      setNotifAnchorEl(null);
                      navigate('/alerts');
                    }}
                    sx={{
                      borderRadius: 1.5,
                      mb: 1,
                      bgcolor: '#111827',
                      border: '1px solid #1F2937',
                      '&:hover': { borderColor: '#3B82F6' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: '#EF4444' }}>
                      <ErrorIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={alert.message || alert.description || 'System Incident Alert'}
                      secondary={`Server: ${alert.serverName || alert.serverId || 'Unavailable'}`}
                      primaryTypographyProps={{ color: '#F8FAFC', fontSize: '0.8125rem', fontWeight: 600 }}
                      secondaryTypographyProps={{ color: '#64748B', fontSize: '0.7rem' }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" sx={{ color: '#64748B', py: 2, textAlign: 'center', fontSize: '0.8125rem' }}>
                No active unresolved alerts at this time.
              </Typography>
            )}

            <Divider sx={{ borderColor: '#1F2937', my: 1 }} />

            <Box sx={{ textAlign: 'center', pt: 0.5 }}>
              <Typography
                variant="caption"
                onClick={() => {
                  setNotifAnchorEl(null);
                  navigate('/alerts');
                }}
                sx={{
                  color: '#3B82F6',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                View All System Alerts →
              </Typography>
            </Box>
          </Popover>

          <Divider
            orientation="vertical"
            flexItem
            sx={{
              mx: 0.5,
              my: 1.5,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />

          {/* User Profile Info & Avatar */}
          <Box
            onClick={(e) => setProfileAnchorEl(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              p: 0.5,
              borderRadius: 2,
              transition: 'background-color 0.2s',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
              },
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: '#2563EB',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#FFFFFF',
                mr: { xs: 0, sm: 1.25 },
              }}
            >
              AU
            </Avatar>

            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  color: '#F8FAFC',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                Admin User
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  color: '#64748B',
                  fontSize: '0.7rem',
                  display: 'block',
                }}
              >
                System Administrator
              </Typography>
            </Box>
          </Box>

          {/* Profile Menu */}
          <Menu
            anchorEl={profileAnchorEl}
            open={isProfileMenuOpen}
            onClose={() => setProfileAnchorEl(null)}
            onClick={() => setProfileAnchorEl(null)}
            PaperProps={{
              elevation: 4,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.5))',
                mt: 1.5,
                minWidth: 220,
                bgcolor: '#0D131F',
                color: '#F8FAFC',
                border: '1px solid #1F2937',
                borderRadius: 2,
                p: 0.5,
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1.5, mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
                Admin User
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                admin@shms.enterprise.io
              </Typography>
              <Chip
                label="System Administrator"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  bgcolor: alpha('#3B82F6', 0.15),
                  color: '#3B82F6',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              />
            </Box>

            <Divider sx={{ borderColor: '#1F2937', my: 0.5 }} />

            <MenuItem onClick={() => navigate('/profile')} sx={{ borderRadius: 1, fontSize: '0.875rem', color: '#94A3B8' }}>
              <AccountCircleIcon sx={{ mr: 1.5, fontSize: 18, color: '#3B82F6' }} />
              Profile Settings
            </MenuItem>

            <MenuItem onClick={() => navigate('/settings')} sx={{ borderRadius: 1, fontSize: '0.875rem', color: '#94A3B8' }}>
              <SettingsIcon sx={{ mr: 1.5, fontSize: 18, color: '#94A3B8' }} />
              System Preferences
            </MenuItem>

            <Divider sx={{ borderColor: '#1F2937', my: 0.5 }} />

            <MenuItem onClick={handleLogout} sx={{ borderRadius: 1, fontSize: '0.875rem', color: '#EF4444' }}>
              <LogoutIcon sx={{ mr: 1.5, fontSize: 18, color: '#EF4444' }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
