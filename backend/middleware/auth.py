from functools import wraps
from flask_jwt_extended import get_jwt_identity, jwt_required
from extensions import db
from models.admin import Admin
from utils.response import api_response


def jwt_required_api(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()
        if not identity:
            return api_response(False, "Authentication required", None, 401)
        try:
            admin = db.session.get(Admin, int(identity))
        except (TypeError, ValueError):
            admin = None
        if admin is None or not admin.is_active:
            return api_response(False, "Authentication required", None, 401)
        return fn(*args, **kwargs)

    return wrapper
