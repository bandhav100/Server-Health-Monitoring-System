from extensions import db
from models.base import AuditMixin


class Notification(db.Model, AuditMixin):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey("admins.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    notification_type = db.Column(db.String(50), default="info")  # info, warning, critical
    related_entity_type = db.Column(db.String(50), nullable=True)  # server, alert, prediction
    related_entity_id = db.Column(db.Integer, nullable=True)

    admin = db.relationship("Admin", backref=db.backref("notifications", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "admin_id": self.admin_id,
            "title": self.title,
            "message": self.message,
            "is_read": self.is_read,
            "notification_type": self.notification_type,
            "related_entity_type": self.related_entity_type,
            "related_entity_id": self.related_entity_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
