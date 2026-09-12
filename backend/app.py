import os
import sys

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from flask import Flask, request
from sqlalchemy import inspect, text
from sqlalchemy.engine import make_url
from config import config_by_name
from extensions import cors, db, jwt
from routes.auth import auth_bp
from routes.servers import servers_bp
from routes.dashboard import dashboard_bp
from routes.monitoring import metrics_bp, monitoring_bp
from routes.live import live_bp
from routes.alerts import alerts_bp
from routes.predictions import predictions_bp
from routes.grafana import grafana_bp
from routes.audit import audit_bp
from routes.docker import docker_bp
from routes.settings import settings_bp
from routes.notifications import notifications_bp
from routes.system import system_bp
from routes.analytics import analytics_bp
from routes.setup import setup_bp
from routes.reports import reports_bp
from models.report import Report
from middleware.error_handlers import register_error_handlers
from scheduler.jobs import start_scheduler, sync_prometheus_servers
from services.auth_service import AuthService
from utils.response import api_response


def _ensure_metrics_columns():
    inspector = inspect(db.engine)
    try:
        for table in db.metadata.sorted_tables:
            if not inspector.has_table(table.name):
                continue
            existing = {column["name"] for column in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name not in existing:
                    column_type = column.type.compile(dialect=db.engine.dialect)
                    table_name = db.engine.dialect.identifier_preparer.quote(table.name)
                    column_name = db.engine.dialect.identifier_preparer.quote(column.name)
                    db.session.execute(
                        text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
                    )
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def create_app(config_name="default"):
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    db.init_app(app)
    cors_origins = app.config.get("CORS_ORIGINS", ["http://localhost:5173", "http://127.0.0.1:5173"])
    cors.init_app(
        app,
        resources={
            r"/api/*": {
                "origins": cors_origins,
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True,
            }
        },
    )
    jwt.init_app(app)

    @jwt.unauthorized_loader
    def jwt_missing(_reason):
        return api_response(False, "Authentication required", None, 401)

    @jwt.invalid_token_loader
    def jwt_invalid(_reason):
        return api_response(False, "Invalid authentication token", None, 401)

    @jwt.expired_token_loader
    def jwt_expired(_header, _payload):
        return api_response(False, "Authentication token expired", None, 401)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(servers_bp, url_prefix="/api")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(monitoring_bp, url_prefix="/api/monitoring")
    app.register_blueprint(live_bp, url_prefix="/api")
    app.register_blueprint(metrics_bp, url_prefix="/api")
    app.register_blueprint(alerts_bp, url_prefix="/api")
    app.register_blueprint(predictions_bp, url_prefix="/api")
    app.register_blueprint(grafana_bp, url_prefix="/api")
    app.register_blueprint(audit_bp, url_prefix="/api")
    app.register_blueprint(docker_bp, url_prefix="/api")
    app.register_blueprint(settings_bp, url_prefix="/api")
    app.register_blueprint(notifications_bp, url_prefix="/api")
    app.register_blueprint(system_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(setup_bp, url_prefix="/api/setup")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    register_error_handlers(app)

    @app.before_request
    def log_request():
        app.logger.info("%s %s", request.method, request.path)

    @app.after_request
    def log_response(response):
        app.logger.info("%s %s -> %s", request.method, request.path, response.status_code)
        return response

    with app.app_context():
        database_url = app.config["SQLALCHEMY_DATABASE_URI"]
        db.create_all()
        _ensure_metrics_columns()
        safe_database_url = make_url(database_url).render_as_string(hide_password=True)
        print(f"[startup] Database connected: {safe_database_url}")
        AuthService.seed_admin()
        from models.settings import Setting
        Setting.seed_defaults()
        sync_prometheus_servers(app)

    if os.getenv("FLASK_ENV") != "production":
        print("[startup] Validating service dependencies...")
        try:
            import requests
            prometheus_health_url = f"{app.config.get('PROMETHEUS_URL', 'http://127.0.0.1:9090').rstrip('/')}/api/v1/query?query=up"
            grafana_health_url = f"{app.config.get('GRAFANA_URL', 'http://localhost:3000').rstrip('/')}/api/health"
            exporter_health_url = f"{app.config.get('WINDOWS_EXPORTER_URL', 'http://localhost:9182/').rstrip('/')}/metrics"
            for label, url in {
                "Prometheus": prometheus_health_url,
                "Grafana": grafana_health_url,
                "Windows Exporter": exporter_health_url,
            }.items():
                try:
                    r = requests.get(url, timeout=5)
                    print(f"[startup] {label}: {'OK' if r.ok else 'OFFLINE'} HTTP {r.status_code}")
                except Exception as exc:
                    print(f"[startup] {label}: OFFLINE ({exc})")
            try:
                import docker
                client = docker.from_env()
                client.ping()
                print("[startup] Docker: OK")
            except Exception as exc:
                print(f"[startup] Docker: OFFLINE ({exc})")
        except Exception as exc:
            print(f"[startup] Service validation skipped: {exc}")

    # The Werkzeug reloader creates a parent and a child process. Only the
    # serving process should own the background scheduler.
    if not app.debug or os.getenv("WERKZEUG_RUN_MAIN") in (None, "true"):
        start_scheduler(app)

    if app.debug or os.getenv("FLASK_DEBUG") == "1":
        print("Registered routes:")
        for rule in sorted(app.url_map.iter_rules(), key=lambda r: str(r)):
            print(f" - {rule}")

    return app


if __name__ == "__main__":
    app = create_app()
    host = os.getenv("FLASK_HOST", app.config.get("FLASK_HOST", "0.0.0.0"))
    port = int(os.getenv("FLASK_PORT", app.config.get("FLASK_PORT", 5000)))
    app.run(host=host, port=port, debug=app.debug)
