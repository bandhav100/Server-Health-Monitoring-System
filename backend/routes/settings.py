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
    """Create or update a setting"""
    data = request.get_json(silent=True) or {}
    key = data.get("key")
    value = data.get("value")
    
    if not key:
        return api_response(False, "Setting key is required", None, 400)

    setting = Setting.set_value(
        key,
        value,
        description=data.get("description"),
        category=data.get("category", "system"),
    )
    
    log = AuditLog(
        actor="admin",
        action="setting_updated",
        details=f"Setting {key} updated"
    )
    db.session.add(log)
    db.session.commit()
    
    logger.info("Setting updated: %s", key)
    return api_response(True, "Setting saved", setting.to_dict(), 200)


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
