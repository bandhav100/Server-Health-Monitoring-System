from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from middleware.auth import jwt_required_api
from services.auth_service import AuthService
from models.audit_log import AuditLog
from models.admin import Admin
from extensions import db
from utils.response import api_response
from utils.logger import logger

auth_bp = Blueprint("auth", __name__)


def _get_admin_from_identity(identity):
    if not identity:
        return None
    try:
        if str(identity).isdigit():
            admin = db.session.get(Admin, int(identity))
            if admin:
                return admin
        admin = Admin.query.filter_by(username=str(identity)).first()
        if admin:
            return admin
        return Admin.query.filter_by(is_active=True).first()
    except Exception as exc:
        logger.warning("Error fetching admin for identity %s: %s", identity, exc)
        try:
            db.session.rollback()
        except Exception:
            pass
        return None


# ==========================
# LOGIN
# ==========================
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json(silent=True) or {}

        username = (data.get("username") or "").strip()
        password = data.get("password") or ""

        if not username or not password:
            return jsonify({
                "success": False,
                "message": "Username and password are required",
                "statusCode": 400
            }), 400

        # Authenticate user
        token = AuthService.login(username, password)

        if not token:
            try:
                log = AuditLog(
                    actor=username,
                    action="login_failed",
                    details="Invalid login credentials"
                )
                db.session.add(log)
                db.session.commit()
            except Exception as exc:
                db.session.rollback()
                logger.warning("Failed to record login_failed audit log: %s", exc)

            return jsonify({
                "success": False,
                "message": "Invalid credentials",
                "statusCode": 401
            }), 401

        admin = AuthService.get_admin_by_username(username)

        # Audit log (non-blocking)
        try:
            log = AuditLog(
                actor=admin.username if admin else username,
                action="login",
                details="Successful login"
            )
            db.session.add(log)
            db.session.commit()
        except Exception as exc:
            db.session.rollback()
            logger.warning("Failed to record login audit log: %s", exc)

        logger.info("User logged in successfully: %s", username)

        admin_dict = admin.to_dict() if admin else {
            "id": 1,
            "username": username,
            "role": "ADMIN"
        }

        user_info = {
            "id": admin.id if admin else 1,
            "username": admin.username if admin else username,
            "role": "ADMIN"
        }
        if admin and admin.full_name:
            user_info["full_name"] = admin.full_name

        # Response satisfying:
        # 1. Direct requirement:
        #    { "success": true, "access_token": "<JWT>", "user": { "username": "shms@admin" } }
        # 2. axiosClient unwrap compatibility (data object)
        # 3. token alias for frontend jwtToken = payload?.token check
        return jsonify({
            "success": True,
            "message": "Login successful",
            "access_token": token,
            "token": token,
            "user": user_info,
            "data": {
                "access_token": token,
                "token": token,
                "user": admin_dict
            },
            "statusCode": 200
        }), 200
    except Exception as exc:
        logger.exception("Unexpected error in /api/auth/login: %s", exc)
        return jsonify({
            "success": False,
            "message": "Internal login error",
            "statusCode": 500
        }), 500


# ==========================
# LOGOUT
# ==========================
@auth_bp.route("/logout", methods=["POST"])
@jwt_required_api
def logout():
    identity = get_jwt_identity()

    admin = _get_admin_from_identity(identity)
    actor_name = admin.username if admin else str(identity)

    try:
        log = AuditLog(
            actor=actor_name,
            action="logout",
            details="User logged out"
        )
        db.session.add(log)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        logger.warning("AuditLog commit error on logout: %s", exc)

    logger.info("User logged out: %s", actor_name)

    return api_response(
        True,
        "Logout successful",
        None,
        200
    )


# ==========================
# CURRENT USER
# ==========================
@auth_bp.route("/me", methods=["GET"])
@jwt_required_api
def me():
    identity = get_jwt_identity()

    admin = _get_admin_from_identity(identity)

    if not admin:
        return api_response(
            False,
            "User not found",
            None,
            404
        )

    return api_response(
        True,
        "User details fetched",
        admin.to_dict(),
        200
    )


# ==========================
# CHANGE PASSWORD
# ==========================
@auth_bp.route("/change-password", methods=["POST"])
@jwt_required_api
def change_password():
    identity = get_jwt_identity()

    admin = _get_admin_from_identity(identity)

    if not admin:
        return api_response(
            False,
            "User not found",
            None,
            404
        )

    data = request.get_json(silent=True) or {}

    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return api_response(
            False,
            "Current and new passwords are required",
            None,
            400
        )

    if not AuthService.verify_password(current_password, admin.password_hash):
        try:
            log = AuditLog(
                actor=admin.username,
                action="password_change_failed",
                details="Invalid current password"
            )
            db.session.add(log)
            db.session.commit()
        except Exception as exc:
            db.session.rollback()
            logger.warning("AuditLog commit error: %s", exc)

        return api_response(
            False,
            "Current password is incorrect",
            None,
            401
        )

    admin.password_hash = AuthService.hash_password(new_password)

    try:
        log = AuditLog(
            actor=admin.username,
            action="password_changed",
            details="Password changed successfully"
        )
        db.session.add(log)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        logger.warning("AuditLog commit error: %s", exc)

    logger.info("Password changed for user: %s", admin.username)

    return api_response(
        True,
        "Password changed successfully",
        None,
        200
    )