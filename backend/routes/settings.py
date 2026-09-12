from flask import Blueprint, request
from datetime import datetime
from extensions import db
from middleware.auth import jwt_required_api
from models.settings import Setting
from models.audit_log import AuditLog
from utils.response import api_response
from utils.logger import logger


settings_bp = Blueprint("settings", __name__)


@settings_bp.route("/settings", methods=["GET"])
@jwt_required_api
def get_settings():
    """Get all settings"""
    category = request.args.get('category')
    
    query = Setting.query
    if category:
        query = query.filter_by(category=category)
    
    settings = query.order_by(Setting.key.asc()).all()
    
    # Group by category if requested
    if request.args.get('grouped', 'false').lower() == 'true':
        grouped = {}
        for setting in settings:
            cat = setting.category or "system"
            if cat not in grouped:
                grouped[cat] = []
            grouped[cat].append(setting.to_dict())
        return api_response(True, "Settings fetched", grouped, 200)
    
    return api_response(True, "Settings fetched", [s.to_dict() for s in settings], 200)


@settings_bp.route("/settings", methods=["PUT", "POST"])
@jwt_required_api
def create_or_update_setting():
    """Create or update setting(s). Supports single setting or bulk updates."""
    data = request.get_json(silent=True)
    if data is None:
        return api_response(False, "Request body is required", None, 400)
    
    # Check if bulk array is provided
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict) and "settings" in data:
        items = data["settings"]
        if isinstance(items, dict):
            items = [{"key": k, "value": str(v)} for k, v in items.items()]
    elif isinstance(data, dict) and "key" not in data:
        # Dictionary of key -> value
        items = [{"key": k, "value": str(v)} for k, v in data.items()]
    else:
        items = None

    if items is not None:
        saved = []
        for item in items:
            if not isinstance(item, dict):
                continue
            k = item.get("key")
            v = item.get("value")
            if k is None or v is None:
                continue
            k_str = str(k).strip()
            v_str = str(v) if not isinstance(v, str) else v
            if len(k_str) > 120 or len(v_str) > 5000:
                continue
            cat = item.get("category") or "general"
            desc = item.get("description")
            s = Setting.set_value(k_str, v_str, description=desc, category=cat)
            saved.append(s.to_dict())

        db.session.add(AuditLog(actor="admin", action="settings_bulk_updated", details=f"Bulk updated {len(saved)} settings"))
        db.session.commit()
        logger.info("Bulk updated %d settings", len(saved))
        return api_response(True, "Settings updated", saved, 200)

    # Single setting update
    key = data.get("key")
    value = data.get("value")
    description = data.get("description")
    category = data.get("category", "system")
    
    # Validation
    if not key or not isinstance(key, str) or len(key) > 120:
        return api_response(False, "Invalid or missing setting key", None, 400)
    if value is None:
        return api_response(False, "Setting value is required", None, 400)
    
    value_str = str(value) if not isinstance(value, str) else value
    if len(value_str) > 5000:
        return api_response(False, "Invalid setting value", None, 400)
    if description and len(description) > 255:
        return api_response(False, "Description too long", None, 400)
    if category and len(category) > 80:
        return api_response(False, "Category name too long", None, 400)
    
    existing = Setting.query.filter_by(key=key).first()
    is_new = existing is None
    
    setting = Setting.set_value(
        key,
        value_str,
        description=description,
        category=category,
    )
    
    log = AuditLog(
        actor="admin",
        action="setting_created" if is_new else "setting_updated",
        details=f"Setting {key} {'created' if is_new else 'updated'}"
    )
    db.session.add(log)
    db.session.commit()
    
    logger.info("Setting %s: %s", "created" if is_new else "updated", key)
    return api_response(True, "Setting saved", setting.to_dict(), 201 if is_new else 200)


@settings_bp.route("/settings/<string:key>", methods=["GET"])
@jwt_required_api
def get_setting(key):
    """Get a specific setting"""
    setting = Setting.query.filter_by(key=key).first()
    
    if not setting:
        return api_response(False, "Setting not found", None, 404)
    
    return api_response(True, "Setting fetched", setting.to_dict(), 200)


@settings_bp.route("/settings/<string:key>", methods=["DELETE"])
@jwt_required_api
def delete_setting(key):
    """Delete a setting"""
    setting = Setting.query.filter_by(key=key).first()
    
    if not setting:
        return api_response(False, "Setting not found", None, 404)
    
    db.session.delete(setting)
    
    log = AuditLog(
        actor="admin",
        action="setting_deleted",
        details=f"Setting {key} deleted"
    )
    db.session.add(log)
    db.session.commit()
    
    logger.info("Setting deleted: %s", key)
    return api_response(True, "Setting deleted", None, 200)


@settings_bp.route("/settings/reset", methods=["POST"])
@jwt_required_api
def reset_settings():
    """Restore all settings to factory defaults."""
    try:
        Setting.restore_defaults()
        db.session.add(AuditLog(actor="admin", action="settings_reset", details="Settings restored to defaults"))
        db.session.commit()
        settings = Setting.query.order_by(Setting.key.asc()).all()
        logger.info("Settings reset to defaults")
        return api_response(True, "Settings restored to defaults", [s.to_dict() for s in settings], 200)
    except Exception as exc:
        db.session.rollback()
        logger.exception("Settings reset failed: %s", exc)
        return api_response(False, "Failed to reset settings", None, 500)


@settings_bp.route("/settings/test-notification", methods=["POST"])
@jwt_required_api
def test_notification():
    """Create a test notification for the currently authenticated admin."""
    from flask_jwt_extended import get_jwt_identity
    from models.notification import Notification
    from models.settings import Setting as S

    # Check notifications_enabled
    if str(S.get_value("notifications_enabled", "true")).lower() != "true":
        return api_response(False, "Notifications are currently disabled in settings", None, 400)

    try:
        identity = get_jwt_identity()
        admin_id = int(identity)
        notification = Notification(
            admin_id=admin_id,
            title="Test Notification",
            message="This is a test notification from SHMS Settings. Notifications are working correctly.",
            notification_type="info",
            related_entity_type="system",
            related_entity_id=None,
        )
        db.session.add(notification)
        db.session.add(AuditLog(actor="admin", action="test_notification_sent", details="Test notification created"))
        db.session.commit()
        logger.info("Test notification created for admin_id=%s", admin_id)
        return api_response(True, "Test notification sent", notification.to_dict(), 201)
    except Exception as exc:
        db.session.rollback()
        logger.exception("Test notification failed: %s", exc)
        return api_response(False, "Failed to create test notification", None, 500)
