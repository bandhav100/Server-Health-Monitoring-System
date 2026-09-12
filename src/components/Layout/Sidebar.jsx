import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Server,
  Activity,
  TrendingUp,
  AlertCircle,
  FileText,
  Container,
  BarChart3,
  BookOpen,
  FileBarChart,
  Settings,
  ChevronLeft,
  Menu,
  HeartPulse,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useSettings } from '../../context/SettingsContext';
import { motion } from 'framer-motion';

const menuItems = [
  { icon: Server, label: 'Servers', path: '/servers' },
  { icon: Activity, label: 'Live Monitoring', path: '/monitoring' },
  { icon: TrendingUp, label: 'Predictions', path: '/predictions' },
  { icon: AlertCircle, label: 'Alerts', path: '/alerts' },
  { icon: FileText, label: 'Logs', path: '/logs' },
  { icon: Container, label: 'Docker', path: '/docker' },
  { icon: BarChart3, label: 'Grafana', path: '/grafana' },
  { icon: BookOpen, label: 'Setup Guide', path: '/setup-guide' },
  { icon: FileBarChart, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: HeartPulse, label: 'System Health', path: '/system-health' },
];

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useDashboard();
  const { settings } = useSettings();
  const location = useLocation();

  // Sync sidebar open state with the saved settings.sidebar_layout preference.
  // Only on first mount so the user can still toggle manually mid-session.
  useEffect(() => {
    if (settings.sidebar_layout) {
      setSidebarOpen(settings.sidebar_layout === 'expanded');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.sidebar_layout]);

  const isActive = (path) => location.pathname === path;

  return (
    <motion.div
      className="sidebar-shell h-screen border-r border-white/10 bg-black/80 backdrop-blur-xl flex flex-col fixed left-0 top-0 z-50"
      animate={{ width: sidebarOpen ? 256 : 80 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {sidebarOpen ? (
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2.5">
              <img src="/logo-icon.png" alt="SHMS Logo" className="h-6 w-auto object-contain shrink-0" />
              <h1 className="text-xl font-bold tracking-wider text-white leading-none">SHMS</h1>
            </div>

            {/* Seamless Infinite Marquee */}
            <div
              className="sidebar-marquee-container"
              role="region"
              aria-label="Server Health Monitoring System"
            >
              <div className="sidebar-marquee-track">
                <div className="sidebar-marquee-group">
                  <span className="sidebar-marquee-item">Server Health Monitoring System</span>
                  <span className="sidebar-marquee-sep">→</span>
                  <span className="sidebar-marquee-item">Server Health Monitoring System</span>
                  <span className="sidebar-marquee-sep">→</span>
                </div>
                <div className="sidebar-marquee-group" aria-hidden="true">
                  <span className="sidebar-marquee-item">Server Health Monitoring System</span>
                  <span className="sidebar-marquee-sep">→</span>
                  <span className="sidebar-marquee-item">Server Health Monitoring System</span>
                  <span className="sidebar-marquee-sep">→</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 leading-none">Operations console</p>
          </div>
        ) : (
          <img src="/logo-icon.png" alt="SHMS Logo" className="h-6 w-auto object-contain" />
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-md p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <div key={item.path} className="relative group">
              <Link
                to={item.path}
                data-active={active ? 'true' : 'false'}
                className={`sidebar-nav-link ${active ? 'sidebar-nav-link-active' : ''}`}
              >
                {active && <span className="sidebar-nav-indicator" aria-hidden="true" />}
                <Icon className="sidebar-nav-icon w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="sidebar-nav-label text-sm font-medium flex-1 truncate">{item.label}</span>}
              </Link>

              {/* Tooltip when collapsed */}
              {!sidebarOpen && (
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <div className="bg-slate-900 border border-slate-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-700" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        {sidebarOpen ? (
          <div className="text-xs text-gray-400">
            <p className="mb-2 font-semibold text-zinc-300">SHMS v2.0.0</p>
            <p className="text-zinc-600">System Health Monitoring</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System online" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Sidebar;
