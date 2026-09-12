import re
from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from middleware.auth import jwt_required_api
from models.server import Server
from models.audit_log import AuditLog
from services.prometheus_service import PrometheusService, PrometheusUnavailable
from services.prometheus_discovery_service import sync_servers
from services.tailscale_discovery_service import sync_machines, TailscaleUnavailable
from services.prometheus_config_service import (
    PrometheusConfigService,
    PrometheusConfigError,
    PrometheusTargetExistsError,
)
from extensions import db
from utils.logger import logger
from utils.response import api_response

servers_bp = Blueprint("servers", __name__)

IP_REGEX = re.compile(
    r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
)
HOSTNAME_REGEX = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(?:\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$"
)


def _is_valid_host(value):
    if not value or len(value) > 255:
        return False
    parts = value.split(".")
    if len(parts) == 4 and all(p.isdigit() for p in parts):
        return bool(IP_REGEX.match(value))
    return bool(HOSTNAME_REGEX.match(value)) and not value.replace(".", "").isdigit()


def _with_live_metrics(server):
    payload = server.to_dict()
    display_names = {
        "bandhav-1": "Bandhav",
        "abhi": "Abhi",
        "saivinay": "Saivinay",
        "manju": "Manju",
        "navadeep": "Navadeep",
    }
    hostname = server.hostname or server.name
    display_name = display_names.get(server.name.lower(), display_names.get(hostname.lower(), hostname))
    ip = server.ip_address or server.tailscale_ip

    payload.update({
        "hostname": hostname,
        "displayName": display_name,
        "ip": ip,
        "status": server.status or "pending",
        "cpu": None,
        "ram": None,
        "disk": None,
        "network": None,
        "uptime": None,
        "lastSeen": None,
        "healthScore": None,
    })

    if not server.prometheus_instance:
        return payload

    try:
        metrics = PrometheusService().get_instance_metrics(
            server.prometheus_instance or server.name,
            server.prometheus_job,
        )
        metric_status = metrics.get("status")
        up_val = metrics.get("up")

        if metric_status == "healthy" or up_val == 1:
            status = "healthy"
        elif up_val == 0 or metric_status == "offline":
            status = "offline"
        else:
            status = "pending"

        payload.update({
            "status": status,
            "cpu": metrics.get("cpuUsage") if status == "healthy" else None,
            "ram": metrics.get("ramUsage") if status == "healthy" else None,
            "disk": metrics.get("diskUsage") if status == "healthy" else None,
            "network": metrics.get("networkUsage") if status == "healthy" else None,
            "networkReceive": metrics.get("networkReceive") if status == "healthy" else None,
            "networkSend": metrics.get("networkSend") if status == "healthy" else None,
            "uptime": metrics.get("uptime") if status == "healthy" else None,
            "lastSeen": datetime.utcnow().isoformat() + "Z" if status == "healthy" else None,
        })
        values = [metrics.get(key) for key in ("cpuUsage", "ramUsage", "diskUsage") if metrics.get(key) is not None]
        payload["healthScore"] = round(max(0, 100 - sum(values) / len(values)), 2) if values and status == "healthy" else None
    except PrometheusUnavailable:
        payload["status"] = "pending" if server.status == "pending" else "offline"
    return payload


@servers_bp.route("/servers", methods=["GET"])
@jwt_required_api
def get_servers():
    try:
        sync_machines()
        db.session.commit()
    except TailscaleUnavailable:
        db.session.rollback()
    except Exception as exc:
        db.session.rollback()
        logger.warning("Tailscale sync error in get_servers: %s", exc)

    try:
        sync_servers()
        db.session.commit()
    except PrometheusUnavailable:
        db.session.rollback()
    except Exception as exc:
        db.session.rollback()
        logger.warning("Prometheus sync error in get_servers: %s", exc)

    servers = Server.query.order_by(Server.id.asc()).all()
    payload = [_with_live_metrics(server) for server in servers]
    unique = {}
    for server in payload:
        unique.setdefault((server.get("hostname"), server.get("ip")), server)
    return api_response(True, "Servers fetched", list(unique.values()), 200)


@servers_bp.route("/servers/<int:server_id>", methods=["GET"])
@jwt_required_api
def get_server(server_id):
    server = Server.query.get_or_404(server_id)
    return api_response(True, "Server fetched", _with_live_metrics(server), 200)


@servers_bp.route("/servers", methods=["POST"])
@jwt_required_api
def add_server():
    data = request.get_json() or {}

    name = str(data.get("name") or "").strip()
    host = str(data.get("host") or data.get("ip") or "").strip()
    port_raw = data.get("port") or data.get("windows_exporter_port") or 9182
    os_name = str(data.get("operating_system") or data.get("os") or "Windows").strip()
    environment = str(data.get("environment") or "Production").strip()
    description = str(data.get("description") or "").strip()

    # 1. Validation: Name
    if not name:
        return api_response(False, "Server name is required.", None, 400)

    # 2. Validation: Host / IP
    if not host or not _is_valid_host(host):
        return api_response(False, "Enter a valid hostname or IP address.", None, 400)

    # 3. Validation: Exporter Port
    try:
        port = int(port_raw)
        if not (1 <= port <= 65535):
            raise ValueError
    except (ValueError, TypeError):
        return api_response(False, "Port must be between 1 and 65535.", None, 400)

    target_address = f"{host}:{port}"

    # 4. Check for existing duplicate server in PostgreSQL
    existing_by_name = Server.query.filter(Server.name.ilike(name)).first()
    if existing_by_name:
        return api_response(False, "Server already exists.", None, 409)

    existing_by_target = Server.query.filter_by(prometheus_instance=target_address).first()
    if existing_by_target:
        return api_response(False, "This monitoring target is already configured.", None, 409)

    # 5. Check duplicate in Prometheus config file
    prom_service = PrometheusConfigService()
    job_name = "windows_exporter" if os_name.lower() == "windows" else f"{os_name.lower()}_exporter"

    if prom_service.is_target_configured(target_address, job_name=job_name):
        return api_response(False, "This monitoring target is already configured.", None, 409)

    # 6. Safely add target to Prometheus configuration (lock, backup, validate with promtool, atomic replace, reload)
    try:
        prom_result = prom_service.add_target(host, port, job_name=job_name)
    except PrometheusTargetExistsError:
        return api_response(False, "This monitoring target is already configured.", None, 409)
    except PrometheusConfigError as exc:
        logger.error("Prometheus config update error: %s", exc)
        return api_response(False, f"Server registration failed: {exc}", None, 400)
    except Exception as exc:
        logger.exception("Unexpected error updating Prometheus config: %s", exc)
        return api_response(False, f"Server registration failed: {exc}", None, 500)

    # 7. Save server to PostgreSQL
    try:
        current_identity = get_jwt_identity() or "admin"
        actor = current_identity.get("username") if isinstance(current_identity, dict) else str(current_identity)

        new_server = Server(
            name=name,
            hostname=name,
            ip_address=host,
            tailscale_ip=host,
            operating_system=os_name,
            exporter_port=port,
            environment=environment,
            description=description,
            prometheus_instance=target_address,
            prometheus_job=job_name,
            source="manual",
            status="pending",
        )
        db.session.add(new_server)

        # 8. Record audit log
        audit_server = AuditLog(
            actor=actor,
            action="server_added",
            details=f"Added monitoring server {name} ({target_address})",
        )
        audit_target = AuditLog(
            actor=actor,
            action="prometheus_target_added",
            details=f"Configured Prometheus target {target_address} for job {job_name}",
        )
        db.session.add(audit_server)
        db.session.add(audit_target)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        logger.exception("Failed to commit server to database: %s", exc)
        # Roll back Prometheus configuration if database commit failed
        if prom_result.get("backup_path"):
            prom_service.restore_backup(prom_result["backup_path"])
            prom_service.reload_prometheus()
        return api_response(False, f"Database error saving server: {exc}", None, 500)

    # 9. Formulate response
    server_data = _with_live_metrics(new_server)
    reloaded = bool(prom_result.get("reloaded"))
    reload_error = prom_result.get("reload_error")

    response_payload = {
        "server": server_data,
        "prometheus": {
            "config_updated": True,
            "reloaded": reloaded,
            "error": reload_error,
        },
    }

    if reloaded:
        return api_response(
            True,
            "Server added successfully. Prometheus target added and reloaded.",
            response_payload,
            201,
        )
    else:
        return api_response(
            False,
            "Server saved, but Prometheus reload failed.",
            response_payload,
            207,
        )



