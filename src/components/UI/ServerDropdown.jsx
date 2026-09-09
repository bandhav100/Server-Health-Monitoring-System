import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useServerContext } from '../../context/ServerContext';

const ServerDropdown = ({ servers = [], query = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedServerKey, serverOptions } = useDashboard();
  const { setSelectedServer } = useServerContext();

  const liveServers = serverOptions.map((option) => ({
    ...option,
    live: servers.find((server) => server.prometheus_instance === option.instance || (server.ip || server.tailscale_ip) === option.ip),
  }));
  const filteredServers = liveServers.filter((server) => {
    const normalizedQuery = query.trim().toLowerCase();
    const serverAddress = server.ip || server.tailscale_ip || '';
    if (!normalizedQuery) return true;

    return (
      server.name.toLowerCase().includes(normalizedQuery) || serverAddress.includes(normalizedQuery)
    );
  });

  const handleSelect = (key) => {
    setSelectedServer(key);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-400" />
        <span className="truncate max-w-[150px]">{selectedServerKey === 'ALL' ? 'All Servers' : serverOptions.find((option) => option.key === selectedServerKey)?.name || 'All Servers'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {filteredServers.length > 0 ? (
              <>
                <button onClick={() => handleSelect('ALL')} className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-cyan-300 transition-colors">
                  <span className="inline-block w-2 h-2 rounded-full mr-2 bg-cyan-400" />
                  <span className="font-medium">All Servers</span>
                </button>
                {filteredServers.map((server) => {
                const status = server.live?.status;
                const dot = status === 'healthy' || server.live?.up === 1 ? 'bg-emerald-400' : status === 'down' || status === 'critical' ? 'bg-red-400' : 'bg-gray-500';
                return (
                <button
                  key={server.key}
                  onClick={() => handleSelect(server.key)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-gray-200 transition-colors"
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${dot}`} />
                  <span className="font-medium">{server.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{server.ip}</span>
                </button>
                ); })}
              </>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-400">No servers match your search.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerDropdown;
