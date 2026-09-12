import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api, { unwrap } from '../api';
import { SERVER_OPTIONS, useServerContext } from './ServerContext';

const DashboardContext = createContext();

// ─── Try to use SettingsContext if available (optional dependency) ────────────
function useOptionalSettings() {
  try {
    // Dynamic import to avoid circular deps — we only need the refresh interval
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useSettings } = require('./SettingsContext');
    return useSettings();
  } catch {
    return { settings: { refresh_interval: '5' } };
  }
}

export const DashboardProvider = ({ children }) => {
  const { selectedServer, selectedInstance, selectedServerKey, setSelectedServer } = useServerContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [servers, setServers] = useState([]);
  const [authReady, setAuthReady] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  // ── Read refresh interval from SettingsContext ───────────────────────────
  // We read directly from localStorage cache to avoid circular context deps
  const getRefreshIntervalMs = useCallback(() => {
    try {
      const cached = localStorage.getItem('shms_settings_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        const val = parseInt(parsed.refresh_interval || '5', 10);
        if (isNaN(val) || val <= 0) return 0; // Off
        return val * 1000;
      }
    } catch { /* ignore */ }
    return 5000; // default 5s
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!localStorage.getItem('token')) {
      setAuthReady(true);
      return undefined;
    }

    const load = () =>
      Promise.all([api.get('/servers'), api.get('/notifications')])
        .then(([serversResponse, notificationsResponse]) => {
          if (cancelled) return;
          const serverData = unwrap(serversResponse) || [];
          const notificationData = unwrap(notificationsResponse) || {};
          setServers(serverData);
          setNotifications(notificationData.notifications || []);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setAuthReady(true);
        });

    load();

    // Use settings-driven refresh interval
    const intervalMs = getRefreshIntervalMs();
    let interval = null;
    if (intervalMs > 0) {
      interval = window.setInterval(load, intervalMs);
    }

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, [refreshTick, getRefreshIntervalMs]);

  const serverOptions = servers.length
    ? servers
        .map((server) => ({
          key: (server.hostname || server.name || server.prometheus_instance || '').toLowerCase(),
          name: server.hostname || server.name || server.prometheus_instance,
          ip: server.ip || server.ip_address || server.tailscale_ip || '',
          instance: server.prometheus_instance,
        }))
        .filter((option) => option.key && option.instance)
    : SERVER_OPTIONS;

  const selectedOption = serverOptions.find((option) => option.key === selectedServerKey);
  const selectedServerRecord =
    selectedServerKey === 'ALL'
      ? null
      : servers.find((server) => server.prometheus_instance === selectedInstance) ||
        servers.find((server) =>
          (server.hostname || server.name || '').toLowerCase().includes(selectedServerKey)
        ) || {
          name: selectedOption?.name,
          hostname: selectedOption?.name,
          ip: selectedOption?.ip,
          prometheus_instance: selectedInstance,
        };

  return (
    <DashboardContext.Provider
      value={{
        selectedServer: selectedServerRecord,
        selectedServerKey,
        serverOptions,
        selectedInstance,
        dashboardData: { servers },
        servers,
        setServers,
        refreshServers: () => setRefreshTick((value) => value + 1),
        authReady,
        setSelectedServer,
        setSelectedServerId: (serverId) => {
          const server = servers.find((item) => item.id === serverId);
          const option = serverOptions.find((item) => item.instance === server?.prometheus_instance);
          if (option) setSelectedServer(option.key);
        },
        sidebarOpen,
        setSidebarOpen,
        notifications,
        setNotifications,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
};
