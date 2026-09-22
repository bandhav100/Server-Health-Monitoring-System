import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useServerContext } from '../../context/ServerContext';

const ServerDropdown = ({ servers = [], query = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { selectedServerKey, serverOptions } = useDashboard();
  const { setSelectedServer } = useServerContext();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="server-dropdown-btn flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-1.5 rounded-full bg-[#182234] border border-cyan-500/30 hover:bg-[#1f2b42] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
        aria-label="Select server"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] flex-shrink-0" />
        <span className="truncate max-w-[85px] sm:max-w-[150px] font-medium text-xs">
          {selectedServerKey === 'ALL' ? 'All Servers' : serverOptions.find((option) => option.key === selectedServerKey)?.name || 'All Servers'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="server-dropdown-menu absolute top-full left-0 mt-2 w-64 max-w-[calc(100vw-24px)] bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {filteredServers.length > 0 ? (
              <>
                <button onClick={() => handleSelect('ALL')} className="server-dropdown-item w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-cyan-300 transition-colors cursor-pointer">
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
                  className="server-dropdown-item w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-gray-200 transition-colors cursor-pointer"
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
