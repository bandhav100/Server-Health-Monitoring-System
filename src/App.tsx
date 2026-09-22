import { BrowserRouter as Router, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { DashboardProvider } from './context/DashboardContext';
import { ServerProvider } from './context/ServerContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import Layout from './components/Layout/Layout';
import Servers from './pages/Servers';
import LiveMonitoring from './pages/LiveMonitoring';
import Predictions from './pages/Predictions';
import Alerts from './pages/Alerts';
import Logs from './pages/Logs';
import DockerPage from './pages/Docker';
import Grafana from './pages/Grafana';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import SystemHealth from './pages/SystemHealth';
import Login from './pages/Login';

// Tracks the last visited route for "Remember Last Page" setting
function LastPageTracker() {
  const location = useLocation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { settings } = useSettings() as any;

  useEffect(() => {
    if (settings?.remember_last_page === 'true') {
      if (location.pathname !== '/login' && location.pathname !== '/settings') {
        localStorage.setItem('shms_last_page', location.pathname);
      }
    }
  }, [location.pathname, settings?.remember_last_page]);

  return null;
}

// Determines the initial redirect target
function RootRedirect() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { settings, settingsLoaded } = useSettings() as any;

  if (!settingsLoaded) return null;

  if (settings?.remember_last_page === 'true') {
    const lastPage = localStorage.getItem('shms_last_page');
    if (lastPage && lastPage !== '/') return <Navigate to={lastPage} replace />;
  }

  const defaultPage = settings?.default_page || '/servers';
  return <Navigate to={defaultPage} replace />;
}

function ProtectedApp() {
  return (
    <SettingsProvider>
      <DashboardProvider>
        <Layout>
          <LastPageTracker />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/dashboard" element={<Navigate to="/monitoring" replace />} />
            <Route path="/servers" element={<Servers />} />
            <Route path="/monitoring" element={<LiveMonitoring />} />
            <Route path="/live" element={<Navigate to="/monitoring" replace />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/docker" element={<DockerPage />} />
            <Route path="/grafana" element={<Grafana />} />
            <Route path="/setup-guide" element={<Navigate to="/servers" replace />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/system-health" element={<SystemHealth />} />
            <Route path="*" element={<Navigate to="/servers" replace />} />
          </Routes>
        </Layout>
      </DashboardProvider>
    </SettingsProvider>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ServerProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <ProtectedApp />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ServerProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
