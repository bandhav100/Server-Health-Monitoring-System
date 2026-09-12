from extensions import db
from models.base import AuditMixin


class Alert(db.Model, AuditMixin):
    __tablename__ = "alerts"

    id = db.Column(db.Integer, primary_key=True)
    server_id = db.Column(db.Integer, db.ForeignKey("servers.id"), nullable=False)
    severity = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    metric = db.Column(db.String(50), nullable=True)
    category = db.Column(db.String(50), nullable=True)
    current_value = db.Column(db.Float, nullable=True)
    acknowledged = db.Column(db.Boolean, default=False)
    threshold_value = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(20), default="ACTIVE", nullable=True)
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)

    server = db.relationship("Server", backref=db.backref("alerts", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "server_id": self.server_id,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "message": self.description,
            "metric": self.metric or self.title,
            "category": self.category or "System",
            "current_value": self.current_value,
            "acknowledged": self.acknowledged,
            "threshold_value": self.threshold_value,
            "status": self.status or ("ACKNOWLEDGED" if self.acknowledged else "ACTIVE"),
            "server_name": self.server.name if self.server else str(self.server_id),
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
