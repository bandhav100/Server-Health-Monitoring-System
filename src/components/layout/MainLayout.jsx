import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Header from '../common/Header';
import Sidebar, { DRAWER_WIDTH, COLLAPSED_DRAWER_WIDTH } from '../common/Sidebar';
import Footer from '../common/Footer';

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDesktopToggle = () => {
    setDesktopOpen((prev) => !prev);
  };

  const handleMobileToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
  };

  const currentDrawerWidth = isMobile
    ? 0
    : desktopOpen
    ? DRAWER_WIDTH
    : COLLAPSED_DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default', overflowX: 'hidden' }}>
      {/* Top Header Navbar */}
      <Header
        sidebarOpen={isMobile ? mobileOpen : desktopOpen}
        onToggleSidebar={isMobile ? handleMobileToggle : handleDesktopToggle}
        drawerWidth={currentDrawerWidth}
      />

      {/* Grafana-style Responsive Collapsible Sidebar */}
      <Sidebar
        desktopOpen={desktopOpen}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
        onDesktopToggle={handleDesktopToggle}
      />

      {/* Main Content View Container */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: { xs: '100%', md: `calc(100% - ${currentDrawerWidth}px)` },
          overflowX: 'hidden',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Box sx={{ minHeight: 64 }} /> {/* Header spacer */}
        <Box sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1, overflowX: 'hidden' }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
}
