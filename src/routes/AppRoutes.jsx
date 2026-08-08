import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import { ROUTES } from './routes.config';

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const ServersPage = lazy(() => import('../pages/servers/ServersPage'));
const ServerDetailPage = lazy(() => import('../pages/servers/ServerDetailPage'));
const AlertsPage = lazy(() => import('../pages/alerts/AlertsPage'));
const AlertDetailPage = lazy(() => import('../pages/alerts/AlertDetailPage'));
const MetricsPage = lazy(() => import('../pages/metrics/MetricsPage'));
const PredictionsPage = lazy(() => import('../pages/predictions/PredictionsPage'));
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'));
const GrafanaPage = lazy(() => import('../pages/grafana/GrafanaPage'));
const EmailPage = lazy(() => import('../pages/email/EmailPage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
    }}
  >
    <CircularProgress size={32} />
  </Box>
);

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Default Root Redirect to /dashboard */}
          <Route path="/" element={<Navigate to={ROUTES.PROTECTED.DASHBOARD} replace />} />

          {/* Public Auth Routes using AuthLayout */}
          <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />}>
              <Route path={ROUTES.PUBLIC.LOGIN} element={<LoginPage />} />
            </Route>
          </Route>

          {/* Protected Routes using MainLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path={ROUTES.PROTECTED.DASHBOARD} element={<DashboardPage />} />
              <Route path={ROUTES.PROTECTED.SERVERS} element={<ServersPage />} />
              <Route path={ROUTES.PROTECTED.SERVER_DETAIL} element={<ServerDetailPage />} />
              <Route path={ROUTES.PROTECTED.ALERTS} element={<AlertsPage />} />
              <Route path={ROUTES.PROTECTED.ALERT_DETAIL} element={<AlertDetailPage />} />
              <Route path={ROUTES.PROTECTED.METRICS} element={<MetricsPage />} />
              <Route path={ROUTES.PROTECTED.PREDICTIONS} element={<PredictionsPage />} />
              <Route path={ROUTES.PROTECTED.REPORTS} element={<ReportsPage />} />
              <Route path={ROUTES.PROTECTED.GRAFANA} element={<GrafanaPage />} />
              <Route path={ROUTES.PROTECTED.EMAIL} element={<EmailPage />} />
              <Route path={ROUTES.PROTECTED.SETTINGS} element={<SettingsPage />} />
              <Route path={ROUTES.PROTECTED.PROFILE} element={<ProfilePage />} />
            </Route>
          </Route>

          {/* 404 Fallback Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
