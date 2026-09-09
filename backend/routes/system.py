from flask import Blueprint, request
import requests
import socket

from config import Config
from extensions import db
from models.server import Server
from utils.response import api_response
from utils.logger import logger
from middleware.auth import jwt_required_api
from services.prometheus_service import PrometheusService, PrometheusUnavailable

system_bp = Blueprint("system", __name__)


@system_bp.route("/health", methods=["GET"])
def health():
    """Report Prometheus reachability separately from exporter availability."""
    try:
        results = PrometheusService().query('up{job="windows_exporter"}')
    except PrometheusUnavailable as exc:
        return {
            "success": False,
            "prometheusConnected": False,
            "windowsExporterConnected": False,
            "onlineServers": 0,
            "totalServers": 0,
            "status": "Unavailable",
            "message": str(exc),
        }, 200

    total_servers = max(len(results), 5)
    online_servers = sum(
        1 for result in results
        if str(result.get("value", [None, None])[-1]) == "1"
    )
    return {
        "success": True,
        "prometheusConnected": True,
        "windowsExporterConnected": online_servers > 0,
        "onlineServers": online_servers,
        "totalServers": total_servers,
        "status": "Healthy" if online_servers > 0 else "Degraded",
    }, 200


def _service_status(name, url, method="GET", timeout=5):
    try:
        response = requests.request(method, url, timeout=timeout)
        ok = response.ok
        return {
            "name": name,
            "status": "ok" if ok else "degraded",
            "url": url,
            "http_status": response.status_code,
            "healthy": ok,
        }
    except requests.RequestException as exc:
        return {
            "name": name,
            "status": "down",
            "url": url,
            "http_status": None,
            "healthy": False,
            "error": str(exc),
        }


@system_bp.route("/system/health", methods=["GET"])
@jwt_required_api
def system_health():
    postgres_ok = False
    db_status = {"name": "postgresql", "status": "down", "healthy": False, "details": "Not configured"}
    if Config.SQLALCHEMY_DATABASE_URI.startswith("postgresql"):
        try:
            from sqlalchemy import create_engine, text
            engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            postgres_ok = True
            db_status = {"name": "postgresql", "status": "ok", "healthy": True, "details": "Connected"}
        except Exception as exc:
            logger.warning("PostgreSQL health check failed: %s", exc)
            db_status = {"name": "postgresql", "status": "down", "healthy": False, "details": str(exc)}

    prometheus = _service_status("prometheus", Config.PROMETHEUS_URL.rstrip("/") + "/api/v1/query?query=up", "GET")
    grafana = _service_status("grafana", Config.GRAFANA_URL.rstrip("/") + "/api/health", "GET")
    exporter = _service_status("windows_exporter", Config.WINDOWS_EXPORTER_URL.rstrip("/") + "/metrics", "GET")

    docker_status = {"name": "docker", "status": "down", "healthy": False, "details": "Docker not available"}
    try:
        import docker
        client = docker.from_env()
        client.ping()
        docker_status = {"name": "docker", "status": "ok", "healthy": True, "details": "Docker daemon healthy"}
    except Exception as exc:
        logger.warning("Docker health check failed: %s", exc)
        docker_status = {"name": "docker", "status": "down", "healthy": False, "details": str(exc)}

    servers = Server.query.count()
    payload = {
        "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "servers": servers,
        "database": db_status,
        "prometheus": prometheus,
        "grafana": grafana,
        "windows_exporter": exporter,
        "docker": docker_status,
        "overall_status": "ok" if all(item["healthy"] for item in [db_status, prometheus, grafana, exporter, docker_status]) else "degraded",
    }
    payload["overallStatus"] = payload["overall_status"]
    payload["serverCount"] = payload["servers"]
    return api_response(True, "System health checked", payload, 200)
