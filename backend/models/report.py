from extensions import db
from models.base import AuditMixin


class Report(db.Model, AuditMixin):
    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    server_id = db.Column(db.Integer, db.ForeignKey("servers.id"), nullable=True)
    server_name = db.Column(db.String(120), nullable=True)
    metrics = db.Column(db.Text, nullable=False)
    time_range = db.Column(db.String(50), nullable=False)
    start_time = db.Column(db.DateTime, nullable=True)
    end_time = db.Column(db.DateTime, nullable=True)
    format = db.Column(db.String(20), nullable=False)
    file_path = db.Column(db.String(500), nullable=True)
    file_size = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(50), default="completed")
    statistics = db.Column(db.Text, nullable=True)

    server = db.relationship("Server", backref=db.backref("reports", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "server_id": self.server_id,
            "server_name": self.server_name or "All Servers",
            "metrics": [m.strip() for m in self.metrics.split(",") if m.strip()] if self.metrics else [],
            "time_range": self.time_range,
            "start_time": self.start_time.isoformat() + "Z" if self.start_time else None,
            "end_time": self.end_time.isoformat() + "Z" if self.end_time else None,
            "format": self.format,
            "file_size": self.file_size,
            "status": self.status,
            "statistics": self.statistics,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }
