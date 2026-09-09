#!/usr/bin/env python
"""
Seed script to initialize database with test data.
Run from backend directory: python seed.py
"""

import os
import sys

# Add parent directory to path
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app import create_app
from extensions import db
from models.admin import Admin
from models.notification import Notification
from models.settings import Setting
from models.audit_log import AuditLog
from services.auth_service import AuthService
from datetime import datetime


def seed_database():
    """Seed the database with initial data"""
    app = create_app()
    
    with app.app_context():
        # Clear existing data (be careful with this!)
        # db.drop_all()
        # db.create_all()
        
        print("Seeding database...")
        
        # 1. Create admin user
        print("  → Creating admin user...")
        admin = Admin.query.filter_by(username="shms@admin").first()
        if not admin:
            admin = Admin(
                username="shms@admin",
                password_hash=AuthService.hash_password("bandhav"),
                full_name="System Administrator",
                is_active=True
            )
            db.session.add(admin)
            db.session.commit()
            print("    ✓ Admin user created")
        else:
            print("    ✓ Admin user already exists")
        
        # 2. Create test notifications
        print("  → Creating test notifications...")
        notifications_count = 0
        notification_templates = [
            {"title": "System Alert", "message": "High CPU usage detected", "type": "warning"},
            {"title": "Alert Acknowledged", "message": "Alert has been resolved", "type": "info"},
            {"title": "Critical Issue", "message": "Disk space is critically low", "type": "critical"},
        ]
        
        for template in notification_templates:
            notification = Notification(
                admin_id=admin.id,
                title=template["title"],
                message=template["message"],
                notification_type=template["type"],
                is_read=False
            )
            db.session.add(notification)
            notifications_count += 1
        
        db.session.commit()
        print(f"    ✓ {notifications_count} notifications created")
        
        # 3. Create test settings
        print("  → Creating test settings...")
        settings_data = [
            {"key": "cpu_threshold", "value": "85", "category": "alerts", "description": "CPU alert threshold (%)"},
            {"key": "ram_threshold", "value": "80", "category": "alerts", "description": "RAM alert threshold (%)"},
            {"key": "disk_threshold", "value": "90", "category": "alerts", "description": "Disk alert threshold (%)"},
            {"key": "metrics_retention_days", "value": "30", "category": "data", "description": "Metrics retention period"},
            {"key": "alert_cooldown_minutes", "value": "5", "category": "alerts", "description": "Alert cooldown period"},
            {"key": "notifications_enabled", "value": "true", "category": "system", "description": "Enable notifications"},
        ]
        
        settings_count = 0
        for setting_data in settings_data:
            existing = Setting.query.filter_by(key=setting_data["key"]).first()
            if not existing:
                setting = Setting(
                    key=setting_data["key"],
                    value=setting_data["value"],
                    category=setting_data["category"],
                    description=setting_data["description"]
                )
                db.session.add(setting)
                settings_count += 1
        
        db.session.commit()
        print(f"    ✓ {settings_count} settings created")
        
        # 4. Create audit logs
        print("  → Creating test audit logs...")
        audit_actions = [
            {"actor": "shms@admin", "action": "login", "details": "Admin logged in"},
            {"actor": "shms@admin", "action": "server_created", "details": "Created new server"},
            {"actor": "shms@admin", "action": "alert_acknowledged", "details": "Alert acknowledged"},
        ]
        
        logs_count = 0
        for log_data in audit_actions:
            log = AuditLog(
                actor=log_data["actor"],
                action=log_data["action"],
                details=log_data["details"]
            )
            db.session.add(log)
            logs_count += 1
        
        db.session.commit()
        print(f"    ✓ {logs_count} audit logs created")
        
        print("\n✅ Database seeded successfully!")
        print(f"\nTest credentials:")
        print(f"  Username: shms@admin")
        print(f"  Password: bandhav")
        print(f"Admin user ID: {admin.id}")


if __name__ == "__main__":
    seed_database()
