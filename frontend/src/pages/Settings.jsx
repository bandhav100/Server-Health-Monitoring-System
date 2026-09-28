import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Globe,
  Palette,
  LayoutDashboard,
  Bell,
  Clock,
  Accessibility,
  ShieldCheck,
  Wrench,
  Info,
  Save,
  RotateCcw,
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Server,
  Monitor,
  Moon,
  Sun,
  Laptop,
  ChevronRight,
  Trash2,
  X,
} from 'lucide-react';
import api, { unwrap } from '../api';
import { useDashboard } from '../context/DashboardContext';
import { useSettings, SETTINGS_DEFAULTS, ACCENT_COLORS, applySettingsToDOM } from '../context/SettingsContext';

// ─────────────────────────────────────────────────────────────
//  APP SETTING KEYS (subset shown in Settings UI)
// ─────────────────────────────────────────────────────────────
const UI_SETTING_KEYS = [
  'language', 'default_page', 'remember_last_page', 'confirm_destructive',
  'theme', 'sidebar_layout', 'compact_mode', 'chart_animations', 'accent_color',
  'refresh_interval', 'default_server', 'remember_selected_server', 'show_kpi_cards',
  'notifications_enabled', 'notification_sound', 'desktop_notifications',
  'show_unread_badge', 'notification_frequency', 'notification_preview',
  'time_format', 'date_format', 'timezone', 'timestamp_display',
  'reduce_motion', 'high_contrast', 'larger_text', 'focus_indicators',
  'session_timeout', 'auto_logout', 'remember_preferences',
];

const UI_DEFAULTS = Object.fromEntries(
  UI_SETTING_KEYS.map((k) => [k, SETTINGS_DEFAULTS[k] ?? ''])
);

// ─────────────────────────────────────────────────────────────
//  NAV SECTIONS
// ─────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: 'general',      label: 'General',           icon: Globe },
  { id: 'appearance',   label: 'Appearance',         icon: Palette },
  { id: 'dashboard',    label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'notifications',label: 'Notifications',      icon: Bell },
  { id: 'datetime',     label: 'Date & Time',        icon: Clock },
  { id: 'accessibility',label: 'Accessibility',      icon: Accessibility },
  { id: 'privacy',      label: 'Privacy & Session',  icon: ShieldCheck },
  { id: 'system',       label: 'System',             icon: Wrench },
  { id: 'about',        label: 'About',              icon: Info },
];

// ─────────────────────────────────────────────────────────────
//  PRIMITIVE COMPONENTS
// ─────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled = false, id }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    id={id}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
      checked ? 'bg-[var(--accent-primary)]' : 'bg-slate-700 dark:bg-slate-700'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    style={{ '--tw-ring-color': 'var(--accent-primary)' }}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const SettingSelect = ({ value, onChange, options, disabled = false, className = '' }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className={`setting-select bg-slate-800/90 border border-slate-700 text-gray-200 text-sm font-medium rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] px-3 py-2 transition-colors cursor-pointer hover:border-slate-600 ${
      disabled ? 'opacity-40 cursor-not-allowed' : ''
    } ${className}`}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value} className="bg-slate-900 text-gray-200">
        {opt.label}
      </option>
    ))}
  </select>
);

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2.5 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
      <Icon size={20} />
    </div>
    <div>
      <h2 className="text-lg font-bold settings-section-title tracking-tight">{title}</h2>
      {description && <p className="text-xs settings-section-desc mt-0.5">{description}</p>}
    </div>
  </div>
);

const SettingRow = ({ label, description, children, noBorder = false }) => (
  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 ${!noBorder ? 'border-b border-slate-800/60' : ''}`}>
    <div className="flex-1 pr-4">
      <div className="text-sm font-medium settings-label">{label}</div>
      {description && <div className="text-xs settings-desc mt-0.5 leading-relaxed">{description}</div>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

const SegmentedControl = ({ value, onChange, options }) => (
  <div className="segmented-control-bg inline-flex rounded-lg border border-slate-700 bg-slate-800/60 p-1 gap-1">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          value === opt.value
            ? 'bg-[var(--accent-primary)] text-white shadow-sm'
            : 'segmented-control-item-inactive text-gray-400 hover:text-gray-200 hover:bg-white/5'
        }`}
      >
        {opt.icon && <opt.icon size={13} />}
        {opt.label}
      </button>
    ))}
  </div>
);

const ActionButton = ({ onClick, disabled, loading, children, variant = 'default', className = '' }) => {
  const base = 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border';
  const variants = {
    default: 'action-btn-default bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700 hover:text-white',
    primary: 'bg-[var(--accent-primary)] border-transparent text-white hover:opacity-90 shadow-lg',
    danger:  'action-btn-danger bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30',
    blue:    'action-btn-blue bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading && <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />}
      {children}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────────────────────────
const Toast = ({ toast }) => (
  <AnimatePresence>
    {toast.show && (
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md max-w-sm ${
          toast.type === 'error'
            ? 'bg-red-950/90 border-red-800/60 text-red-200'
            : 'bg-emerald-950/90 border-emerald-800/60 text-emerald-200'
        }`}
      >
        {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
        <span className="text-sm font-medium">{toast.message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────────────────────
//  CONFIRMATION MODAL
// ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ open, title, message, note, confirmLabel, confirmVariant = 'danger', onConfirm, onCancel, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle size={22} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <h3 className="text-base font-bold text-white modal-title">{title}</h3>
        </div>
        <p className="text-sm text-gray-300 modal-desc leading-relaxed mb-4">{message}</p>
        {note && (
          <div className="p-3 bg-slate-800/60 rounded-lg text-xs text-gray-300 border border-slate-800 mb-4">
            {note}
          </div>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="action-btn-default px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              confirmVariant === 'danger'
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm'
                : 'bg-[var(--accent-primary)] hover:opacity-90 text-white shadow-sm'
            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  TIMEZONE LIST
// ─────────────────────────────────────────────────────────────
const TIMEZONES = [
  { value: 'auto',                 label: 'Browser Default (Auto)' },
  { value: 'UTC',                  label: 'UTC — Universal Time' },
  { value: 'America/New_York',     label: 'New York (EST/EDT)' },
  { value: 'America/Chicago',      label: 'Chicago (CST/CDT)' },
  { value: 'America/Denver',       label: 'Denver (MST/MDT)' },
  { value: 'America/Los_Angeles',  label: 'Los Angeles (PST/PDT)' },
  { value: 'America/Sao_Paulo',    label: 'São Paulo (BRT)' },
  { value: 'Europe/London',        label: 'London (GMT/BST)' },
  { value: 'Europe/Paris',         label: 'Paris / Berlin (CET/CEST)' },
  { value: 'Europe/Moscow',        label: 'Moscow (MSK)' },
  { value: 'Asia/Dubai',           label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata',         label: 'India (IST)' },
  { value: 'Asia/Bangkok',         label: 'Bangkok (ICT)' },
  { value: 'Asia/Singapore',       label: 'Singapore (SGT)' },
  { value: 'Asia/Shanghai',        label: 'Beijing / Shanghai (CST)' },
  { value: 'Asia/Tokyo',           label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul',           label: 'Seoul (KST)' },
  { value: 'Australia/Sydney',     label: 'Sydney (AEST/AEDT)' },
  { value: 'Pacific/Auckland',     label: 'Auckland (NZST)' },
];

// ─────────────────────────────────────────────────────────────
//  PAGE ROUTE OPTIONS
// ─────────────────────────────────────────────────────────────
const PAGE_OPTIONS = [
  { value: '/servers',    label: 'Servers' },
  { value: '/monitoring', label: 'Live Monitoring' },
  { value: '/predictions',label: 'Predictions' },
  { value: '/alerts',     label: 'Alerts' },
  { value: '/logs',       label: 'Logs' },
  { value: '/docker',     label: 'Docker' },
  { value: '/grafana',    label: 'Grafana' },
  { value: '/settings',   label: 'Settings' },
];

// ─────────────────────────────────────────────────────────────
//  MAIN SETTINGS COMPONENT
// ─────────────────────────────────────────────────────────────
const Settings = () => {
  const { servers } = useDashboard();
  const { settings, updateSetting, loadSettings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ ...UI_DEFAULTS });
  const [savedForm, setSavedForm] = useState({ ...UI_DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [testingNotification, setTestingNotification] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [clearingPrefs, setClearingPrefs] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [modals, setModals] = useState({
    resetDefaults: false,
    clearPrefs: false,
    unsavedNav: false,
  });
  const [desktopPermission, setDesktopPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const pendingNavRef = useRef(null);

  // ── Navigation blocker for unsaved changes ─────────────────────────────
  const isDirty = useMemo(
    () => UI_SETTING_KEYS.some((k) => form[k] !== savedForm[k]),
    [form, savedForm]
  );

  // Guard 1: Browser close / refresh — works with any router
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Guard 2: In-app navigation — intercept sidebar/navbar Link clicks
  // We override the global click handler so any <Link> or <a> that would
  // navigate away triggers the confirmation modal instead.
  useEffect(() => {
    if (!isDirty) return;

    const handleClick = (e) => {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http')) return;
      // Same page — no guard needed
      if (href === location.pathname) return;

      e.preventDefault();
      e.stopPropagation();
      pendingNavRef.current = href;
      setModals((m) => ({ ...m, unsavedNav: true }));
    };

    document.addEventListener('click', handleClick, true); // capture phase
    return () => document.removeEventListener('click', handleClick, true);
  }, [isDirty, location.pathname]);

  // ── Toast helper ───────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    const timer = setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4500);
    return () => clearTimeout(timer);
  }, []);

  // ── Load settings from backend ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        const list = unwrap(res) || [];
        if (mounted && Array.isArray(list)) {
          const loaded = { ...UI_DEFAULTS };
          list.forEach((item) => {
            if (item.key && item.key in UI_DEFAULTS) {
              loaded[item.key] = String(item.value);
            }
          });
          setForm(loaded);
          setSavedForm(loaded);
        }
      } catch {
        if (mounted) showToast('Failed to load settings from server.', 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSettings();
    return () => { mounted = false; };
  }, [showToast]);

  // ── Sync theme if changed externally (e.g. header toggle) ───────────
  useEffect(() => {
    if (settings?.theme && form.theme !== settings.theme) {
      setForm((prev) => ({ ...prev, theme: settings.theme }));
      setSavedForm((prev) => ({ ...prev, theme: settings.theme }));
    }
  }, [settings?.theme]);

  // ── Handle form field change ───────────────────────────────────────────
  const handleChange = useCallback((key, value) => {
    const strVal = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
    setForm((prev) => ({ ...prev, [key]: strVal }));
    setSaveStatus('idle');

    if (key === 'theme') {
      updateSetting('theme', strVal);
    } else {
      // Immediate DOM preview for visual settings
      const preview = {};
      preview[key] = strVal;
      applySettingsToDOM({ ...form, ...preview });
    }
  }, [form, updateSetting]);

  // ── Save all settings ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (saving || !isDirty) return;
    try {
      setSaving(true);
      setSaveStatus('saving');
      const payload = UI_SETTING_KEYS.map((key) => ({ key, value: form[key] }));
      await api.put('/settings', payload);

      // Persist default_page to localStorage for App.tsx redirect
      localStorage.setItem('shms_default_page', form.default_page);
      // Persist settings cache
      if (form.remember_preferences !== 'false') {
        localStorage.setItem('shms_settings_cache', JSON.stringify(form));
      }

      setSavedForm({ ...form });
      setSaveStatus('saved');
      await loadSettings(); // refresh global context

      // Reset save status after a few seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
      showToast('Settings saved successfully.', 'success');
    } catch {
      setSaveStatus('error');
      showToast('Failed to save settings. Please try again.', 'error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  // ── Reset to defaults ──────────────────────────────────────────────────
  const handleResetDefaults = async () => {
    try {
      setResetting(true);
      const res = await api.post('/settings/reset');
      const list = unwrap(res) || [];
      const reset = { ...UI_DEFAULTS };
      if (Array.isArray(list)) {
        list.forEach((item) => {
          if (item.key && item.key in UI_DEFAULTS) reset[item.key] = String(item.value);
        });
      }
      setForm(reset);
      setSavedForm(reset);
      applySettingsToDOM(reset);
      localStorage.setItem('shms_settings_cache', JSON.stringify(reset));
      setModals((m) => ({ ...m, resetDefaults: false }));
      await loadSettings();
      showToast('Settings restored to defaults.', 'success');
    } catch {
      showToast('Failed to reset settings.', 'error');
    } finally {
      setResetting(false);
    }
  };

  // ── Clear local preferences ────────────────────────────────────────────
  const handleClearPrefs = () => {
    const keysToRemove = [
      'shms_settings_cache', 'shms_last_page', 'shms_default_page',
      'shms_selected_server',
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    setClearingPrefs(false);
    setModals((m) => ({ ...m, clearPrefs: false }));
    showToast('Local preferences cleared.', 'success');
  };

  // ── Test notification ──────────────────────────────────────────────────
  const handleTestNotification = async () => {
    if (testingNotification) return;
    if (form.notifications_enabled !== 'true') {
      showToast('Notifications are disabled. Enable them first.', 'error');
      return;
    }
    try {
      setTestingNotification(true);
      await api.post('/settings/test-notification');
      showToast('Test notification sent! Check the notification bell.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not send test notification.';
      showToast(msg, 'error');
    } finally {
      setTestingNotification(false);
    }
  };

  // ── Request desktop notification permission ────────────────────────────
  const requestDesktopPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setDesktopPermission(result);
    if (result === 'granted') {
      handleChange('desktop_notifications', true);
      showToast('Desktop notifications enabled.', 'success');
    } else {
      showToast('Browser denied notification permission. Check browser settings.', 'error');
    }
  };

  // ── Server options for Default Server selector ─────────────────────────
  const serverOptions = useMemo(() => {
    const list = [{ value: 'all', label: 'All Servers (Default)' }];
    if (Array.isArray(servers)) {
      servers.forEach((s) => {
        const name = s.name || s.hostname || s.prometheus_instance;
        const ip = s.ip_address || s.ip || s.tailscale_ip || '';
        list.push({
          value: String(s.id || s.prometheus_instance),
          label: `${name}${ip ? ` (${ip})` : ''}`,
        });
      });
    }
    return list;
  }, [servers]);

  // ── Save bar label ─────────────────────────────────────────────────────
  const saveBarLabel = () => {
    if (saveStatus === 'saving') return 'Saving...';
    if (saveStatus === 'saved') return '✓ All changes saved';
    if (saveStatus === 'error') return 'Save failed';
    if (isDirty) return '● Unsaved changes';
    return 'All changes saved';
  };

  const saveButtonLabel = () => {
    if (saveStatus === 'saving') return 'Saving...';
    if (saveStatus === 'saved') return 'Saved ✓';
    if (saveStatus === 'error') return 'Save Failed';
    return 'Save Changes';
  };

  // ─────────────────────────────────────────────────────────────
  //  SECTION RENDERERS
  // ─────────────────────────────────────────────────────────────

  const renderGeneral = () => (
    <div>
      <SectionHeader icon={Globe} title="General" description="Language, navigation, and application workflow preferences" />
      <div className="space-y-0">
        <SettingRow label="Application Language" description="Interface display language">
          <SettingSelect
            value={form.language}
            onChange={(v) => handleChange('language', v)}
            options={[{ value: 'en', label: 'English' }]}
            className="w-44"
          />
        </SettingRow>

        <SettingRow label="Default Landing Page" description="Page opened when the application starts or on login">
          <SettingSelect
            value={form.default_page}
            onChange={(v) => handleChange('default_page', v)}
            options={PAGE_OPTIONS}
            className="w-48"
          />
        </SettingRow>

        <SettingRow label="Remember Last Page" description="ON: restore last visited route on startup. OFF: always use Default Landing Page">
          <Toggle checked={form.remember_last_page === 'true'} onChange={(v) => handleChange('remember_last_page', v)} />
        </SettingRow>

        <SettingRow label="Confirm Destructive Actions" description="Show confirmation dialogs before delete, clear, reset, or stop operations" noBorder>
          <Toggle checked={form.confirm_destructive === 'true'} onChange={(v) => handleChange('confirm_destructive', v)} />
        </SettingRow>
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div>
      <SectionHeader icon={Palette} title="Appearance" description="Theme, layout, density, and visual presentation" />
      <div className="space-y-0">
        <SettingRow label="Theme" description="Application color scheme — applies immediately without reload">
          <SegmentedControl
            value={form.theme}
            onChange={(v) => handleChange('theme', v)}
            options={[
              { value: 'dark',   label: 'Dark',   icon: Moon },
              { value: 'light',  label: 'Light',  icon: Sun },
              { value: 'system', label: 'System', icon: Laptop },
            ]}
          />
        </SettingRow>

        <SettingRow label="Sidebar" description="Default sidebar state — icons only when collapsed, with tooltips">
          <SegmentedControl
            value={form.sidebar_layout}
            onChange={(v) => handleChange('sidebar_layout', v)}
            options={[
              { value: 'expanded',  label: 'Expanded' },
              { value: 'collapsed', label: 'Collapsed' },
            ]}
          />
        </SettingRow>

        <SettingRow label="Dashboard Density" description="Compact reduces card padding while preserving all information">
          <SegmentedControl
            value={form.compact_mode === 'true' ? 'compact' : 'comfortable'}
            onChange={(v) => handleChange('compact_mode', v === 'compact')}
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact',     label: 'Compact' },
            ]}
          />
        </SettingRow>

        <SettingRow label="Chart Animations" description="Enable smooth rendering transitions on metric graphs">
          <Toggle checked={form.chart_animations === 'true'} onChange={(v) => handleChange('chart_animations', v)} />
        </SettingRow>

        <SettingRow label="Accent Color" description="Primary color used for active states, toggles, and interactive elements" noBorder>
          <div className="flex items-center gap-2">
            {Object.entries(ACCENT_COLORS).map(([key, color]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleChange('accent_color', key)}
                title={color.label}
                className={`w-7 h-7 rounded-full transition-all border-2 ${
                  form.accent_color === key
                    ? 'border-white scale-110 shadow-lg'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color.primary }}
              />
            ))}
            <span className="text-xs settings-desc font-medium ml-1">
              {ACCENT_COLORS[form.accent_color]?.label || 'SHMS Purple'}
            </span>
          </div>
        </SettingRow>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div>
      <SectionHeader icon={LayoutDashboard} title="Dashboard" description="Default server, auto-refresh, and data view preferences" />
      <div className="space-y-0">
        <SettingRow label="Default Server" description="Pre-selected server on pages that support server filtering. Populated from configured servers.">
          <SettingSelect
            value={form.default_server}
            onChange={(v) => handleChange('default_server', v)}
            options={serverOptions}
            className="w-52"
          />
        </SettingRow>

        <SettingRow label="Auto Refresh Interval" description="Frequency of automatic telemetry polling. 'Off' stops all automatic refreshes.">
          <SettingSelect
            value={form.refresh_interval}
            onChange={(v) => handleChange('refresh_interval', v)}
            options={[
              { value: '5',  label: '5 seconds' },
              { value: '10', label: '10 seconds' },
              { value: '30', label: '30 seconds' },
              { value: '60', label: '1 minute' },
              { value: '0',  label: 'Off (manual)' },
            ]}
            className="w-44"
          />
        </SettingRow>

        <SettingRow label="Remember Selected Server" description="Persist selected server across page navigations and sessions">
          <Toggle checked={form.remember_selected_server === 'true'} onChange={(v) => handleChange('remember_selected_server', v)} />
        </SettingRow>

        <SettingRow label="Show KPI Cards" description="Display summary KPI cards on applicable dashboard pages" noBorder>
          <Toggle checked={form.show_kpi_cards === 'true'} onChange={(v) => handleChange('show_kpi_cards', v)} />
        </SettingRow>
      </div>
    </div>
  );

  const renderNotifications = () => {
    const notifOn = form.notifications_enabled === 'true';
    return (
      <div>
        <SectionHeader icon={Bell} title="Notifications" description="Alert delivery, audio, desktop push, and notification behaviour" />
        <div className="space-y-0">
          <SettingRow label="Enable Notifications" description="Master switch — controls all in-app notification delivery and display">
            <Toggle checked={notifOn} onChange={(v) => handleChange('notifications_enabled', v)} />
          </SettingRow>

          <SettingRow label="Notification Sound" description="Play an audible chime when a genuinely new notification arrives (not on page load)">
            <Toggle
              checked={form.notification_sound === 'true'}
              onChange={(v) => handleChange('notification_sound', v)}
              disabled={!notifOn}
            />
          </SettingRow>

          <SettingRow
            label="Desktop Notifications"
            description={
              desktopPermission === 'denied'
                ? '⚠ Browser has denied permission — change in browser site settings'
                : 'Send browser push notifications for new alerts'
            }
          >
            <div className="flex items-center gap-2">
              <Toggle
                checked={form.desktop_notifications === 'true'}
                onChange={(v) => {
                  if (v && desktopPermission !== 'granted') {
                    requestDesktopPermission();
                  } else {
                    handleChange('desktop_notifications', v);
                  }
                }}
                disabled={!notifOn || desktopPermission === 'denied'}
              />
              {desktopPermission === 'default' && notifOn && (
                <button
                  type="button"
                  onClick={requestDesktopPermission}
                  className="text-xs text-[var(--accent-primary)] hover:opacity-80"
                >
                  Request permission
                </button>
              )}
            </div>
          </SettingRow>

          <SettingRow label="Show Unread Badge" description="Display red count badge on the notification bell icon in the navbar">
            <Toggle
              checked={form.show_unread_badge === 'true'}
              onChange={(v) => handleChange('show_unread_badge', v)}
              disabled={!notifOn}
            />
          </SettingRow>

          <SettingRow label="Notification Frequency" description="Throttle repeated notifications for the same ongoing event">
            <SettingSelect
              value={form.notification_frequency}
              onChange={(v) => handleChange('notification_frequency', v)}
              disabled={!notifOn}
              options={[
                { value: 'instant', label: 'Instant' },
                { value: '30',      label: '30 seconds' },
                { value: '60',      label: '1 minute' },
                { value: '300',     label: '5 minutes' },
                { value: '900',     label: '15 minutes' },
              ]}
              className="w-44"
            />
          </SettingRow>

          <SettingRow label="Notification Preview" description="Show notification message snippet in the notification dropdown" noBorder>
            <Toggle
              checked={form.notification_preview === 'true'}
              onChange={(v) => handleChange('notification_preview', v)}
              disabled={!notifOn}
            />
          </SettingRow>
        </div>
      </div>
    );
  };

  const renderDateTime = () => (
    <div>
      <SectionHeader icon={Clock} title="Date & Time" description="Timestamp formatting, timezone, and display style across the application" />
      <div className="space-y-0">
        <SettingRow label="Time Format" description="12-hour (2:30 PM) or 24-hour (14:30) clock format">
          <SegmentedControl
            value={form.time_format}
            onChange={(v) => handleChange('time_format', v)}
            options={[
              { value: '12h', label: '12-hour' },
              { value: '24h', label: '24-hour' },
            ]}
          />
        </SettingRow>

        <SettingRow label="Date Format" description="Applied throughout Alerts, Logs, Notifications, and history labels">
          <SettingSelect
            value={form.date_format}
            onChange={(v) => handleChange('date_format', v)}
            options={[
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY  (11/09/2026)' },
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY  (09/11/2026)' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD  (2026-09-11)' },
            ]}
            className="w-52"
          />
        </SettingRow>

        <SettingRow label="Timezone" description="Convert displayed timestamps — does not modify stored database timestamps">
          <SettingSelect
            value={form.timezone}
            onChange={(v) => handleChange('timezone', v)}
            options={TIMEZONES}
            className="w-56"
          />
        </SettingRow>

        <SettingRow label="Timestamp Display" description="Relative: '3 minutes ago' — Exact: '11 Sep 2026, 17:25'" noBorder>
          <SegmentedControl
            value={form.timestamp_display}
            onChange={(v) => handleChange('timestamp_display', v)}
            options={[
              { value: 'relative', label: 'Relative' },
              { value: 'exact',    label: 'Exact' },
            ]}
          />
        </SettingRow>
      </div>
    </div>
  );

  const renderAccessibility = () => (
    <div>
      <SectionHeader icon={Accessibility} title="Accessibility" description="Motion, contrast, text size, and keyboard navigation improvements" />
      <div className="space-y-0">
        <SettingRow label="Reduce Motion" description="Disables non-essential UI animations and transitions — applies immediately">
          <Toggle checked={form.reduce_motion === 'true'} onChange={(v) => handleChange('reduce_motion', v)} />
        </SettingRow>

        <SettingRow label="High Contrast" description="Increases text and border contrast throughout the application">
          <Toggle checked={form.high_contrast === 'true'} onChange={(v) => handleChange('high_contrast', v)} />
        </SettingRow>

        <SettingRow label="Larger Text" description="Increases base font scale by ~12% for improved readability">
          <Toggle checked={form.larger_text === 'true'} onChange={(v) => handleChange('larger_text', v)} />
        </SettingRow>

        <SettingRow label="Focus Indicators" description="Show strong visible focus rings for keyboard and assistive technology navigation" noBorder>
          <Toggle checked={form.focus_indicators === 'true'} onChange={(v) => handleChange('focus_indicators', v)} />
        </SettingRow>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div>
      <SectionHeader icon={ShieldCheck} title="Privacy & Session" description="Inactivity timeouts, automatic logout, and local preference management" />
      <div className="space-y-0">
        <SettingRow label="Session Timeout" description="Duration of inactivity before auto-logout is triggered (if Auto Logout is ON)">
          <SettingSelect
            value={form.session_timeout}
            onChange={(v) => handleChange('session_timeout', v)}
            options={[
              { value: '15m',   label: '15 minutes' },
              { value: '30m',   label: '30 minutes' },
              { value: '1h',    label: '1 hour (recommended)' },
              { value: '4h',    label: '4 hours' },
              { value: 'never', label: 'Never' },
            ]}
            className="w-52"
          />
        </SettingRow>

        <SettingRow label="Auto Logout" description="Track inactivity (mouse, keyboard, click) and automatically end session on timeout">
          <Toggle checked={form.auto_logout === 'true'} onChange={(v) => handleChange('auto_logout', v)} />
        </SettingRow>

        <SettingRow label="Remember Preferences" description="Save application preferences locally for instant loading on next visit">
          <Toggle checked={form.remember_preferences === 'true'} onChange={(v) => handleChange('remember_preferences', v)} />
        </SettingRow>

        <SettingRow label="Clear Local Preferences" description="Remove locally cached settings. Does not delete servers, alerts, metrics, or any database data." noBorder>
          <ActionButton
            onClick={() => setModals((m) => ({ ...m, clearPrefs: true }))}
            variant="danger"
          >
            <Trash2 size={14} />
            Clear
          </ActionButton>
        </SettingRow>
      </div>
    </div>
  );

  const renderSystem = () => (
    <div>
      <SectionHeader icon={Wrench} title="System" description="Notification pipeline testing and application preference restoration" />

      <div className="space-y-4">
        {/* Test Notification */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold settings-title">Test Notification Pipeline</h4>
              <p className="text-xs settings-desc mt-1">
                Creates a real notification via the backend API and delivers it to the notification bell. Verifies end-to-end pipeline.
              </p>
              {form.notifications_enabled !== 'true' && (
                <p className="text-xs text-amber-500 font-medium mt-1.5 flex items-center gap-1">
                  <AlertCircle size={11} />
                  Enable notifications above before testing.
                </p>
              )}
            </div>
            <ActionButton
              onClick={handleTestNotification}
              loading={testingNotification}
              disabled={testingNotification || form.notifications_enabled !== 'true'}
              variant="blue"
              className="flex-shrink-0"
            >
              <Send size={14} />
              {testingNotification ? 'Sending...' : 'Send Test Notification'}
            </ActionButton>
          </div>
        </div>

        {/* Reset Application Preferences */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold settings-title">Reset Application Preferences</h4>
              <p className="text-xs settings-desc mt-1">
                Restores all website preferences, theme, and dashboard options to factory defaults. Does not affect servers, alerts, metrics, or monitoring data.
              </p>
            </div>
            <ActionButton
              onClick={() => setModals((m) => ({ ...m, resetDefaults: true }))}
              variant="danger"
              className="flex-shrink-0"
            >
              <RotateCcw size={14} />
              Reset to Defaults
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAbout = () => {
    const env = import.meta.env.MODE === 'production' ? 'Production' : 'Development';
    const rows = [
      { label: 'Application',   value: 'Server Health Monitoring System (SHMS)' },
      { label: 'Version',       value: 'v3.0.0', mono: true, accent: true },
      { label: 'Environment',   value: env, dot: env === 'Production' ? 'emerald' : 'amber' },
      { label: 'Build',         value: import.meta.env.VITE_BUILD_ID || `#${new Date().toISOString().slice(0,10)}-build`, mono: true },
      { label: 'Frontend',      value: 'React 19 + Vite + Tailwind CSS' },
      { label: 'Backend',       value: 'Python Flask + PostgreSQL' },
      { label: 'Telemetry',     value: 'Prometheus + Windows Exporter + LibreHardwareMonitor' },
      { label: 'Visualisation', value: 'Grafana + Recharts' },
    ];
    return (
      <div>
        <SectionHeader icon={Info} title="About SHMS" description="Application version, environment, and configured monitoring stack" />
        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center justify-between px-5 py-3.5 text-sm ${
                i < rows.length - 1 ? 'border-b border-slate-800/60' : ''
              }`}
            >
              <span className="settings-label font-medium">{row.label}</span>
              {row.dot ? (
                <span className={`flex items-center gap-1.5 font-medium ${row.dot === 'emerald' ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${row.dot === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                  {row.value}
                </span>
              ) : row.accent ? (
                <span className="font-mono text-[var(--accent-primary)] font-semibold text-xs px-2 py-0.5 bg-[var(--accent-primary)]/10 rounded border border-[var(--accent-primary)]/20">
                  {row.value}
                </span>
              ) : row.mono ? (
                <span className="font-mono settings-value text-xs font-semibold">{row.value}</span>
              ) : (
                <span className="settings-value text-right max-w-[60%] font-medium">{row.value}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const SECTION_RENDERERS = {
    general:       renderGeneral,
    appearance:    renderAppearance,
    dashboard:     renderDashboard,
    notifications: renderNotifications,
    datetime:      renderDateTime,
    accessibility: renderAccessibility,
    privacy:       renderPrivacy,
    system:        renderSystem,
    about:         renderAbout,
  };

  // ─────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 settings-desc">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-[var(--accent-primary)] rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container max-w-7xl mx-auto pb-24">
      <Toast toast={toast} />

      {/* ── Modals ── */}
      <ConfirmModal
        open={modals.resetDefaults}
        title="Reset Application Preferences?"
        message="This will restore all website preferences, theme, formatting, and dashboard options back to their factory defaults."
        note={<><strong className="text-emerald-400">Safety Notice:</strong> Servers, telemetry data, alert history, prediction forecasts, and database records will <strong className="text-white">NOT</strong> be reset or altered.</>}
        confirmLabel="Reset Defaults"
        onConfirm={handleResetDefaults}
        onCancel={() => setModals((m) => ({ ...m, resetDefaults: false }))}
        loading={resetting}
      />

      <ConfirmModal
        open={modals.clearPrefs}
        title="Clear Local SHMS Preferences?"
        message="This removes locally cached settings from this browser. Saved server data, alerts, metrics and database records will not be deleted."
        confirmLabel="Clear"
        confirmVariant="danger"
        onConfirm={handleClearPrefs}
        onCancel={() => setModals((m) => ({ ...m, clearPrefs: false }))}
        loading={clearingPrefs}
      />

      <ConfirmModal
        open={modals.unsavedNav}
        title="Unsaved Changes"
        message="You have unsaved settings changes. If you navigate away they will be lost."
        confirmLabel="Discard Changes"
        confirmVariant="danger"
        onConfirm={() => {
          setForm({ ...savedForm });
          applySettingsToDOM(savedForm);
          setModals((m) => ({ ...m, unsavedNav: false }));
          // Navigate to the intercepted path
          if (pendingNavRef.current && typeof pendingNavRef.current === 'string') {
            navigate(pendingNavRef.current);
          }
          pendingNavRef.current = null;
        }}
        onCancel={() => {
          setModals((m) => ({ ...m, unsavedNav: false }));
          pendingNavRef.current = null;
        }}
      />

      {/* ── Page header ── */}
      <div className="flex items-center gap-3.5 pb-6 border-b border-slate-800/60 mb-0">
        <div className="p-3 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xl text-[var(--accent-primary)]">
          <Wrench className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold settings-title tracking-tight">Settings</h1>
          <p className="settings-subtitle text-sm mt-0.5">Customize website preferences, display, and application behaviour</p>
        </div>
      </div>

      {/* ── Main layout: left nav + content ── */}
      <div className="flex gap-0 mt-0">
        {/* Left nav */}
        <aside className="w-52 flex-shrink-0 pt-4 pr-4">
          <nav className="space-y-0.5 sticky top-4">
            {NAV_SECTIONS.map(({ id, label, icon: Icon }) => {
              const active = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={`settings-sidebar-link w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                    active
                      ? 'settings-sidebar-link-active bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 font-semibold shadow-sm'
                      : 'border border-transparent'
                  }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  <span>{label}</span>
                  {active && <ChevronRight size={13} className="ml-auto opacity-80" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Vertical divider */}
        <div className="w-px bg-slate-800/60 flex-shrink-0 mx-2" />

        {/* Content panel */}
        <main className="flex-1 min-w-0 pt-4 pl-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              {SECTION_RENDERERS[activeSection]?.()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Sticky save bar ── */}
      <div className="settings-save-bar fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Status text */}
          <span
            className={`text-sm font-medium ${
              isDirty ? 'text-amber-400' :
              saveStatus === 'saved' ? 'text-emerald-400' :
              saveStatus === 'error' ? 'text-red-400' :
              'text-gray-500'
            }`}
          >
            {saveBarLabel()}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ActionButton
              onClick={() => setModals((m) => ({ ...m, resetDefaults: true }))}
              disabled={saving}
              variant="default"
            >
              <RotateCcw size={14} />
              Reset Defaults
            </ActionButton>

            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg ${
                isDirty && !saving
                  ? 'bg-[var(--accent-primary)] hover:opacity-90 text-white shadow-[var(--accent-primary)]/20'
                  : saveStatus === 'saved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-gray-500 border border-slate-700 cursor-not-allowed shadow-none'
              }`}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : saveStatus === 'saved' ? (
                <CheckCircle2 size={15} />
              ) : (
                <Save size={15} />
              )}
              {saveButtonLabel()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
