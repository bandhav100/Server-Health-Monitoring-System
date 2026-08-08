import { NavLink } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  Tooltip,
  Typography,
  Avatar,
  IconButton,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { NAVIGATION_ITEMS } from '../../routes/routes.config';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 260;
const COLLAPSED_DRAWER_WIDTH = 68;

export default function Sidebar({
  desktopOpen = true,
  mobileOpen = false,
  onMobileClose = () => {},
  onDesktopToggle = () => {},
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { logout } = useAuth();

  const handleLogoutClick = () => {
    logout();
    if (isMobile) onMobileClose();
  };

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0D131F',
        color: '#94A3B8',
        borderRight: '1px solid #1F2937',
        userSelect: 'none',
      }}
    >
      {/* Sidebar Header / Brand Logo */}
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: desktopOpen || isMobile ? 'space-between' : 'center',
          px: desktopOpen || isMobile ? 2.5 : 1.5,
          borderBottom: '1px solid #1F2937',
        }}
      >
        <Box
          component={NavLink}
          to="/dashboard"
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              boxShadow: '0 0 12px rgba(37, 99, 235, 0.4)',
              flexShrink: 0,
            }}
          >
            <MonitorHeartIcon sx={{ color: '#FFFFFF', fontSize: 24 }} />
          </Box>
          {(desktopOpen || isMobile) && (
            <Box sx={{ ml: 1.5, overflow: 'hidden' }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  lineHeight: 1.2,
                  color: '#F8FAFC',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                }}
              >
                SHMS
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#64748B',
                  fontSize: '0.7rem',
                  display: 'block',
                  whiteSpace: 'nowrap',
                }}
              >
                Server Health Monitor
              </Typography>
            </Box>
          )}
        </Box>

        {!isMobile && (
          <IconButton
            onClick={onDesktopToggle}
            size="small"
            sx={{
              color: '#94A3B8',
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid #1F2937',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                color: '#F8FAFC',
              },
              display: desktopOpen ? 'flex' : 'none',
            }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Navigation Links (Scrollable) */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          py: 1.5,
          px: 1,
          '&::-webkit-scrollbar': {
            width: '5px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#1F2937',
            borderRadius: '4px',
          },
        }}
      >
        <List disablePadding>
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <ListItem key={item.title} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip
                  title={!desktopOpen && !isMobile ? item.title : ''}
                  placement="right"
                  arrow
                >
                  <ListItemButton
                    component={NavLink}
                    to={item.path}
                    onClick={isMobile ? onMobileClose : undefined}
                    sx={{
                      minHeight: 44,
                      borderRadius: 1.5,
                      justifyContent: desktopOpen || isMobile ? 'initial' : 'center',
                      px: desktopOpen || isMobile ? 2 : 1.5,
                      position: 'relative',
                      color: '#94A3B8',
                      transition: 'all 0.2s ease-in-out',
                      '&.active': {
                        backgroundColor: alpha('#3B82F6', 0.15),
                        color: '#3B82F6',
                        fontWeight: 600,
                        boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.2)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: '15%',
                          height: '70%',
                          width: '4px',
                          borderRadius: '0 4px 4px 0',
                          backgroundColor: '#3B82F6',
                          boxShadow: '0 0 8px #3B82F6',
                        },
                        '& .MuiListItemIcon-root': {
                          color: '#3B82F6',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        color: '#F8FAFC',
                        '& .MuiListItemIcon-root': {
                          color: '#F8FAFC',
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: desktopOpen || isMobile ? 1.75 : 'auto',
                        justifyContent: 'center',
                        color: 'inherit',
                        transition: 'color 0.2s ease-in-out',
                      }}
                    >
                      <Icon sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    {(desktopOpen || isMobile) && (
                      <ListItemText
                        primary={item.title}
                        sx={{
                          my: 0,
                          '& .MuiTypography-root': {
                            fontSize: '0.875rem',
                            fontWeight: 'inherit',
                          },
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Collapse Toggle Button (When Collapsed) */}
      {!isMobile && !desktopOpen && (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <IconButton
            onClick={onDesktopToggle}
            size="small"
            sx={{
              color: '#94A3B8',
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid #1F2937',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                color: '#F8FAFC',
              },
            }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Bottom Section: Logged in User & Logout */}
      <Box sx={{ p: 1.5, borderTop: '1px solid #1F2937', bgcolor: '#0B0F19' }}>
        {/* User Card */}
        {(desktopOpen || isMobile) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1,
              mb: 1,
              borderRadius: 1.5,
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: '#2563EB',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: '#FFFFFF',
                mr: 1.25,
              }}
            >
              AU
            </Avatar>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
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
        )}

        {/* Logout Button using NavLink */}
        <Tooltip
          title={!desktopOpen && !isMobile ? 'Logout' : ''}
          placement="right"
          arrow
        >
          <ListItemButton
            component={NavLink}
            to="/login"
            onClick={handleLogoutClick}
            sx={{
              minHeight: 40,
              borderRadius: 1.5,
              justifyContent: desktopOpen || isMobile ? 'initial' : 'center',
              px: desktopOpen || isMobile ? 1.75 : 1.25,
              color: '#EF4444',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: alpha('#EF4444', 0.12),
                color: '#F87171',
                '& .MuiListItemIcon-root': {
                  color: '#F87171',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: desktopOpen || isMobile ? 1.75 : 'auto',
                justifyContent: 'center',
                color: '#EF4444',
              }}
            >
              <LogoutIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            {(desktopOpen || isMobile) && (
              <ListItemText
                primary="Logout"
                sx={{
                  my: 0,
                  '& .MuiTypography-root': {
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  },
                }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer (Temporary overlay) */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              border: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        /* Desktop Collapsible Fixed Drawer */
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: desktopOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
            '& .MuiDrawer-paper': {
              width: desktopOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
              transition: (t) =>
                t.transitions.create('width', {
                  easing: t.transitions.easing.sharp,
                  duration: t.transitions.duration.enteringScreen,
                }),
              overflowX: 'hidden',
              border: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
}
export { DRAWER_WIDTH, COLLAPSED_DRAWER_WIDTH };
