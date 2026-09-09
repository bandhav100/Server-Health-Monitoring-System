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


def sync_prometheus_servers(app):
    """Synchronize Tailscale inventory, then enrich it with Prometheus targets."""
    with app.app_context():
        try:
            machines = sync_machines()
            db.session.commit()
        except TailscaleUnavailable as exc:
            db.session.rollback()
            logger.warning("Tailscale discovery unavailable: %s", exc)
        except Exception as exc:
            db.session.rollback()
            logger.exception("Tailscale synchronization failed: %s", exc)
            machines = []

        try:
            servers = sync_servers()
            db.session.commit()
            logger.info(
                "Scheduler: Synchronized %d Tailscale machines and %d Prometheus targets",
                len(machines),
                len(servers),
            )
        except PrometheusUnavailable as exc:
            db.session.rollback()
            logger.warning("Prometheus discovery unavailable: %s", exc)
        except Exception as exc:
            db.session.rollback()
            logger.exception("Prometheus discovery failed: %s", exc)


def fetch_prometheus_metrics(app):
    """Fetch metrics from Prometheus every 30 seconds"""
    with app.app_context():
        try:
            service = PrometheusService()
            
            for server in Server.query.all():
                if not server.prometheus_instance:
                    continue
                instance_name = server.prometheus_instance
                try:
                    instance_metrics = service.get_instance_metrics(instance_name, server.prometheus_job)
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

                receive = instance_metrics.get("networkReceive")
                send = instance_metrics.get("networkSend")
                history = MetricsHistory(
                    server_id=server.id,
                    cpu_usage=instance_metrics.get("cpuUsage"),
                    ram_usage=instance_metrics.get("ramUsage"),
                    disk_usage=instance_metrics.get("diskUsage"),
                    network_usage=instance_metrics.get("networkUsage"),
                    network_receive=receive,
                    network_send=send,
                    temperature=instance_metrics.get("temperature"),
                    uptime=instance_metrics.get("uptime"),
                )
                db.session.add(history)
                server.status = instance_metrics.get("status", "down")
            
            db.session.commit()
            logger.info("Scheduler: Fetched Prometheus metrics for %d servers", Server.query.count())
        except Exception as exc:
            logger.exception("Prometheus scheduler failed: %s", exc)


def check_alerts(app):
    """Generate alerts based on metric thresholds every 30 seconds"""
    with app.app_context():
        try:
            new_alerts = AlertService.evaluate_all()
            logger.info("Scheduler: Evaluated alerts, created %d new alerts", len(new_alerts))
        except Exception as exc:
            logger.exception("Alert scheduler failed: %s", exc)


def generate_predictions(app):
    """Generate predictions for all servers every 5 minutes"""
    with app.app_context():
        try:
            ml_service = MLService()
            servers = Server.query.all()
            
            for server in servers:
                prediction_data = ml_service.get_prediction(server.id)
                if prediction_data.get("source") == "unavailable":
                    continue
                
                # Check if recent prediction exists
                recent = Prediction.query.filter_by(server_id=server.id).order_by(
                    Prediction.created_at.desc()
                ).first()
                
                # Only create new if older than 5 minutes
                if not recent or (datetime.utcnow() - recent.created_at).total_seconds() > 300:
                    prediction = Prediction(
                        server_id=server.id,
                        cpu_forecast=prediction_data.get("cpu_forecast"),
                        ram_forecast=prediction_data.get("ram_forecast"),
                        anomaly_score=prediction_data.get("anomaly_score"),
                        health_score=prediction_data.get("health_score"),
                        source=prediction_data.get("source", "ml-service")
                    )
                    db.session.add(prediction)
            
            db.session.commit()
            logger.info("Scheduler: Generated predictions for %d servers", len(servers))
        except Exception as exc:
            logger.exception("Prediction scheduler failed: %s", exc)


def cleanup_old_data(app):
    """Clean up old metrics and logs (run once daily)"""
    with app.app_context():
        try:
            # Delete metrics older than 30 days
            cutoff_date = datetime.utcnow() - timedelta(days=30)
            old_metrics = MetricsHistory.query.filter(MetricsHistory.created_at < cutoff_date).delete()
            
            # Delete audit logs older than 90 days
            old_logs_cutoff = datetime.utcnow() - timedelta(days=90)
            old_logs = AuditLog.query.filter(AuditLog.created_at < old_logs_cutoff).delete()
            
            db.session.commit()
            logger.info("Scheduler: Cleanup - deleted %d old metrics, %d old logs", old_metrics, old_logs)
        except Exception as exc:
            logger.exception("Cleanup scheduler failed: %s", exc)


def start_scheduler(app):
    """Start the APScheduler background tasks"""
    global scheduler
    
    if scheduler is not None:
        logger.info("Scheduler already running")
        return scheduler

    try:
        scheduler = BackgroundScheduler()

        scheduler.add_job(
            lambda: sync_prometheus_servers(app),
            "interval",
            seconds=30,
            id="sync_prometheus_servers",
            name="Sync Prometheus servers",
            replace_existing=True,
        )
        
        # Run metrics fetch every 30 seconds
        scheduler.add_job(
            lambda: fetch_prometheus_metrics(app),
            "interval",
            seconds=30,
            id="fetch_metrics",
            name="Fetch Prometheus metrics",
            replace_existing=True
        )
        
        # Run alert check every 30 seconds
        scheduler.add_job(
            lambda: check_alerts(app),
            "interval",
            seconds=30,
            id="check_alerts",
            name="Check and generate alerts",
            replace_existing=True
        )
        
        # Run prediction generation every 5 minutes
        scheduler.add_job(
            lambda: generate_predictions(app),
            "interval",
            minutes=5,
            id="generate_predictions",
            name="Generate ML predictions",
            replace_existing=True
        )
        
        # Run cleanup daily at 2 AM
        scheduler.add_job(
            lambda: cleanup_old_data(app),
            "cron",
            hour=2,
            minute=0,
            id="cleanup_data",
            name="Cleanup old data",
            replace_existing=True
        )
        
        scheduler.start()
        logger.info("APScheduler started with 5 jobs")
        return scheduler
    except Exception as exc:
        logger.exception("Failed to start scheduler: %s", exc)
        return None
