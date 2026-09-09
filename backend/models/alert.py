from extensions import db
from models.base import AuditMixin


class Alert(db.Model, AuditMixin):
    __tablename__ = "alerts"

    id = db.Column(db.Integer, primary_key=True)
    server_id = db.Column(db.Integer, db.ForeignKey("servers.id"), nullable=False)
    severity = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    acknowledged = db.Column(db.Boolean, default=False)
    threshold_value = db.Column(db.Float, nullable=True)

    server = db.relationship("Server", backref=db.backref("alerts", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "server_id": self.server_id,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "acknowledged": self.acknowledged,
            "threshold_value": self.threshold_value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
