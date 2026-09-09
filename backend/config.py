import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-key-change-in-production-32-chars!")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-key-change-in-production-32!!")
    JWT_ACCESS_TOKEN_EXPIRES = 3600
    
    # PostgreSQL is required for all environments.
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL must be set in backend/.env")
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_HEADERS = "Content-Type"
    CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
    PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://127.0.0.1:9090")
    WINDOWS_EXPORTER_URL = os.getenv("WINDOWS_EXPORTER_URL", "http://localhost:9182/")
    GRAFANA_URL = os.getenv("GRAFANA_URL", "http://localhost:3000/")
    GRAFANA_API_URL = os.getenv("GRAFANA_API_URL", "http://localhost:3000/api")
    GRAFANA_API_TOKEN = os.getenv("GRAFANA_API_TOKEN")
    ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8000/")
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "shms@admin")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "bandhav")
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
