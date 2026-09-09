import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, User, Settings } from 'lucide-react';
import ServerDropdown from '../UI/ServerDropdown';
import { useDashboard } from '../../context/DashboardContext';
import api from '../../api';

const Navbar = () => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, setNotifications, dashboardData } = useDashboard();
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const markRead = async (id) => { await api.patch(`/notifications/${id}/read`); setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, is_read: true } : notification)); };
  const markAllRead = async () => { await api.patch('/notifications/read-all'); setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true }))); };
  const logout = async () => { try { await api.post('/auth/logout'); } finally { localStorage.clear(); window.location.href = '/login'; } };

  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
        <div className="flex-1 flex items-center gap-4">
          <div className="hidden lg:block">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 font-semibold">SHMS / Control Room</p>
            <p className="text-xs text-zinc-600">Infrastructure telemetry</p>
          </div>
          <div className="relative min-w-[180px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search servers..."
              className="input-field w-full pl-10"
            />
          </div>
          <ServerDropdown servers={dashboardData.servers} query={searchQuery} />
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative rounded-md p-2 hover:bg-white/10">
            <Bell className="w-5 h-5 text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
          {showNotifications && <div className="absolute right-24 top-16 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-3 z-50"><div className="flex justify-between mb-2"><span className="text-white font-semibold">Notifications</span>{unreadCount > 0 && <span className="text-xs text-gray-400">{unreadCount} unread</span>}</div>{notifications.length ? notifications.map((notification) => <button key={notification.id} onClick={() => markRead(notification.id)} className={`block w-full text-left p-2 border-b border-slate-700 text-sm ${notification.is_read ? 'text-gray-500' : 'text-gray-200'}`}>{notification.title || notification.message || 'Notification'}</button>) : <p className="text-sm text-gray-400">No notifications</p>}</div>}
          {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-gray-400 hover:text-white">Mark all read</button>}

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-black hover:bg-zinc-200"
            >
              <User className="w-5 h-5" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                <button onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-gray-300 flex items-center gap-2 border-b border-slate-700">
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button onClick={() => { setShowProfileMenu(false); navigate('/settings'); }} className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-gray-300 flex items-center gap-2 border-b border-slate-700">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button onClick={logout} className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-red-400 flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
