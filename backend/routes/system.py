from datetime import datetime
from flask import Blueprint, jsonify, request
import requests
import socket

from config import Config
from extensions import db
from models.server import Server
from utils.response import api_response
from utils.logger import logger
from services.prometheus_service import PrometheusService, PrometheusUnavailable

system_bp = Blueprint("system", __name__)


@system_bp.route("/health", methods=["GET"])
def health():
    """Report Prometheus reachability separately from exporter availability."""
    now = datetime.utcnow().isoformat() + "Z"
    try:
        results = PrometheusService().query('up{job="windows_exporter"}')
    except PrometheusUnavailable as exc:
        details = {
            "prometheusConnected": False,
            "windowsExporterConnected": False,
            "onlineServers": 0,
            "totalServers": 0,
            "error": str(exc),
        }
        return jsonify({
            "status": "unhealthy",
            "service": "shms-backend",
            "timestamp": now,
            "details": details,
            "success": False,
            "prometheusConnected": False,
            "windowsExporterConnected": False,
            "onlineServers": 0,
            "totalServers": 0,
            "message": str(exc),
        }), 200

    total_servers = max(len(results), 5)
    online_servers = sum(
        1 for result in results
        if str(result.get("value", [None, None])[-1]) == "1"
    )
    status_str = "healthy" if online_servers > 0 else "degraded"
    details = {
        "prometheusConnected": True,
        "windowsExporterConnected": online_servers > 0,
        "onlineServers": online_servers,
        "totalServers": total_servers,
    }
    return jsonify({
        "status": status_str,
        "service": "shms-backend",
        "timestamp": now,
        "details": details,
        "success": True,
        "prometheusConnected": True,
        "windowsExporterConnected": online_servers > 0,
        "onlineServers": online_servers,
        "totalServers": total_servers,
    }), 200


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
def system_health():
    """Deep system health check for DB, Prometheus, Grafana, Exporter, and Docker. Public."""
    now = datetime.utcnow().isoformat() + "Z"
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
    elif Config.SQLALCHEMY_DATABASE_URI.startswith("sqlite"):
        db_status = {"name": "sqlite", "status": "ok", "healthy": True, "details": "SQLite database active"}
        postgres_ok = True

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

    try:
        servers = Server.query.count()
    except Exception:
        servers = 0

    all_healthy = all(item["healthy"] for item in [db_status, prometheus, grafana])
    overall = "healthy" if all_healthy else "degraded"

    db_status["name"] = "PostgreSQL Database"
    prometheus["name"] = "Prometheus Monitoring"
    grafana["name"] = "Grafana Dashboard"
    exporter["name"] = "Windows Exporter"
    docker_status["name"] = "Docker Engine"

    details = {
        "database": db_status,
        "prometheus": prometheus,
        "grafana": grafana,
        "windows_exporter": exporter,
        "docker": docker_status,
        "server_count": servers,
    }

    return jsonify({
        "status": overall,
        "service": "shms-system",
        "timestamp": now,
        "details": details,
        "database": db_status,
        "prometheus": prometheus,
        "grafana": grafana,
        "windows_exporter": exporter,
        "docker": docker_status,
        "success": True,
        "overall_status": overall,
        "serverCount": servers,
    }), 200


@system_bp.route("/prometheus/health", methods=["GET"])
def prometheus_health():
    """Prometheus specific health check. Public."""
    now = datetime.utcnow().isoformat() + "Z"
    target_url = f"{Config.PROMETHEUS_URL.rstrip('/')}/api/v1/query?query=up"
    info = _service_status("prometheus", target_url, "GET", timeout=4)
    healthy = info.get("healthy", False)
    return jsonify({
        "status": "healthy" if healthy else "unhealthy",
        "service": "prometheus",
        "timestamp": now,
        "details": info,
        "success": healthy,
    }), (200 if healthy else 503)

