from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from middleware.auth import jwt_required_api
from services.auth_service import AuthService
from models.audit_log import AuditLog
from models.admin import Admin
from extensions import db
from utils.response import api_response
from utils.logger import logger


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return api_response(False, "Username and password are required", None, 400)

    token = AuthService.login(username, password)
    if not token:
        log = AuditLog(actor=username, action="login_failed", details="Invalid login credentials")
        db.session.add(log)
        db.session.commit()
        return api_response(False, "Invalid credentials", None, 401)

    admin = AuthService.get_admin_by_username(username)
    log = AuditLog(actor=username, action="login", details="Successful login")
    db.session.add(log)
    db.session.commit()
    
    return api_response(True, "Login successful", {
        "token": token,
        "user": admin.to_dict() if admin else {"username": username}
    }, 200)


@auth_bp.route("/logout", methods=["POST"])
@jwt_required_api
def logout():
    identity = get_jwt_identity()
    admin = Admin.query.get(int(identity))
    actor_name = admin.username if admin else str(identity)
    
    log = AuditLog(actor=actor_name, action="logout", details="User logged out")
    db.session.add(log)
    db.session.commit()
    logger.info("User logged out: %s", actor_name)
    return api_response(True, "Logout successful", None, 200)


@auth_bp.route("/me", methods=["GET"])
@jwt_required_api
def me():
    identity = get_jwt_identity()
    admin = Admin.query.get(int(identity))
    if not admin:
        return api_response(False, "User not found", None, 404)
    return api_response(True, "User details fetched", admin.to_dict(), 200)


@auth_bp.route("/change-password", methods=["POST"])
@jwt_required_api
def change_password():
    identity = get_jwt_identity()
    admin = Admin.query.get(int(identity))
    if not admin:
        return api_response(False, "User not found", None, 404)
    
    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    
    if not current_password or not new_password:
        return api_response(False, "Current and new passwords are required", None, 400)
    
    if not AuthService.verify_password(current_password, admin.password_hash):
        log = AuditLog(actor=admin.username, action="password_change_failed", 
                       details="Invalid current password")
        db.session.add(log)
        db.session.commit()
        return api_response(False, "Current password is incorrect", None, 401)
    
    admin.password_hash = AuthService.hash_password(new_password)
    log = AuditLog(actor=admin.username, action="password_changed", 
                   details="Password changed successfully")
    db.session.add(log)
    db.session.commit()
    
    logger.info("Password changed for user: %s", admin.username)
    return api_response(True, "Password changed successfully", None, 200)
