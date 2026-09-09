from datetime import datetime, timedelta
from flask import Blueprint, request
from extensions import db
from middleware.auth import jwt_required_api
from models.alert import Alert
from models.server import Server
from models.audit_log import AuditLog
from services.alert_service import AlertService
from utils.response import api_response
from utils.logger import logger
from services.prometheus_service import PrometheusService


alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/alerts", methods=["GET"])
@jwt_required_api
def get_alerts():
    """Get all alerts with optional filtering"""
    severity = request.args.get('severity')
    acknowledged = request.args.get('acknowledged')
    server_id = request.args.get('server_id', type=int)
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    prometheus_alerts = PrometheusService().alert_rules()
    if severity:
        prometheus_alerts = [alert for alert in prometheus_alerts if alert["severity"] == severity]
    if server_id:
        server = Server.query.get(server_id)
        instance = server.prometheus_instance if server else None
        prometheus_alerts = [alert for alert in prometheus_alerts if alert.get("instance") == instance]
    return api_response(True, "Alerts fetched", {
        "total": len(prometheus_alerts),
        "limit": limit,
        "offset": offset,
        "alerts": prometheus_alerts[offset:offset + limit],
    }, 200)

@alerts_bp.route("/alerts/history", methods=["GET"])
@jwt_required_api
def get_alerts_history():
    """Get historical alerts"""
    days = request.args.get('days', 7, type=int)
    limit = request.args.get('limit', 100, type=int)
    
    cutoff_time = datetime.utcnow() - timedelta(days=days)
    alerts = Alert.query.filter(
        Alert.created_at >= cutoff_time
    ).order_by(Alert.created_at.desc()).limit(limit).all()
    
    return api_response(True, "Alert history fetched", [alert.to_dict() for alert in alerts], 200)


@alerts_bp.route("/alerts/<int:alert_id>/acknowledge", methods=["PATCH", "POST"])
@jwt_required_api
def acknowledge_alert(alert_id):
    """Acknowledge an alert"""
    alert = Alert.query.get_or_404(alert_id)
    alert.acknowledged = True
    
    log = AuditLog(
        actor="admin",
        action="alert_acknowledged",
        details=f"Alert {alert.id} ({alert.title}) acknowledged"
    )
    db.session.add(log)
    db.session.commit()
    
    logger.info("Alert acknowledged: %s", alert.id)
    return api_response(True, "Alert acknowledged", alert.to_dict(), 200)


@alerts_bp.route("/alerts/<int:alert_id>", methods=["DELETE"])
@jwt_required_api
def delete_alert(alert_id):
    """Delete an alert"""
    alert = Alert.query.get_or_404(alert_id)
    
    alert_info = alert.to_dict()
    db.session.delete(alert)
    
    log = AuditLog(
        actor="admin",
        action="alert_deleted",
        details=f"Alert {alert_id} ({alert_info['title']}) deleted"
    )
    db.session.add(log)
    db.session.commit()
    
    logger.info("Alert deleted: %s", alert_id)
    return api_response(True, "Alert deleted", None, 200)


@alerts_bp.route("/alerts/evaluate", methods=["POST"])
@jwt_required_api
def evaluate_alerts():
    """Manually trigger alert evaluation"""
    new_alerts = AlertService.evaluate_all()
    logger.info("Manual alert evaluation triggered, created %d new alerts", len(new_alerts))
    return api_response(True, "Alerts evaluated", new_alerts, 200)
