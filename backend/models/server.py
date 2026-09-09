from extensions import db
from models.base import AuditMixin


class Server(db.Model, AuditMixin):
    __tablename__ = "servers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    operating_system = db.Column(db.String(120), nullable=True)
    tailscale_ip = db.Column(db.String(100), nullable=True, unique=True)
    prometheus_instance = db.Column(db.String(200), nullable=True)
    prometheus_job = db.Column(db.String(120), nullable=True)
    grafana_uid = db.Column(db.String(120), nullable=True)
    location = db.Column(db.String(120), nullable=True)
    status = db.Column(db.String(50), default="healthy")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "operating_system": self.operating_system,
            "tailscale_ip": self.tailscale_ip,
            "prometheus_instance": self.prometheus_instance,
            "prometheus_job": self.prometheus_job,
            "grafana_uid": self.grafana_uid,
            "location": self.location,
            "status": self.status,
            "operatingSystem": self.operating_system,
            "tailscaleIp": self.tailscale_ip,
            "prometheusInstance": self.prometheus_instance,
            "location": self.location,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
