import sys
from app import create_app
from extensions import db
from models.admin import Admin
from services.auth_service import AuthService

def reset_admin(username="shms@admin", password="admin123", full_name="System Administrator"):
    app = create_app()
    with app.app_context():
        admin = Admin.query.filter_by(username=username).first()
        if not admin:
            # Check if there's an existing admin with a different username (e.g. admin@shms)
            existing = Admin.query.first()
            if existing:
                print(f"[SHMS Recovery] Updating existing admin account: {existing.username} -> {username}")
                admin = existing
                admin.username = username
            else:
                print(f"[SHMS Recovery] Creating new admin account: {username}")
                admin = Admin(
                    username=username,
                    full_name=full_name,
                    is_active=True,
                )
                db.session.add(admin)

        admin.password_hash = AuthService.hash_password(password)
        admin.full_name = full_name
        admin.is_active = True
        db.session.commit()
        print(f"[SHMS Recovery] Admin user '{username}' password successfully updated.")
        print(f"Username: {username}")
        print(f"Password: {password}")
        print(f"Active:   {admin.is_active}")

if __name__ == "__main__":
    user = sys.argv[1] if len(sys.argv) > 1 else "shms@admin"
    pwd = sys.argv[2] if len(sys.argv) > 2 else "admin123"
    reset_admin(user, pwd)
