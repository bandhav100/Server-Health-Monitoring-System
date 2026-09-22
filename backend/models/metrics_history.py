from extensions import db
from models.base import AuditMixin


class MetricsHistory(db.Model, AuditMixin):
    __tablename__ = "metrics_history"

    id = db.Column(db.Integer, primary_key=True)
    server_id = db.Column(db.Integer, db.ForeignKey("servers.id"), nullable=False)
    cpu_usage = db.Column(db.Float, default=0.0)
    ram_usage = db.Column(db.Float, default=0.0)
    disk_usage = db.Column(db.Float, default=0.0)
    network_usage = db.Column(db.Float, default=0.0)
    network_receive = db.Column(db.Float, nullable=True)
    network_send = db.Column(db.Float, nullable=True)
    temperature = db.Column(db.Float, default=0.0)
    uptime = db.Column(db.Float, default=0.0)

    server = db.relationship("Server", backref=db.backref("metrics_history", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "server_id": self.server_id,
            "cpu_usage": self.cpu_usage,
            "ram_usage": self.ram_usage,
            "disk_usage": self.disk_usage,
            "network_usage": self.network_usage,
            "network_receive": self.network_receive,
            "network_send": self.network_send,
            "temperature": self.temperature,
            "uptime": self.uptime,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
