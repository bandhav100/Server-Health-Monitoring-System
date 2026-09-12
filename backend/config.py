import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-key-change-in-production-32-chars!")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-key-change-in-production-32!!")
    JWT_ACCESS_TOKEN_EXPIRES = 3600
    
    # Database resolution: supports direct DATABASE_URL or discrete DB_* parameters
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        db_user = os.getenv("DB_USER")
        db_password = os.getenv("DB_PASSWORD")
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME", "shms")
        if db_user and db_password:
            database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        elif db_user:
            database_url = f"postgresql://{db_user}@{db_host}:{db_port}/{db_name}"
        else:
            database_url = f"postgresql://postgres:postgres@{db_host}:{db_port}/{db_name}"
    
    DATABASE_URL = database_url
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    CORS_HEADERS = "Content-Type"
    cors_env = os.getenv("CORS_ORIGINS")
    if cors_env:
        CORS_ORIGINS = [origin.strip() for origin in cors_env.split(",") if origin.strip()]
    else:
        CORS_ORIGINS = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5175",
            "http://localhost:3000",
        ]

    PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://127.0.0.1:9090")
    PROMETHEUS_CONFIG_PATH = os.getenv(
        "PROMETHEUS_CONFIG_PATH",
        r"C:\Users\bandh\Downloads\prometheus-3.14.0.windows-amd64\prometheus-3.14.0.windows-amd64\prometheus.yml",
    )
    PROMTOOL_PATH = os.getenv(
        "PROMTOOL_PATH",
        r"C:\Users\bandh\Downloads\prometheus-3.14.0.windows-amd64\prometheus-3.14.0.windows-amd64\promtool.exe",
    )
    WINDOWS_EXPORTER_URL = os.getenv("WINDOWS_EXPORTER_URL", "http://localhost:9182/")
    GRAFANA_URL = os.getenv("GRAFANA_URL", "http://localhost:3000/")
    GRAFANA_API_URL = os.getenv("GRAFANA_API_URL", "http://localhost:3000/api")
    GRAFANA_API_TOKEN = os.getenv("GRAFANA_API_TOKEN")

    # Prediction / ML Service URL
    ML_SERVICE_URL = (
        os.getenv("PREDICTION_SERVICE_URL")
        or os.getenv("ML_SERVICE_URL", "http://localhost:8000/")
    )

    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "shms@admin")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "bandhav")
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    FLASK_HOST = os.getenv("FLASK_HOST", "0.0.0.0")
    FLASK_PORT = int(os.getenv("FLASK_PORT", "5000"))
    LOG_DIR = os.getenv("LOG_DIR", str(BASE_DIR / "logs"))


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
