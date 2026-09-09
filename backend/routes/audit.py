from flask import Blueprint, request
from datetime import datetime, timedelta
from middleware.auth import jwt_required_api
from models.audit_log import AuditLog
from extensions import db
from utils.response import api_response
from utils.logger import logger


audit_bp = Blueprint("audit", __name__)


@audit_bp.route("/audit/logs", methods=["GET"])
@jwt_required_api
def get_audit_logs():
    """Get audit logs with filtering"""
    actor = request.args.get('actor')
    action = request.args.get('action')
    days = request.args.get('days', 7, type=int)
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    cutoff_time = datetime.utcnow() - timedelta(days=days)
    query = AuditLog.query.filter(AuditLog.created_at >= cutoff_time)
    
    if actor:
        query = query.filter(AuditLog.actor.ilike(f"%{actor}%"))
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset).all()
    
    response = {
        "total": total,
        "limit": limit,
        "offset": offset,
        "logs": [log.to_dict() for log in logs]
    }
    return api_response(True, "Audit logs fetched", response, 200)


@audit_bp.route("/logs", methods=["GET"])
@jwt_required_api
def get_logs():
    """Get application logs (alias for audit logs)"""
    actor = request.args.get('actor')
    action = request.args.get('action')
    days = request.args.get('days', 7, type=int)
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    cutoff_time = datetime.utcnow() - timedelta(days=days)
    query = AuditLog.query.filter(AuditLog.created_at >= cutoff_time)
    
    if actor:
        query = query.filter(AuditLog.actor.ilike(f"%{actor}%"))
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset).all()
    
    response = {
        "total": total,
        "limit": limit,
        "offset": offset,
        "logs": [log.to_dict() for log in logs]
    }
    return api_response(True, "Logs fetched", response, 200)


@audit_bp.route("/logs/download/csv", methods=["GET"])
@jwt_required_api
def download_logs_csv():
    """Download logs as CSV"""
    days = request.args.get('days', 7, type=int)
    
    cutoff_time = datetime.utcnow() - timedelta(days=days)
    logs = AuditLog.query.filter(AuditLog.created_at >= cutoff_time).order_by(
        AuditLog.created_at.desc()
    ).all()
    
    # Generate CSV content
    csv_lines = ["ID,Actor,Action,Details,Timestamp"]
    for log in logs:
        timestamp = log.created_at.isoformat() if log.created_at else ""
        # Escape quotes in details
        details = log.details.replace('"', '""') if log.details else ""
        csv_lines.append(f'{log.id},"{log.actor or ""}","{log.action}","{details}",{timestamp}')
    
    csv_content = "\n".join(csv_lines)
    
    return api_response(True, "Logs exported as CSV", {"csv": csv_content}, 200)


@audit_bp.route("/logs/download/json", methods=["GET"])
@jwt_required_api
def download_logs_json():
    """Download logs as JSON"""
    days = request.args.get('days', 7, type=int)
    
    cutoff_time = datetime.utcnow() - timedelta(days=days)
    logs = AuditLog.query.filter(AuditLog.created_at >= cutoff_time).order_by(
        AuditLog.created_at.desc()
    ).all()
    
    return api_response(True, "Logs exported as JSON", [log.to_dict() for log in logs], 200)
