from extensions import db
from models.base import AuditMixin


class Setting(db.Model, AuditMixin):
    __tablename__ = "settings"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(120), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=False, default="")
    description = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(80), default="system")

    def to_dict(self):
        return {
            "id": self.id,
            "key": self.key,
            "value": self.value,
            "description": self.description,
            "category": self.category,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @staticmethod
    def get_value(key, default=None):
        setting = Setting.query.filter_by(key=key).first()
        if not setting:
            return default
        try:
            return float(setting.value)
        except (TypeError, ValueError):
            return setting.value if setting.value not in (None, "") else default

    @staticmethod
    def set_value(key, value, description=None, category="system"):
        setting = Setting.query.filter_by(key=key).first()
        if setting is None:
            setting = Setting(key=key, value=str(value), description=description, category=category)
            db.session.add(setting)
        else:
            setting.value = str(value)
            if description is not None:
                setting.description = description
            setting.category = category
        db.session.commit()
        return setting
