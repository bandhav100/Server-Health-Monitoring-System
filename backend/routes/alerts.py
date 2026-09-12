from collections import Counter
from datetime import datetime, timedelta

from flask import Blueprint, request
from sqlalchemy import func, or_

from extensions import db
from middleware.auth import jwt_required_api
from models.alert import Alert
from models.audit_log import AuditLog
from models.server import Server
from services.alert_service import AlertService
from utils.logger import logger
from utils.response import api_response


alerts_bp = Blueprint("alerts", __name__)


def _status(alert):
    return alert.status or "RESOLVED"


def _serialize(alert):
    item = alert.to_dict()
    item["status"] = _status(alert)
    item["server_name"] = alert.server.name if alert.server else str(alert.server_id)
    return item


def _query(server_id=None):
    query = Alert.query
    if server_id:
        query = query.filter(Alert.server_id == server_id)
    return query


def _active_query(server_id=None):
    return _query(server_id).filter(Alert.status.in_(["ACTIVE", "ACKNOWLEDGED"]))


def _evaluate():
    try:
        return AlertService.evaluate_all()
    except Exception as exc:
        db.session.rollback()
        logger.exception("Alert evaluation failed: %s", exc)
        return []


@alerts_bp.route("/alerts", methods=["GET"])
@jwt_required_api
def get_alerts():
    _evaluate()
    server_id = request.args.get("server_id", type=int)
    severity = request.args.get("severity")
    status = request.args.get("status")
    query = _query(server_id)
    if severity:
        query = query.filter(func.lower(Alert.severity) == severity.lower())
    if status:
        query = query.filter(Alert.status == status.upper())
    alerts = query.order_by(Alert.created_at.desc()).limit(request.args.get("limit", 100, type=int)).all()
    return api_response(True, "Alerts fetched", {"total": query.count(), "alerts": [_serialize(alert) for alert in alerts]}, 200)


@alerts_bp.route("/alerts/summary", methods=["GET"])
@jwt_required_api
def alert_summary():
    _evaluate()
    server_id = request.args.get("server_id", type=int)
    active = _active_query(server_id).all()
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    resolved_today = _query(server_id).filter(Alert.status == "RESOLVED", Alert.metric.isnot(None), Alert.resolved_at >= today).count()
    return api_response(True, "Alert summary fetched", {"active_alerts": len(active), "critical_alerts": sum(alert.severity.lower() == "critical" for alert in active), "warning_alerts": sum(alert.severity.lower() == "warning" for alert in active), "resolved_today": resolved_today, "last_updated": datetime.utcnow().isoformat() + "Z"}, 200)


@alerts_bp.route("/alerts/live", methods=["GET"])
@jwt_required_api
def live_alerts():
    _evaluate()
    server_id = request.args.get("server_id", type=int)
    alerts = _active_query(server_id).order_by(Alert.created_at.desc()).all()
    return api_response(True, "Live alerts fetched", [_serialize(alert) for alert in alerts], 200)


@alerts_bp.route("/alerts/history", methods=["GET"])
@jwt_required_api
def get_alerts_history():
    server_id = request.args.get("server_id", type=int)
    severity = request.args.get("severity")
    status = request.args.get("status")
    days = request.args.get("days", 7, type=int)
    query = _query(server_id).filter(Alert.created_at >= datetime.utcnow() - timedelta(days=days))
    if severity:
        query = query.filter(func.lower(Alert.severity) == severity.lower())
    if status:
        query = query.filter(Alert.status == status.upper())
    total = query.count()
    alerts = query.order_by(Alert.created_at.desc()).limit(request.args.get("limit", 100, type=int)).offset(request.args.get("offset", 0, type=int)).all()
    return api_response(True, "Alert history fetched", {"total": total, "alerts": [_serialize(alert) for alert in alerts]}, 200)


@alerts_bp.route("/alerts/severity-distribution", methods=["GET"])
@jwt_required_api
def severity_distribution():
    counts = Counter()
    for alert in _query(request.args.get("server_id", type=int)).all():
        counts["Resolved" if _status(alert) == "RESOLVED" else alert.severity.title()] += 1
    return api_response(True, "Severity distribution fetched", [{"name": name, "value": counts[name]} for name in ("Critical", "Warning", "Info", "Resolved")], 200)


@alerts_bp.route("/alerts/categories", methods=["GET"])
@jwt_required_api
def alert_categories():
    counts = Counter((alert.category or "System") for alert in _query(request.args.get("server_id", type=int)).all())
    return api_response(True, "Alert categories fetched", [{"category": name, "count": counts[name]} for name in ("CPU", "RAM", "Disk", "Temperature", "Network", "Prediction", "System", "Memory")], 200)


@alerts_bp.route("/alerts/top-servers", methods=["GET"])
@jwt_required_api
def top_servers():
    grouped = {}
    for alert in _query().all():
        entry = grouped.setdefault(alert.server_id, {"server_name": alert.server.name if alert.server else str(alert.server_id), "total_alerts": 0, "critical": 0, "warning": 0, "last_alert_time": alert.created_at.isoformat() + "Z"})
        entry["total_alerts"] += 1
        entry[alert.severity.lower()] = entry.get(alert.severity.lower(), 0) + 1
        if alert.created_at.isoformat() > entry["last_alert_time"]:
            entry["last_alert_time"] = alert.created_at.isoformat() + "Z"
    return api_response(True, "Top alert servers fetched", sorted(grouped.values(), key=lambda item: item["total_alerts"], reverse=True), 200)


@alerts_bp.route("/alerts/timeline", methods=["GET"])
@jwt_required_api
def alert_timeline():
    ranges = {"1h": 1, "6h": 6, "24h": 24, "7d": 168}
    hours = ranges.get(request.args.get("range", "24h"), 24)
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    buckets = {}
    for alert in _query(request.args.get("server_id", type=int)).filter(Alert.created_at >= cutoff).all():
        bucket = alert.created_at.replace(minute=0, second=0, microsecond=0).isoformat() + "Z"
        item = buckets.setdefault(bucket, {"time": bucket, "critical": 0, "warning": 0, "info": 0, "count": 0})
        severity = alert.severity.lower()
        item[severity] = item.get(severity, 0) + 1
        item["count"] += 1
    return api_response(True, "Alert timeline fetched", sorted(buckets.values(), key=lambda item: item["time"]), 200)


@alerts_bp.route("/alerts/<int:alert_id>/acknowledge", methods=["PATCH", "POST"])
@jwt_required_api
def acknowledge_alert(alert_id):
    alert = Alert.query.get_or_404(alert_id)
    alert.acknowledged = True
    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_at = datetime.utcnow()
    db.session.add(AuditLog(actor="admin", action="alert_acknowledged", details=f"Alert {alert.id} acknowledged"))
    db.session.commit()
    return api_response(True, "Alert acknowledged", _serialize(alert), 200)


@alerts_bp.route("/alerts/acknowledge-all", methods=["POST"])
@jwt_required_api
def acknowledge_all():
    body = request.get_json(silent=True) or {}
    server_id = request.args.get("server_id", type=int) or body.get("server_id")
    alerts = _active_query(server_id).all()
    now = datetime.utcnow()
    for alert in alerts:
        alert.acknowledged = True
        alert.status = "ACKNOWLEDGED"
        alert.acknowledged_at = now
    db.session.commit()
    return api_response(True, "All active alerts acknowledged", {"count": len(alerts)}, 200)


@alerts_bp.route("/alerts/<int:alert_id>/resolve", methods=["POST", "PATCH"])
@jwt_required_api
def resolve_alert(alert_id):
    alert = Alert.query.get_or_404(alert_id)
    alert.status = "RESOLVED"
    alert.resolved_at = datetime.utcnow()
    alert.acknowledged = False
    db.session.commit()
    return api_response(True, "Alert resolved", _serialize(alert), 200)


@alerts_bp.route("/alerts/clear-resolved", methods=["DELETE"])
@jwt_required_api
def clear_resolved():
    resolved = _query(request.args.get("server_id", type=int)).filter(Alert.status == "RESOLVED").count()
    return api_response(True, "Resolved alerts hidden from the active view", {"count": resolved}, 200)


@alerts_bp.route("/alerts/<int:alert_id>", methods=["DELETE"])
@jwt_required_api
def delete_alert(alert_id):
    alert = Alert.query.get_or_404(alert_id)
    db.session.delete(alert)
    db.session.commit()
    return api_response(True, "Alert deleted", None, 200)


@alerts_bp.route("/alerts/evaluate", methods=["POST"])
@jwt_required_api
def evaluate_alerts():
    created = _evaluate()
    return api_response(True, "Alerts evaluated", created, 200)
