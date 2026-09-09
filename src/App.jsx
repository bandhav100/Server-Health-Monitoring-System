import React from 'react';
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

function App() {
  return (
    <Router>
      <ServerProvider>
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
          </Routes>
          </Layout>
        </DashboardProvider>
      </ServerProvider>
    </Router>
  );
}

export default App;
