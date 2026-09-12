from extensions import db
from models.base import AuditMixin


class Prediction(db.Model, AuditMixin):
    __tablename__ = "predictions"

    id = db.Column(db.Integer, primary_key=True)
    server_id = db.Column(db.Integer, db.ForeignKey("servers.id"), nullable=False)
    cpu_forecast = db.Column(db.Float, default=0.0)
    ram_forecast = db.Column(db.Float, default=0.0)
    predicted_disk = db.Column(db.Float, default=0.0)
    predicted_network = db.Column(db.Float, default=0.0)
    anomaly_score = db.Column(db.Float, default=0.0)
    confidence = db.Column(db.Float, default=0.0)
    health_score = db.Column(db.Float, default=0.0)
    source = db.Column(db.String(120), default="ml-service")

    server = db.relationship("Server", backref=db.backref("predictions", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "server_id": self.server_id,
            "cpu_forecast": self.cpu_forecast,
            "ram_forecast": self.ram_forecast,
            "predicted_disk": self.predicted_disk,
            "predicted_network": self.predicted_network,
            "anomaly_score": self.anomaly_score,
            "confidence": self.confidence,
            "health_score": self.health_score,
            "source": self.source,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
