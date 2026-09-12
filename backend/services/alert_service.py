from datetime import datetime

from extensions import db
from models.admin import Admin
from models.alert import Alert
from models.metrics_history import MetricsHistory
from models.notification import Notification
from models.prediction import Prediction
from models.server import Server
from models.settings import Setting
from services.prometheus_service import PrometheusService, PrometheusUnavailable
from utils.logger import logger


class AlertService:
    @staticmethod
    def _number(value):
        try:
            return float(value) if value is not None else None
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _get_thresholds():
        """Read all metric thresholds from the settings table with hardcoded fallbacks."""
        g = Setting.get_value
        return {
            "CPU Usage":        (g("cpu_threshold", 80),           g("cpu_threshold_critical", 90)),
            "RAM Usage":        (g("ram_threshold", 80),           g("ram_threshold_critical", 90)),
            "Disk Usage":       (g("disk_threshold", 85),          g("disk_threshold_critical", 95)),
            "CPU Temperature":  (g("temperature_threshold", 80),   g("temperature_threshold_critical", 90)),
            "SSD Temperature":  (g("ssd_temperature_threshold", 65),g("ssd_temperature_threshold_critical", 75)),
            "Network Incoming": (g("network_threshold", 75),       g("network_threshold_critical", 150)),
            "Network Outgoing": (g("network_threshold", 75),       g("network_threshold_critical", 150)),
            "Memory Pressure":  (g("memory_pressure_threshold", 80),g("memory_pressure_threshold_critical", 90)),
        }

    @staticmethod
    def _notifications_allowed(severity):
        """Return True if notifications of the given severity are currently enabled in settings."""
        if str(Setting.get_value("notifications_enabled", "true")).lower() != "true":
            return False
        severity_lower = (severity or "").lower()
        if severity_lower == "critical":
            return str(Setting.get_value("critical_notifications_enabled", "true")).lower() == "true"
        if severity_lower == "warning":
            return str(Setting.get_value("warning_notifications_enabled", "true")).lower() == "true"
        # info or anything else
        return str(Setting.get_value("info_notifications_enabled", "true")).lower() == "true"

    @staticmethod
    def evaluate_server(server):
        latest = MetricsHistory.query.filter_by(server_id=server.id).order_by(MetricsHistory.created_at.desc()).first()
        if not latest:
            return []
        try:
            live = PrometheusService().get_instance_metrics(server.prometheus_instance, server.prometheus_job)
        except PrometheusUnavailable:
            live = {}
        values = {
            "CPU Usage":        live.get("cpuUsage", latest.cpu_usage),
            "RAM Usage":        live.get("ramUsage", latest.ram_usage),
            "Disk Usage":       live.get("diskUsage", latest.disk_usage),
            "Network Incoming": live.get("networkReceive", latest.network_receive),
            "Network Outgoing": live.get("networkSend", latest.network_send),
            "CPU Temperature":  live.get("cpuTemperature", latest.temperature),
            "SSD Temperature":  live.get("ssdTemperature"),
            "Memory Pressure":  live.get("commitPressure", latest.ram_usage),
        }
        thresholds = AlertService._get_thresholds()
        alerts = []
        for metric, (warning, critical) in thresholds.items():
            value = AlertService._number(values.get(metric))
            if value is None:
                continue
            severity = "Critical" if value > critical else "Warning" if value > warning else None
            if not severity:
                continue
            unit = " C" if "Temperature" in metric else " MB/s" if "Network" in metric else "%"
            threshold = critical if severity == "Critical" else warning
            category = "Network" if "Network" in metric else "System" if "Temperature" in metric else "Memory" if metric in {"RAM Usage", "Memory Pressure"} else metric.split()[0]
            alerts.append({
                "metric": metric,
                "category": category,
                "severity": severity,
                "current_value": round(value, 2),
                "threshold_value": threshold,
                "title": f"{server.name} {metric} {severity}",
                "description": f"{metric} is {value:.2f}{unit}, above the {threshold}{unit} threshold",
            })

        prediction = Prediction.query.filter_by(server_id=server.id).order_by(Prediction.created_at.desc()).first()
        if prediction:
            pred_warn_cpu, pred_crit_cpu = AlertService._get_thresholds()["CPU Usage"]
            pred_warn_ram, pred_crit_ram = AlertService._get_thresholds()["RAM Usage"]
            pred_warn_disk, pred_crit_disk = AlertService._get_thresholds()["Disk Usage"]
            for metric, value, warning, critical in (
                ("Predicted CPU",  prediction.cpu_forecast,    pred_warn_cpu,  pred_crit_cpu),
                ("Predicted RAM",  prediction.ram_forecast,    pred_warn_ram,  pred_crit_ram),
                ("Predicted Disk", prediction.predicted_disk,  pred_warn_disk, pred_crit_disk),
            ):
                value = AlertService._number(value)
                if value is not None and value > warning:
                    alerts.append({
                        "metric": metric,
                        "category": "Prediction",
                        "severity": "Critical" if value > critical else "Warning",
                        "current_value": round(value, 2),
                        "threshold_value": critical if value > critical else warning,
                        "title": f"{server.name} {metric} threshold forecast",
                        "description": f"{metric} is forecast to reach {value:.2f}% within six hours",
                    })
        if server.status == "offline":
            alerts.append({
                "metric": "System Status",
                "category": "System",
                "severity": "Critical",
                "current_value": 0,
                "threshold_value": 1,
                "title": f"{server.name} Unreachable",
                "description": f"{server.name} is unreachable or offline.",
            })
        return alerts

    @staticmethod
    def evaluate_all():
        created = []
        legacy_alerts = Alert.query.filter(Alert.status.is_(None)).all()
        for legacy in legacy_alerts:
            legacy.status = "RESOLVED"
            legacy.resolved_at = legacy.resolved_at or datetime.utcnow()
        for server in Server.query.all():
            active_keys = set()
            for item in AlertService.evaluate_server(server):
                key = (server.id, item["metric"], item["category"])
                active_keys.add(key)
                existing = Alert.query.filter_by(
                    server_id=server.id, metric=item["metric"], category=item["category"]
                ).filter(Alert.status.in_(["ACTIVE", "ACKNOWLEDGED"])).first()
                if existing:
                    # Update live values but do NOT create another notification
                    existing.severity = item["severity"]
                    existing.current_value = item["current_value"]
                    existing.threshold_value = item["threshold_value"]
                    existing.title = item["title"]
                    existing.description = item["description"]
                    continue
                # New alert — persist it
                alert = Alert(
                    server_id=server.id,
                    severity=item["severity"],
                    title=item["title"],
                    description=item["description"],
                    metric=item["metric"],
                    category=item["category"],
                    current_value=item["current_value"],
                    threshold_value=item["threshold_value"],
                    status="ACTIVE",
                )
                db.session.add(alert)
                db.session.flush()
                # Create notifications only if settings allow it for this severity
                if AlertService._notifications_allowed(item["severity"]):
                    for admin in Admin.query.filter_by(is_active=True).all():
                        db.session.add(Notification(
                            admin_id=admin.id,
                            title=item["title"],
                            message=item["description"],
                            notification_type=item["severity"].lower(),
                            related_entity_type="alert",
                            related_entity_id=alert.id,
                        ))
                created.append(alert.to_dict())
                logger.info("Alert created for server_id=%s title=%s", server.id, item["title"])
            open_alerts = Alert.query.filter(
                Alert.server_id == server.id,
                Alert.status.in_(["ACTIVE", "ACKNOWLEDGED"])
            ).all()
            for alert in open_alerts:
                if (server.id, alert.metric, alert.category) not in active_keys:
                    alert.status = "RESOLVED"
                    alert.resolved_at = datetime.utcnow()
                    alert.acknowledged = False
        db.session.commit()
        return created
