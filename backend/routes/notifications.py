from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from extensions import db
from middleware.auth import jwt_required_api
from models.notification import Notification
from models.admin import Admin
from models.audit_log import AuditLog
from utils.response import api_response
from utils.logger import logger
from datetime import datetime


notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/notifications", methods=["GET"])
@jwt_required_api
def get_notifications():
    """Get notifications for current admin"""
    identity = get_jwt_identity()
    admin_id = int(identity)
    
    unread_only = request.args.get('unread', 'false').lower() == 'true'
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    query = Notification.query.filter_by(admin_id=admin_id)
    
    if unread_only:
        query = query.filter_by(is_read=False)
    
    total = query.count()
    unread_count = Notification.query.filter_by(admin_id=admin_id, is_read=False).count()
    
    notifications = query.order_by(Notification.created_at.desc()).limit(limit).offset(offset).all()
    
    response = {
        "total": total,
        "unread_count": unread_count,
        "limit": limit,
        "offset": offset,
        "notifications": [n.to_dict() for n in notifications]
    }
    return api_response(True, "Notifications fetched", response, 200)


@notifications_bp.route("/notifications/<int:notification_id>/read", methods=["PATCH", "POST"])
@jwt_required_api
def mark_as_read(notification_id):
    """Mark a notification as read"""
    identity = get_jwt_identity()
    admin_id = int(identity)
    
    notification = Notification.query.get_or_404(notification_id)
    
    # Verify ownership
    if notification.admin_id != admin_id:
        return api_response(False, "Unauthorized", None, 403)
    
    notification.is_read = True
    db.session.commit()
    
    logger.info("Notification marked as read: %s", notification_id)
    return api_response(True, "Notification marked as read", notification.to_dict(), 200)


@notifications_bp.route("/notifications/read-all", methods=["PATCH", "POST"])
@jwt_required_api
def mark_all_as_read():
    """Mark all notifications as read"""
    identity = get_jwt_identity()
    admin_id = int(identity)
    
    count = Notification.query.filter_by(admin_id=admin_id, is_read=False).update(
        {"is_read": True}
    )
    db.session.commit()
    
    logger.info("Marked %d notifications as read for admin %s", count, admin_id)
    return api_response(True, "All notifications marked as read", {"count": count}, 200)


@notifications_bp.route("/notifications/<int:notification_id>", methods=["DELETE"])
@jwt_required_api
def delete_notification(notification_id):
    """Delete a notification"""
    identity = get_jwt_identity()
    admin_id = int(identity)
    
    notification = Notification.query.get_or_404(notification_id)
    
    # Verify ownership
    if notification.admin_id != admin_id:
        return api_response(False, "Unauthorized", None, 403)
    
    db.session.delete(notification)
    db.session.commit()
    
    logger.info("Notification deleted: %s", notification_id)
    return api_response(True, "Notification deleted", None, 200)
