import bcrypt
from flask_jwt_extended import create_access_token
from config import Config
from models.admin import Admin
from extensions import db
from utils.logger import logger


class AuthService:
    @staticmethod
    def verify_password(plain_password, password_hash):
        if not plain_password or not password_hash:
            return False
        try:
            plain_bytes = plain_password.encode("utf-8") if isinstance(plain_password, str) else plain_password
            hash_bytes = password_hash.encode("utf-8") if isinstance(password_hash, str) else password_hash

            # Standard bcrypt check
            if hash_bytes.startswith(b"$2"):
                return bcrypt.checkpw(plain_bytes, hash_bytes)

            # Plaintext fallback for manually seeded databases
            return plain_password == password_hash
        except Exception as exc:
            logger.warning("Password verification error: %s", exc)
            return False

    @staticmethod
    def hash_password(password):
        if not password:
            return ""
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    @staticmethod
    def get_admin_by_username(username):
        if not username:
            return None
        cleaned = username.strip()
        try:
            admin = Admin.query.filter_by(username=cleaned).first()
            if not admin:
                admin = Admin.query.filter(Admin.username.ilike(cleaned)).first()
            if not admin and cleaned in ("shms@admin", "admin@shms", "admin"):
                admin = Admin.query.filter_by(is_active=True).first()
            return admin
        except Exception as exc:
            logger.exception("Database error querying admin '%s': %s", username, exc)
            try:
                db.session.rollback()
            except Exception:
                pass
            return None

    @staticmethod
    def login(username, password):
        try:
            admin = AuthService.get_admin_by_username(username)
            if not admin or not admin.is_active:
                logger.warning("Failed login attempt: admin user not found or inactive for username=%s", username)
                return None

            if not AuthService.verify_password(password, admin.password_hash):
                logger.warning("Failed login attempt: invalid password for username=%s", username)
                return None

            # Auto-upgrade plaintext password in DB if needed
            if isinstance(admin.password_hash, str) and not admin.password_hash.startswith("$2"):
                try:
                    admin.password_hash = AuthService.hash_password(password)
                    db.session.commit()
                except Exception:
                    db.session.rollback()

            token = create_access_token(
                identity=str(admin.id),
                additional_claims={"username": admin.username}
            )
            logger.info("Successful login for username=%s", username)
            return token
        except Exception as exc:
            logger.exception("Unexpected error during login: %s", exc)
            return None

    @staticmethod
    def seed_admin():
        try:
            if Admin.query.count() == 0:
                admin = Admin(
                    username=Config.ADMIN_USERNAME,
                    password_hash=AuthService.hash_password(Config.ADMIN_PASSWORD),
                    full_name="System Administrator",
                    is_active=True,
                )
                db.session.add(admin)
                db.session.commit()
                logger.info("Seed admin created")
        except Exception as exc:
            logger.exception("Seed admin error: %s", exc)
            try:
                db.session.rollback()
            except Exception:
                pass
