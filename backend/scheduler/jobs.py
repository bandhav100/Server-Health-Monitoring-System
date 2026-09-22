from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta

from services.prometheus_service import PrometheusService, PrometheusUnavailable
from services.prometheus_discovery_service import sync_servers
from services.tailscale_discovery_service import sync_machines, TailscaleUnavailable
from services.alert_service import AlertService
from services.ml_service import MLService

from models.server import Server
from models.metrics_history import MetricsHistory
from models.prediction import Prediction
from models.audit_log import AuditLog

from extensions import db
from utils.logger import logger

scheduler = None


# ------------------------------------------------------------
# Sync Tailscale + Prometheus Servers
# ------------------------------------------------------------
def sync_prometheus_servers(app):
    """Synchronize Tailscale inventory and Prometheus targets."""

    with app.app_context():

        # ✅ FIX: Always initialize these variables
        machines = []
        servers = []

        # ---------- Tailscale ----------
        try:
            machines = sync_machines() or []
            db.session.commit()

        except TailscaleUnavailable as exc:
            db.session.rollback()
            machines = []
            logger.warning("Tailscale discovery unavailable: %s", exc)

        except Exception as exc:
            db.session.rollback()
            machines = []
            logger.exception("Tailscale synchronization failed: %s", exc)

        # ---------- Prometheus ----------
        try:
            servers = sync_servers() or []
            db.session.commit()

        except PrometheusUnavailable as exc:
            db.session.rollback()
            servers = []
            logger.warning("Prometheus discovery unavailable: %s", exc)

        except Exception as exc:
            db.session.rollback()
            servers = []
            logger.exception("Prometheus discovery failed: %s", exc)

        # ✅ Safe logging (never crashes)
        logger.info(
            "Scheduler: Synchronized %d Tailscale machines and %d Prometheus targets",
            len(machines),
            len(servers),
        )


# ------------------------------------------------------------
# Fetch Metrics
# ------------------------------------------------------------
def fetch_prometheus_metrics(app):
    """Fetch metrics from Prometheus every 30 seconds."""

    with app.app_context():
        try:
            service = PrometheusService()

            servers = Server.query.all()

            for server in servers:

                if not server.prometheus_instance:
                    continue

                try:
                    metrics = service.get_instance_metrics(
                        server.prometheus_instance,
                        server.prometheus_job,
                    )

                except PrometheusUnavailable:
                    server.status = "offline"
                    continue

                interval_start = datetime.utcnow() - timedelta(seconds=30)

                duplicate = MetricsHistory.query.filter(
                    MetricsHistory.server_id == server.id,
                    MetricsHistory.created_at >= interval_start,
                ).first()

                if duplicate:
                    continue

                history = MetricsHistory(
                    server_id=server.id,
                    cpu_usage=metrics.get("cpuUsage"),
                    ram_usage=metrics.get("ramUsage"),
                    disk_usage=metrics.get("diskUsage"),
                    network_usage=metrics.get("networkUsage"),
                    network_receive=metrics.get("networkReceive"),
                    network_send=metrics.get("networkSend"),
                    temperature=metrics.get("cpuTemperature")
                    or metrics.get("temperature"),
                    uptime=metrics.get("uptime"),
                )

                db.session.add(history)
                server.status = metrics.get("status", "offline")

            db.session.commit()

            logger.info(
                "Scheduler: Fetched Prometheus metrics for %d servers",
                len(servers),
            )

        except Exception as exc:
            db.session.rollback()
            logger.exception("Prometheus scheduler failed: %s", exc)


# ------------------------------------------------------------
# Alerts
# ------------------------------------------------------------
def check_alerts(app):
    """Generate alerts every 30 seconds."""

    with app.app_context():
        try:
            alerts = AlertService.evaluate_all()

            logger.info(
                "Scheduler: Evaluated alerts, created %d new alerts",
                len(alerts),
            )

        except Exception as exc:
            logger.exception("Alert scheduler failed: %s", exc)


# ------------------------------------------------------------
# ML Predictions
# ------------------------------------------------------------
def generate_predictions(app):
    """Generate predictions every 5 minutes."""

    with app.app_context():
        try:
            ml_service = MLService()
            servers = Server.query.all()

            for server in servers:

                prediction_data = ml_service.get_prediction(server.id)

                if prediction_data.get("source") == "unavailable":
                    continue

                recent = (
                    Prediction.query.filter_by(server_id=server.id)
                    .order_by(Prediction.created_at.desc())
                    .first()
                )

                if (
                    not recent
                    or (datetime.utcnow() - recent.created_at).total_seconds()
                    > 300
                ):

                    prediction = Prediction(
                        server_id=server.id,
                        cpu_forecast=prediction_data.get("cpu_forecast"),
                        ram_forecast=prediction_data.get("ram_forecast"),
                        anomaly_score=prediction_data.get("anomaly_score"),
                        health_score=prediction_data.get("health_score"),
                        source=prediction_data.get("source", "ml-service"),
                    )

                    db.session.add(prediction)

            db.session.commit()

            logger.info(
                "Scheduler: Generated predictions for %d servers",
                len(servers),
            )

        except Exception as exc:
            db.session.rollback()
            logger.exception("Prediction scheduler failed: %s", exc)


# ------------------------------------------------------------
# Cleanup
# ------------------------------------------------------------
def cleanup_old_data(app):
    """Cleanup metrics and audit logs daily."""

    with app.app_context():
        try:
            from models.settings import Setting

            retention_days = int(
                Setting.get_value("history_retention_days", 30)
            )

            log_retention_days = 90

            cutoff = datetime.utcnow() - timedelta(days=retention_days)

            metrics_deleted = MetricsHistory.query.filter(
                MetricsHistory.created_at < cutoff
            ).delete()

            logs_deleted = AuditLog.query.filter(
                AuditLog.created_at
                < datetime.utcnow() - timedelta(days=log_retention_days)
            ).delete()

            db.session.commit()

            logger.info(
                "Scheduler: Cleanup - deleted %d metrics and %d audit logs",
                metrics_deleted,
                logs_deleted,
            )

        except Exception as exc:
            db.session.rollback()
            logger.exception("Cleanup scheduler failed: %s", exc)


# ------------------------------------------------------------
# Start Scheduler
# ------------------------------------------------------------
def start_scheduler(app):
    """Start APScheduler jobs."""

    global scheduler

    if scheduler:
        logger.info("Scheduler already running")
        return scheduler

    try:
        scheduler = BackgroundScheduler()

        scheduler.add_job(
            lambda: sync_prometheus_servers(app),
            "interval",
            seconds=30,
            id="sync_prometheus_servers",
            replace_existing=True,
        )

        scheduler.add_job(
            lambda: fetch_prometheus_metrics(app),
            "interval",
            seconds=30,
            id="fetch_metrics",
            replace_existing=True,
        )

        scheduler.add_job(
            lambda: check_alerts(app),
            "interval",
            seconds=30,
            id="check_alerts",
            replace_existing=True,
        )

        scheduler.add_job(
            lambda: generate_predictions(app),
            "interval",
            minutes=5,
            id="generate_predictions",
            replace_existing=True,
        )

        scheduler.add_job(
            lambda: cleanup_old_data(app),
            "cron",
            hour=2,
            minute=0,
            id="cleanup_data",
            replace_existing=True,
        )

        scheduler.start()
        logger.info("APScheduler started successfully.")

        return scheduler

    except Exception as exc:
        logger.exception("Failed to start scheduler: %s", exc)
        return None