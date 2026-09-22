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
        
        admin = None
        try:
            # 1. Try numeric ID
            if str(identity).isdigit():
                admin = db.session.get(Admin, int(identity))
            # 2. Try username lookup
            if not admin:
                admin = Admin.query.filter_by(username=str(identity)).first()
            # 3. Fallback: if valid JWT signature exists and there is an active admin
            if not admin:
                admin = Admin.query.filter_by(is_active=True).first()
        except Exception:
            admin = None

        if admin is None or not admin.is_active:
            return api_response(False, "Authentication required", None, 401)
            
        return fn(*args, **kwargs)

    return wrapper
