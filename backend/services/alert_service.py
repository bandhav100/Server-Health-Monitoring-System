from datetime import datetime, timedelta
from models.alert import Alert
from models.server import Server
from models.metrics_history import MetricsHistory
from models.settings import Setting
from models.notification import Notification
from models.admin import Admin
from extensions import db
from utils.logger import logger


class AlertService:
    @staticmethod
    def get_thresholds():
        return {
            "cpu": float(Setting.get_value("cpu_threshold", 85)),
            "ram": float(Setting.get_value("ram_threshold", 90)),
            "disk": float(Setting.get_value("disk_threshold", 95)),
        }

    @staticmethod
    def evaluate_server(server):
        latest = MetricsHistory.query.filter_by(server_id=server.id).order_by(MetricsHistory.created_at.desc()).first()
        if not latest:
            return []

        thresholds = AlertService.get_thresholds()
        alerts = []
        if latest.cpu_usage > thresholds["cpu"]:
            alerts.append({
                "title": f"{server.name} CPU Usage Above {thresholds['cpu']}%",
                "severity": "critical",
                "description": f"{server.name} CPU usage exceeded {thresholds['cpu']}%",
                "threshold_value": thresholds["cpu"],
            })
        if latest.ram_usage > thresholds["ram"]:
            alerts.append({
                "title": f"{server.name} RAM Usage Above {thresholds['ram']}%",
                "severity": "warning",
                "description": f"{server.name} RAM usage exceeded {thresholds['ram']}%",
                "threshold_value": thresholds["ram"],
            })
        if latest.disk_usage > thresholds["disk"]:
            alerts.append({
                "title": f"{server.name} Disk Space Critical",
                "severity": "critical",
                "description": f"{server.name} disk usage exceeded {thresholds['disk']}%",
                "threshold_value": thresholds["disk"],
            })
        if server.status == "offline":
            alerts.append({
                "title": f"{server.name} Unreachable",
                "severity": "critical",
                "description": f"{server.name} is unreachable or offline.",
                "threshold_value": 0,
            })
        return alerts

    @staticmethod
    def evaluate_all():
        created = []
        for server in Server.query.all():
            for item in AlertService.evaluate_server(server):
                cooldown = datetime.utcnow() - timedelta(minutes=10)
                existing = Alert.query.filter(
                    Alert.server_id == server.id,
                    Alert.title == item["title"],
                    Alert.created_at >= cooldown,
                ).first()
                if not existing:
                    alert = Alert(
                        server_id=server.id,
                        severity=item["severity"],
                        title=item["title"],
                        description=item["description"],
                        threshold_value=item["threshold_value"],
                    )
                    db.session.add(alert)
                    db.session.flush()
                    for admin in Admin.query.filter_by(is_active=True).all():
                        db.session.add(Notification(
                            admin_id=admin.id,
                            title=item["title"],
                            message=item["description"],
                            notification_type=item["severity"],
                            related_entity_type="alert",
                            related_entity_id=alert.id,
                        ))
                    created.append(alert.to_dict())
                    logger.info("Alert created for server_id=%s title=%s", server.id, item["title"])
        db.session.commit()
        return created
