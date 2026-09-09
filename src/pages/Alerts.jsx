import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import ChartCard from '../components/UI/ChartCard';
import AlertCard from '../components/UI/AlertCard';
import { useDashboard } from '../context/DashboardContext';
import api, { unwrap } from '../api';

const Alerts = () => {
  const { setNotifications, selectedServer, selectedServerKey } = useDashboard();
  const [alerts, setAlerts] = useState([]);
  useEffect(() => { const params = selectedServerKey === 'ALL' ? {} : { server_id: selectedServer?.id }; if (selectedServerKey !== 'ALL' && !selectedServer?.id) { setAlerts([]); return undefined; } api.get('/alerts', { params }).then((response) => setAlerts(unwrap(response)?.alerts || [])).catch(() => setAlerts([])); return undefined; }, [selectedServer?.id, selectedServerKey]);
  const acknowledge = async (id) => { await api.patch(`/alerts/${id}/acknowledge`); setAlerts((current) => current.map((alert) => alert.id === id ? { ...alert, acknowledged: true } : alert)); setNotifications((current) => current.filter((notification) => notification.alert_id !== id)); };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <div>
          <h1 className="text-3xl font-bold text-white">Alerts</h1>
          <p className="text-gray-400 text-sm">View and manage system alerts</p>
        </div>
      </div>

      <ChartCard title="Active Alerts" subtitle="Critical and warning level alerts">
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id}><AlertCard alert={{ ...alert, type: alert.severity, message: alert.description, server: alert.server_name }} /><button disabled={alert.acknowledged} onClick={() => acknowledge(alert.id)} className="btn-secondary text-xs mt-2">{alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}</button></div>
          ))}
          {alerts.length === 0 && <p className="text-gray-400">No alerts available</p>}
        </div>
      </ChartCard>
    </motion.div>
  );
};

export default Alerts;
