import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import api, { unwrap } from '../api';

// ─── Default application preferences ────────────────────────────────────────
export const SETTINGS_DEFAULTS = {
  // General
  language: 'en',
  default_page: '/servers',
  remember_last_page: 'true',
  confirm_destructive: 'true',

  // Appearance
  theme: 'dark',
  sidebar_layout: 'expanded',
  compact_mode: 'false',
  chart_animations: 'true',
  accent_color: 'purple',

  // Dashboard
  refresh_interval: '5',
  default_server: 'all',
  remember_selected_server: 'false',
  show_kpi_cards: 'true',

  // Notifications
  notifications_enabled: 'true',
  notification_sound: 'false',
  desktop_notifications: 'false',
  show_unread_badge: 'true',
  notification_frequency: 'instant',
  notification_preview: 'true',

  // Date & Time
  time_format: '24h',
  date_format: 'YYYY-MM-DD',
  timezone: 'auto',
  timestamp_display: 'relative',

  // Accessibility
  reduce_motion: 'false',
  high_contrast: 'false',
  larger_text: 'false',
  focus_indicators: 'false',

  // Privacy & Session
  session_timeout: '1h',
  auto_logout: 'true',
  remember_preferences: 'true',

  // Kept for compatibility with existing backend keys
  show_success_toasts: 'true',
  show_error_toasts: 'true',
};

// ─── Accent color map ────────────────────────────────────────────────────────
export const ACCENT_COLORS = {
  purple: { hue: '263', label: 'SHMS Purple', primary: '#9333ea', light: '#d8b4fe' },
  blue:   { hue: '217', label: 'Blue',         primary: '#2563eb', light: '#93c5fd' },
  teal:   { hue: '172', label: 'Teal',          primary: '#0d9488', light: '#5eead4' },
  rose:   { hue: '350', label: 'Rose',          primary: '#e11d48', light: '#fda4af' },
  amber:  { hue: '43',  label: 'Amber',         primary: '#d97706', light: '#fcd34d' },
};

// ─── Context ─────────────────────────────────────────────────────────────────
const SettingsContext = createContext(null);

// ─── DOM applicator — applies settings to <html> element ─────────────────────
export function applySettingsToDOM(settings) {
  const html = document.documentElement;

  // — Theme ——————————————————————————————————————————————————————————
  const theme = settings.theme || 'dark';
  let resolvedTheme = theme;
  if (theme === 'system') {
    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  html.setAttribute('data-theme', resolvedTheme);

  // — Compact mode ———————————————————————————————————————————————————
  html.setAttribute('data-density', settings.compact_mode === 'true' ? 'compact' : 'comfortable');

  // — Chart animations ———————————————————————————————————————————————
  html.setAttribute('data-chart-animations', settings.chart_animations === 'false' ? 'false' : 'true');

  // — Accent color ———————————————————————————————————————————————————
  const accentKey = settings.accent_color || 'purple';
  const accent = ACCENT_COLORS[accentKey] || ACCENT_COLORS.purple;
  html.style.setProperty('--accent-primary', accent.primary);
  html.style.setProperty('--accent-light', accent.light);
  html.style.setProperty('--accent-hue', accent.hue);

  // — Accessibility ——————————————————————————————————————————————————
  html.setAttribute('data-reduce-motion', settings.reduce_motion === 'true' ? 'true' : 'false');
  html.setAttribute('data-high-contrast', settings.high_contrast === 'true' ? 'true' : 'false');
  html.setAttribute('data-larger-text', settings.larger_text === 'true' ? 'true' : 'false');
  html.setAttribute('data-focus-indicators', settings.focus_indicators === 'true' ? 'true' : 'false');
}

// ─── Idle timeout hook ────────────────────────────────────────────────────────
function useIdleTimeout(timeoutMs, onTimeout, enabled) {
  const timerRef = useRef(null);

  const reset = useCallback(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onTimeout, timeoutMs);
  }, [timeoutMs, onTimeout, enabled]);

  useEffect(() => {
    if (!enabled || !timeoutMs || timeoutMs <= 0) return;

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset(); // start the timer

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reset, enabled, timeoutMs]);
}

// ─── Helper: parse session timeout string to milliseconds ────────────────────
function parseSessionTimeoutMs(val) {
  if (!val || val === 'never') return 0;
  if (val === '15m') return 15 * 60 * 1000;
  if (val === '30m') return 30 * 60 * 1000;
  if (val === '1h')  return 60 * 60 * 1000;
  if (val === '4h')  return 4 * 60 * 60 * 1000;
  return 0;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    // Seed from localStorage for instant rendering before API call
    try {
      const cached = localStorage.getItem('shms_settings_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timezone === 'America/Denver') {
          parsed.timezone = 'auto';
          try {
            localStorage.setItem('shms_settings_cache', JSON.stringify(parsed));
          } catch { /* ignore */ }
        }
        applySettingsToDOM(parsed);
        return { ...SETTINGS_DEFAULTS, ...parsed };
      }
    } catch { /* ignore */ }
    return { ...SETTINGS_DEFAULTS };
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsError, setSettingsError] = useState(null);

  // ── Load settings from backend ───────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    try {
      const res = await api.get('/settings');
      const list = unwrap(res) || [];
      if (Array.isArray(list)) {
        const loaded = { ...SETTINGS_DEFAULTS };
        list.forEach((item) => {
          if (item.key && item.key in SETTINGS_DEFAULTS) {
            loaded[item.key] = String(item.value);
          }
        });
        setSettings(loaded);
        applySettingsToDOM(loaded);
        // Cache for next load
        try {
          const remember = loaded.remember_preferences !== 'false';
          if (remember) {
            localStorage.setItem('shms_settings_cache', JSON.stringify(loaded));
          }
        } catch { /* ignore */ }
        setSettingsError(null);
      }
    } catch (err) {
      setSettingsError('Failed to load settings from server');
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      loadSettings();
    } else {
      setSettingsLoaded(true);
    }
  }, [loadSettings]);

  // ── Apply DOM effects whenever settings change ───────────────────────────
  useEffect(() => {
    applySettingsToDOM(settings);
  }, [settings]);

  // ── System theme listener ────────────────────────────────────────────────
  useEffect(() => {
    if (settings.theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applySettingsToDOM(settings);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [settings]);

  // ── Auto-logout ──────────────────────────────────────────────────────────
  const autoLogoutEnabled = settings.auto_logout === 'true' && settings.session_timeout !== 'never';
  const sessionTimeoutMs = parseSessionTimeoutMs(settings.session_timeout);

  const handleIdleTimeout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }, []);

  useIdleTimeout(sessionTimeoutMs, handleIdleTimeout, autoLogoutEnabled && !!localStorage.getItem('token'));

  // ── Helper: is a setting a boolean "true" ────────────────────────────────
  const isEnabled = useCallback((key) => settings[key] === 'true', [settings]);

  // ── Helper: get setting value ─────────────────────────────────────────────
  const getSetting = useCallback((key, fallback = '') => settings[key] ?? fallback, [settings]);

  // ── Format date/time according to settings ───────────────────────────────
  const formatTimestamp = useCallback((isoString, forceMode) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const mode = forceMode || settings.timestamp_display || 'relative';

    if (mode === 'relative') {
      const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    }

    // Exact mode
    const tz = settings.timezone === 'auto' ? undefined : settings.timezone;
    const use12h = settings.time_format === '12h';
    const dateFmt = settings.date_format || 'YYYY-MM-DD';

    try {
      const opts = {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: use12h,
      };
      const parts = new Intl.DateTimeFormat('en-GB', opts).formatToParts(date);
      const get = (type) => parts.find((p) => p.type === type)?.value || '';
      const day = get('day');
      const month = get('month');
      const year = get('year');
      const hour = get('hour');
      const minute = get('minute');
      const dayPeriod = get('dayPeriod');

      let dateStr;
      if (dateFmt === 'DD/MM/YYYY') dateStr = `${day}/${month}/${year}`;
      else if (dateFmt === 'MM/DD/YYYY') dateStr = `${month}/${day}/${year}`;
      else dateStr = `${year}-${month}-${day}`;

      const timeStr = use12h ? `${hour}:${minute} ${dayPeriod}` : `${hour}:${minute}`;
      return `${dateStr}, ${timeStr}`;
    } catch {
      return date.toLocaleString();
    }
  }, [settings]);

  // ── Theme State & Helpers ────────────────────────────────────────────────
  const getResolvedTheme = useCallback(() => {
    const t = settings.theme || 'dark';
    if (t === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return t;
  }, [settings.theme]);

  const [resolvedTheme, setResolvedTheme] = useState(getResolvedTheme);

  useEffect(() => {
    setResolvedTheme(getResolvedTheme());
  }, [getResolvedTheme]);

  // Update a single setting with instant DOM preview, cache, and backend sync
  const updateSetting = useCallback(async (key, value) => {
    const strVal = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
    setSettings((prev) => {
      const updated = { ...prev, [key]: strVal };
      applySettingsToDOM(updated);
      try {
        localStorage.setItem('shms_settings_cache', JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });

    if (key === 'theme') {
      let resolved = strVal;
      if (strVal === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      setResolvedTheme(resolved);
    }

    if (localStorage.getItem('token')) {
      try {
        await api.put('/settings', [{ key, value: strVal }]);
      } catch (err) {
        console.warn('Failed to persist setting to backend:', err);
      }
    }
  }, []);

  const setTheme = useCallback((newTheme) => {
    return updateSetting('theme', newTheme);
  }, [updateSetting]);

  const toggleTheme = useCallback(() => {
    const current = getResolvedTheme();
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [getResolvedTheme, setTheme]);

  // Chart theme tokens for Recharts (AMOLED Pure Black & Light)
  const chartTheme = useMemo(() => {
    const isDark = resolvedTheme === 'dark';
    return {
      isDark,
      grid: isDark ? '#151515' : '#E2E8F0',
      axis: isDark ? '#242424' : '#E2E8F0',
      tick: isDark ? '#A3A3A3' : '#64748B',
      ticks: isDark ? '#666666' : '#94A3B8',
      text: isDark ? '#FFFFFF' : '#0F172A',
      legendText: isDark ? '#D4D4D4' : '#475569',
      tooltipBg: isDark ? '#080808' : '#FFFFFF',
      tooltipBorder: isDark ? '#242424' : '#E2E8F0',
      tooltipText: isDark ? '#FFFFFF' : '#0F172A',
      cardBg: isDark ? '#050505' : '#FFFFFF',
    };
  }, [resolvedTheme]);

  // ── Provide context value ─────────────────────────────────────────────────
  const value = {
    settings,
    theme: settings.theme || 'dark',
    resolvedTheme,
    setTheme,
    toggleTheme,
    chartTheme,
    updateSetting,
    settingsLoaded,
    settingsError,
    loadSettings,
    isEnabled,
    getSetting,
    formatTimestamp,
    applySettingsToDOM,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};

export const useTheme = () => {
  const { theme, resolvedTheme, setTheme, toggleTheme, chartTheme } = useSettings();
  return { theme, resolvedTheme, setTheme, toggleTheme, chartTheme };
};

export default SettingsContext;
