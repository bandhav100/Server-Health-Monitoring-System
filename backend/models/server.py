from extensions import db
from models.base import AuditMixin


class Server(db.Model, AuditMixin):
    __tablename__ = "servers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    hostname = db.Column(db.String(120), nullable=True)
    ip_address = db.Column(db.String(100), nullable=True)
    operating_system = db.Column(db.String(120), nullable=True)
    exporter_port = db.Column(db.Integer, default=9182, nullable=True)
    environment = db.Column(db.String(50), default="Production", nullable=True)
    description = db.Column(db.Text, nullable=True)
    tailscale_ip = db.Column(db.String(100), nullable=True, unique=True)
    prometheus_instance = db.Column(db.String(200), nullable=True)
    prometheus_job = db.Column(db.String(120), nullable=True)
    grafana_uid = db.Column(db.String(120), nullable=True)
    location = db.Column(db.String(120), nullable=True)
    source = db.Column(db.String(50), default="manual", nullable=True)
    status = db.Column(db.String(50), default="healthy")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "hostname": self.hostname or self.name,
            "ip_address": self.ip_address or self.tailscale_ip,
            "operating_system": self.operating_system,
            "exporter_port": self.exporter_port or 9182,
            "environment": self.environment or "Production",
            "description": self.description,
            "tailscale_ip": self.tailscale_ip or self.ip_address,
            "prometheus_instance": self.prometheus_instance,
            "prometheus_job": self.prometheus_job,
            "grafana_uid": self.grafana_uid,
            "location": self.location,
            "source": self.source or "manual",
            "status": self.status,
            "operatingSystem": self.operating_system,
            "tailscaleIp": self.tailscale_ip or self.ip_address,
            "prometheusInstance": self.prometheus_instance,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

