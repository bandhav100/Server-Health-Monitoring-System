import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { DashboardProvider } from './context/DashboardContext';
import { ServerProvider } from './context/ServerContext';
import Layout from './components/Layout/Layout';
import Servers from './pages/Servers';
import LiveMonitoring from './pages/LiveMonitoring';
import Predictions from './pages/Predictions';
import Alerts from './pages/Alerts';
import Logs from './pages/Logs';
import DockerPage from './pages/Docker';
import GrafanaPage from './pages/GrafanaPage';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import SystemHealth from './pages/SystemHealth';
import Login from './pages/Login';

function ProtectedApp() {
  if (!localStorage.getItem('token')) return <Login />;
  return (
    <DashboardProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/servers" replace />} />
          <Route path="/servers" element={<Servers />} />
          <Route path="/monitoring" element={<LiveMonitoring />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/docker" element={<DockerPage />} />
          <Route path="/grafana" element={<GrafanaPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/system-health" element={<SystemHealth />} />
        </Routes>
      </Layout>
    </DashboardProvider>
  );
}

function App() {
  return (
    <Router>
      <ServerProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<ProtectedApp />} />
        </Routes>
      </ServerProvider>
    </Router>
  );
}

export default App;
