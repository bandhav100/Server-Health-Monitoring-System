import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, Settings, AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import ServerDropdown from '../ui/ServerDropdown';
import HeaderClock from './HeaderClock';
import { useDashboard } from '../../context/DashboardContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../api';

const severityIcon = {
  critical: <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />,
  warning:  <AlertTriangle size={13} className="text-yellow-400 flex-shrink-0 mt-0.5" />,
  info:     <Info size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />,
};

const Navbar = () => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);
  const { notifications, setNotifications, dashboardData } = useDashboard();
  const { isEnabled, formatTimestamp, settings, resolvedTheme, toggleTheme } = useSettings();

  const showBadge = isEnabled('show_unread_badge');
  const notificationsEnabled = isEnabled('notifications_enabled');
  const showPreview = isEnabled('notification_preview');

  // Count unread alerts regardless of notification popup mute state
  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.is_read).length
    : 0;

  // ── Audio: play sound for new unread notifications ──────────────────────
  const prevUnreadRef = useRef(unreadCount);
  const playNotificationSound = useCallback(() => {
    try {
      // Create a brief beep using Web Audio API
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch { /* ignore if audio not available */ }
  }, []);

  useEffect(() => {
    const currentUnread = notificationsEnabled ? notifications.filter((n) => !n.is_read).length : 0;
    const prev = prevUnreadRef.current;
    // Play sound only when count INCREASES (genuinely new notification arrived)
    if (currentUnread > prev && isEnabled('notification_sound')) {
      playNotificationSound();
    }
    prevUnreadRef.current = currentUnread;
  }, [notifications, notificationsEnabled, isEnabled, playNotificationSound]);

  // ── Desktop notifications for new items ──────────────────────────────────
  const lastSeenCountRef = useRef(notifications.length);
  useEffect(() => {
    if (!isEnabled('desktop_notifications') || !notificationsEnabled) return;
    if (Notification.permission !== 'granted') return;

    const newOnes = notifications.slice(0, notifications.length - lastSeenCountRef.current);
    newOnes.forEach((n) => {
      if (!n.is_read) {
        new Notification(n.title || 'SHMS Alert', {
          body: showPreview ? n.message : '',
          icon: '/favicon.ico',
        });
      }
    });
    lastSeenCountRef.current = notifications.length;
  }, [notifications, isEnabled, notificationsEnabled, showPreview]);

  // ── Close dropdowns on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((current) =>
        current.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((current) => current.map((n) => ({ ...n, is_read: true })));
    } catch { /* silent */ }
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } finally {
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <div className="navbar-shell sticky top-0 z-40 border-b border-slate-800/80 bg-[#13151D] text-white">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
        {/* Left: branding + server selector */}
        <div className="flex-1 flex items-center gap-4">
          <div className="hidden lg:block">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-semibold leading-none">SHMS / Control Room</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Infrastructure telemetry</p>
          </div>
          <ServerDropdown servers={dashboardData.servers} query="" />
        </div>

        {/* Right: clock + theme toggle + notification bell + profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Current Time */}
          <HeaderClock />

          {/* Vertical divider */}
          <div className="navbar-divider h-6 w-px hidden sm:block" />

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border shadow-sm cursor-pointer"
            aria-label={`Current theme: ${resolvedTheme === 'dark' ? 'Dark' : 'Light'}. Click to switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
            title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {resolvedTheme === 'dark' ? (
              <>
                <span className="text-xs leading-none" role="img" aria-label="Moon">🌙</span>
                <span className="text-[11px] font-medium tracking-wide">Dark</span>
              </>
            ) : (
              <>
                <span className="text-xs leading-none text-amber-500" role="img" aria-label="Sun">☀</span>
                <span className="text-[11px] font-medium tracking-wide">Light</span>
              </>
            )}
          </button>

          {/* Vertical divider */}
          <div className="navbar-divider h-6 w-px hidden sm:block" />

          {/* Notification bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setShowNotifications((v) => !v);
              }}
              className={`navbar-icon-btn flex h-9 w-9 items-center justify-center relative rounded-lg border transition-all cursor-pointer ${showNotifications ? 'is-active' : ''}`}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
              {/* Unread badge — controlled by show_unread_badge setting */}
              {showBadge && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none font-mono shadow-sm pointer-events-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="navbar-dropdown notifications-dropdown absolute right-0 top-12 w-96 rounded-xl shadow-2xl z-50 overflow-hidden border">
                {/* Dropdown header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-blue-500 hover:text-blue-400 font-medium cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                {!notificationsEnabled && (
                  <div className="px-4 py-2 text-xs bg-amber-500/10 border-b border-amber-500/20 text-amber-400 flex items-center justify-between">
                    <span>Alert popups are muted in Settings</span>
                    <button
                      onClick={() => { setShowNotifications(false); navigate('/settings'); }}
                      className="underline hover:text-amber-300 ml-2 cursor-pointer"
                    >
                      Settings
                    </button>
                  </div>
                )}

                {/* Notification list */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-60">
                      <CheckCircle2 size={24} />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`w-full text-left px-4 py-3 border-b transition-colors flex gap-2 cursor-pointer ${
                          n.is_read ? 'opacity-50' : ''
                        }`}
                      >
                        {severityIcon[n.notification_type] || severityIcon.info}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {n.title}
                          </p>
                          {/* Preview text — controlled by notification_preview setting */}
                          {showPreview && (
                            <p className="text-xs opacity-75 truncate mt-0.5">{n.message}</p>
                          )}
                          <p className="text-[10px] opacity-60 mt-1">
                            {formatTimestamp(n.created_at)}
                          </p>
                        </div>
                        {!n.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t flex justify-end">
                  <button
                    onClick={() => { setShowNotifications(false); navigate('/alerts'); }}
                    className="text-xs text-blue-500 hover:text-blue-400 font-medium cursor-pointer"
                  >
                    View all alerts →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Vertical divider */}
          <div className="navbar-divider h-6 w-px hidden sm:block" />

          {/* Profile menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`navbar-icon-btn flex h-9 w-9 items-center justify-center rounded-lg border transition-all shadow-sm cursor-pointer ${showProfileMenu ? 'is-active' : ''}`}
              aria-label="Profile menu"
              title="Profile menu"
            >
              <User size={18} />
            </button>

            {showProfileMenu && (
              <div className="navbar-dropdown profile-dropdown absolute right-0 mt-2 w-48 rounded-lg shadow-lg border">
                <button onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 border-b cursor-pointer">
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button onClick={() => { setShowProfileMenu(false); navigate('/settings'); }} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 border-b cursor-pointer">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:text-red-400 flex items-center gap-2 cursor-pointer">
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
