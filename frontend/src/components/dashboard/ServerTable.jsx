import React from 'react';
import { motion } from 'framer-motion';
import StatusBadge from '../UI/StatusBadge';
import { useDashboard } from '../../context/DashboardContext';

const ServerTable = ({ servers, onEdit, onDelete }) => {
  const { selectedServer, setSelectedServer } = useDashboard();

  const handleServerClick = (hostname) => {
    setSelectedServer(hostname);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="px-4 py-3 text-left font-semibold text-gray-400">Hostname</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-400">IP Address</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-400">OS</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-400">CPU</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-400">RAM</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-400">Disk</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-400">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-400">Uptime</th>
            {(onEdit || onDelete) && <th className="px-4 py-3 text-left font-semibold text-gray-400">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {servers.map((server, idx) => (
            <motion.tr
              key={server.hostname || server.id}
              className={`border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors ${selectedServer?.hostname === server.hostname ? 'bg-cyan-950/40' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleServerClick(server.hostname || server.name)}
            >
              <td className="px-4 py-3 font-medium text-white">{server.hostname || server.name || 'localhost'}</td>
              <td className="px-4 py-3 text-gray-400">{server.ip || server.tailscale_ip || 'No address'}</td>
              <td className="px-4 py-3 text-gray-400">{server.operating_system || '—'}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={server.cpu != null ? { width: `${server.cpu}%` } : undefined}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8">{server.cpu ?? '—'}{server.cpu != null ? '%' : ''}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-yellow-500 h-1.5 rounded-full"
                      style={server.ram != null ? { width: `${server.ram}%` } : undefined}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8">{server.ram ?? '—'}{server.ram != null ? '%' : ''}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-red-500 h-1.5 rounded-full"
                      style={server.disk != null ? { width: `${server.disk}%` } : undefined}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8">{server.disk ?? '—'}{server.disk != null ? '%' : ''}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={server.status} />
              </td>
              <td className="px-4 py-3 text-gray-400">{server.uptime != null ? `${Number(server.uptime).toFixed(1)} h` : 'Unavailable'}</td>
              {(onEdit || onDelete) && <td className="px-4 py-3 space-x-2"><button type="button" className="text-blue-400" onClick={(event) => { event.stopPropagation(); onEdit?.(server); }}>Edit</button><button type="button" className="text-red-400" onClick={(event) => { event.stopPropagation(); onDelete?.(server.id); }}>Delete</button></td>}
            </motion.tr>
          ))}
        </tbody>
      </table>
      {servers.length === 0 && <p className="py-8 text-center text-gray-400">No servers available</p>}
    </div>
  );
};

export default ServerTable;
