import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Server,
  Activity,
  TrendingUp,
  AlertCircle,
  FileText,
  Container,
  BarChart3,
  Settings,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useDashboard();
  const location = useLocation();

  const menuItems = [
    { icon: Server, label: 'Servers', path: '/servers' },
    { icon: Activity, label: 'Live Monitoring', path: '/monitoring' },
    { icon: TrendingUp, label: 'Predictions', path: '/predictions' },
    { icon: AlertCircle, label: 'Alerts', path: '/alerts' },
    { icon: FileText, label: 'Logs', path: '/logs' },
    { icon: Container, label: 'Docker', path: '/docker' },
    { icon: BarChart3, label: 'Grafana', path: '/grafana' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: Activity, label: 'System Health', path: '/system-health' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <motion.div
      className="h-screen border-r border-white/10 bg-black/80 backdrop-blur-xl flex flex-col fixed left-0 top-0 z-50"
      animate={{ width: sidebarOpen ? 256 : 80 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {sidebarOpen && <div><h1 className="text-xl font-bold tracking-tight text-white">SHMS</h1><p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Operations console</p></div>}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-md p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors ${
                active
                  ? 'border-white/15 bg-white/10 text-white shadow-[0_0_24px_rgba(255,255,255,0.05)]'
                  : 'border-transparent text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-100'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        {sidebarOpen && (
          <div className="text-xs text-gray-400">
            <p className="mb-2 font-semibold text-zinc-300">SHMS v3.0.0</p>
            <p className="text-zinc-600">System Health Management</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Sidebar;
