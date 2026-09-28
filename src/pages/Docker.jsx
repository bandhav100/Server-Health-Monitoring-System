import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Container } from 'lucide-react';
import ChartCard from '../components/UI/ChartCard';
import api, { unwrap } from '../api';
import { useDashboard } from '../context/DashboardContext';

const DockerPage = () => {
  const [containers, setContainers] = useState([]);
  const [unavailable, setUnavailable] = useState(false);
  const { selectedServer } = useDashboard();
  const load = () => api.get('/docker/containers', { params: { server_id: selectedServer?.id } }).then((response) => {
    const data = unwrap(response) || [];
    setContainers(data);
    setUnavailable(false);
  }).catch(() => {
    setContainers([]);
    setUnavailable(true);
  });
  useEffect(() => { if (selectedServer?.id) load(); }, [selectedServer?.id]);
  const action = async (verb, id) => { await api.post(`/docker/${verb}/${id}`); load(); };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Container className="w-8 h-8 text-blue-400" />
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Docker</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Container management and monitoring</p>
        </div>
      </div>

      <ChartCard title="Running Containers" subtitle={selectedServer?.name || 'Select a discovered server'}>
        {unavailable ? <p className="text-yellow-400">Docker metrics unavailable on this server.</p> : containers.length === 0 ? <p className="text-gray-400">No containers available</p> : null}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Container Name</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Image</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Status</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>CPU</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Memory</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Uptime</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((container) => (
                <tr key={container.id} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border-subtle)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{container.name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{container.image}</td>
                  <td className="px-4 py-3">
                    <span className="badge badge-success">{container.status}</span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{container.cpu}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{container.memory}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{container.uptime}</td>
                  <td className="px-4 py-3 space-x-2"><button className="text-emerald-400 cursor-pointer" onClick={() => action('start', container.id)}>Start</button><button className="text-yellow-400 cursor-pointer" onClick={() => action('restart', container.id)}>Restart</button><button className="text-red-400 cursor-pointer" onClick={() => action('stop', container.id)}>Stop</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </motion.div>
  );
};

export default DockerPage;
