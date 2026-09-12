from extensions import db
from models.base import AuditMixin

# All default settings definitions in one place – used by seed_defaults and restore_defaults.
_DEFAULTS = [
    # Monitoring thresholds (kept in DB for alert evaluation, not displayed on app settings UI)
    ("cpu_threshold",                      "80",              "thresholds",    "CPU usage warning threshold (%)"),
    ("cpu_threshold_critical",             "90",              "thresholds",    "CPU usage critical threshold (%)"),
    ("ram_threshold",                      "80",              "thresholds",    "RAM usage warning threshold (%)"),
    ("ram_threshold_critical",             "90",              "thresholds",    "RAM usage critical threshold (%)"),
    ("disk_threshold",                     "85",              "thresholds",    "Disk usage warning threshold (%)"),
    ("disk_threshold_critical",            "95",              "thresholds",    "Disk usage critical threshold (%)"),
    ("temperature_threshold",              "80",              "thresholds",    "CPU temperature warning threshold (°C)"),
    ("temperature_threshold_critical",     "90",              "thresholds",    "CPU temperature critical threshold (°C)"),
    ("ssd_temperature_threshold",          "65",              "thresholds",    "SSD temperature warning threshold (°C)"),
    ("ssd_temperature_threshold_critical", "75",              "thresholds",    "SSD temperature critical threshold (°C)"),
    ("network_threshold",                  "75",              "thresholds",    "Network usage warning threshold (MB/s)"),
    ("network_threshold_critical",         "150",             "thresholds",    "Network usage critical threshold (MB/s)"),
    ("memory_pressure_threshold",          "80",              "thresholds",    "Memory pressure warning threshold (%)"),
    ("memory_pressure_threshold_critical", "90",              "thresholds",    "Memory pressure critical threshold (%)"),
    # Section 1: Appearance
    ("theme",                              "dark",            "appearance",    "UI theme (dark / light / system)"),
    ("sidebar_layout",                     "expanded",        "appearance",    "Navigation sidebar layout (expanded / collapsed)"),
    ("compact_mode",                       "false",           "appearance",    "Enable compact dashboard mode"),
    ("chart_animations",                   "true",            "appearance",    "Enable chart animations"),
    # Section 2: Dashboard Preferences
    ("default_page",                       "/servers",        "dashboard",     "Default landing page"),
    ("default_server",                     "all",             "dashboard",     "Default selected server"),
    ("refresh_interval",                   "5",               "dashboard",     "Frontend auto refresh interval (seconds)"),
    # Section 3: Notifications
    ("notifications_enabled",              "true",            "notifications", "Enable notifications globally"),
    ("notification_sound",                 "false",           "notifications", "Play sound for incoming notifications"),
    ("desktop_notifications",              "false",           "notifications", "Enable desktop notifications"),
    ("notification_frequency",             "instant",         "notifications", "Notification delivery frequency"),
    ("show_unread_badge",                  "true",            "notifications", "Show unread notification badge on navbar"),
    ("critical_notifications_enabled",     "true",            "notifications", "Enable critical severity notifications"),
    ("warning_notifications_enabled",      "true",            "notifications", "Enable warning severity notifications"),
    ("info_notifications_enabled",         "true",            "notifications", "Enable info severity notifications"),
    # Section 4: Date & Time
    ("time_format",                        "24h",             "datetime",      "Time display format (12h / 24h)"),
    ("timezone",                           "auto",            "datetime",      "Timezone (auto / manual)"),
    ("date_format",                        "YYYY-MM-DD",      "datetime",      "Date display format"),
    # Section 5: User Experience / General
    ("language",                           "en",              "general",       "Application language"),
    ("confirm_destructive",                "true",            "general",       "Confirm before destructive actions"),
    ("show_success_toasts",                "true",            "ux",            "Show success toast notifications"),
    ("show_error_toasts",                  "true",            "ux",            "Show error toast notifications"),
    ("remember_last_page",                 "true",            "general",       "Remember last open page across sessions"),
    # Section 6: Session / Privacy
    ("session_timeout",                    "1h",              "session",       "Session inactivity timeout"),
    ("auto_logout",                        "true",            "session",       "Auto logout upon session timeout"),
    ("remember_preferences",               "true",            "session",       "Persist local browser preferences"),
    # Section: Appearance extras
    ("accent_color",                       "purple",          "appearance",    "UI accent color"),
    # Section: Dashboard extras
    ("remember_selected_server",           "false",           "dashboard",     "Remember selected server across sessions"),
    ("show_kpi_cards",                     "true",            "dashboard",     "Show KPI summary cards on dashboard"),
    # Section: Notifications extras
    ("notification_preview",               "true",            "notifications", "Show notification preview text"),
    # Section: Date & Time extras
    ("timestamp_display",                  "relative",        "datetime",      "Timestamp display style (relative / exact)"),
    # Section: Accessibility
    ("reduce_motion",                      "false",           "accessibility", "Reduce non-essential UI animations"),
    ("high_contrast",                      "false",           "accessibility", "Enable high contrast mode"),
    ("larger_text",                        "false",           "accessibility", "Increase base font size"),
    ("focus_indicators",                   "false",           "accessibility", "Show enhanced focus indicators"),
    # Backend retention & prediction (backend-only)
    ("history_retention_days",             "30",              "data",          "Metrics history retention period (days)"),
    ("prediction_horizon",                 "6",               "prediction",    "Prediction horizon in hours"),
    ("prediction_refresh_interval",        "300",             "prediction",    "Prediction refresh interval (seconds)"),
    ("anomaly_detection_enabled",          "true",            "anomaly",       "Enable anomaly detection"),
    ("anomaly_sensitivity",                "0.8",             "anomaly",       "Anomaly detection sensitivity (0.0–1.0)"),
]


class Setting(db.Model, AuditMixin):
    __tablename__ = "settings"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(120), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=False, default="")
    description = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(80), default="system")

    def to_dict(self):
        return {
            "id": self.id,
            "key": self.key,
            "value": self.value,
            "description": self.description,
            "category": self.category,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @staticmethod
    def get_value(key, default=None):
        setting = Setting.query.filter_by(key=key).first()
        if not setting:
            return default
        try:
            return float(setting.value)
        except (TypeError, ValueError):
            return setting.value if setting.value not in (None, "") else default

    @staticmethod
    def set_value(key, value, description=None, category="system"):
        setting = Setting.query.filter_by(key=key).first()
        if setting is None:
            setting = Setting(key=key, value=str(value), description=description, category=category)
            db.session.add(setting)
        else:
            setting.value = str(value)
            if description is not None:
                setting.description = description
            setting.category = category
        db.session.commit()
        return setting

    @staticmethod
    def seed_defaults():
        """Insert any missing settings with their default values.
        Existing settings are left unchanged (safe to call at startup).
        """
        for key, value, category, description in _DEFAULTS:
            if Setting.query.filter_by(key=key).first() is None:
                db.session.add(Setting(key=key, value=value, category=category, description=description))
        db.session.commit()

    @staticmethod
    def restore_defaults():
        """Overwrite ALL settings with defaults (used by POST /settings/reset)."""
        for key, value, category, description in _DEFAULTS:
            existing = Setting.query.filter_by(key=key).first()
            if existing is None:
                db.session.add(Setting(key=key, value=value, category=category, description=description))
            else:
                existing.value = value
                existing.category = category
                existing.description = description
        db.session.commit()
