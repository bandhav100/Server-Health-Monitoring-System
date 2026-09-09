import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import ChartCard from '../components/UI/ChartCard';
import api, { unwrap } from '../api';

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [message, setMessage] = useState('');
  useEffect(() => { api.get('/settings').then((response) => setSettings(unwrap(response) || [])).catch(() => setSettings([])); }, []);
  const save = async (setting) => { await api.put('/settings', setting); setMessage('Settings saved'); };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-8 h-8 text-purple-400" />
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm">Configure system preferences and options</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="System Settings" subtitle="Values returned by the backend">
          {message && <p className="text-emerald-400 text-sm mb-3">{message}</p>}
          {settings.length ? settings.map((setting) => <div key={setting.key} className="flex gap-3 items-center border-b border-slate-700 py-3"><label className="text-gray-300 flex-1">{setting.key}<input className="input-field w-full mt-1" defaultValue={setting.value ?? ''} onBlur={(event) => save({ key: setting.key, value: event.target.value, category: setting.category, description: setting.description })} /></label></div>) : <p className="text-gray-400">No settings available</p>}
        </ChartCard>
      </div>

    </motion.div>
  );
};

export default Settings;
