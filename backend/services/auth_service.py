import bcrypt
from flask_jwt_extended import create_access_token
from config import Config
from models.admin import Admin
from extensions import db
from utils.logger import logger


class AuthService:
    @staticmethod
    def verify_password(plain_password, password_hash):
        return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))

    @staticmethod
    def hash_password(password):
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    @staticmethod
    def get_admin_by_username(username):
        return Admin.query.filter_by(username=username).first()

    @staticmethod
    def login(username, password):
        admin = AuthService.get_admin_by_username(username)
        if not admin or not admin.is_active or not AuthService.verify_password(password, admin.password_hash):
            logger.warning("Failed login attempt for username=%s", username)
            return None

        token = create_access_token(identity=str(admin.id))
        logger.info("Successful login for username=%s", username)
        return token

    @staticmethod
    def seed_admin():
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
