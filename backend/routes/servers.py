from flask import Blueprint
from middleware.auth import jwt_required_api
from models.server import Server
from services.prometheus_service import PrometheusService, PrometheusUnavailable
from services.prometheus_discovery_service import sync_servers
from services.tailscale_discovery_service import sync_machines, TailscaleUnavailable
from extensions import db
from utils.response import api_response

servers_bp = Blueprint("servers", __name__)


def _with_live_metrics(server):
    payload = server.to_dict()
    display_names = {"bandhav-1": "Bandhav", "abhi": "Abhi", "saivinay": "Saivinay", "manju": "Manju", "navadeep": "Navadeep"}
    payload.update({"hostname": server.name, "displayName": display_names.get(server.name.lower(), server.name), "ip": server.tailscale_ip})
    payload.update({"status": "offline", "cpu": None, "ram": None, "disk": None, "network": None, "uptime": None, "lastSeen": None, "healthScore": None})
    if not server.prometheus_instance:
        return payload
    try:
        metrics = PrometheusService().get_instance_metrics(
            server.prometheus_instance or server.name,
            server.prometheus_job,
        )
        payload.update({
            "status": "healthy" if metrics.get("status") == "healthy" else "offline",
            "cpu": metrics.get("cpuUsage"),
            "ram": metrics.get("ramUsage"),
            "disk": metrics.get("diskUsage"),
            "network": metrics.get("networkUsage"),
            "networkReceive": metrics.get("networkReceive"),
            "networkSend": metrics.get("networkSend"),
            "uptime": metrics.get("uptime"),
            "lastSeen": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        })
        values = [metrics.get(key) for key in ("cpuUsage", "ramUsage", "diskUsage") if metrics.get(key) is not None]
        payload["healthScore"] = round(max(0, 100 - sum(values) / len(values)), 2) if values else None
    except PrometheusUnavailable:
        payload["status"] = "offline"
    return payload


@servers_bp.route("/servers", methods=["GET"])
@jwt_required_api
def get_servers():
    try:
        sync_machines()
        db.session.commit()
    except TailscaleUnavailable:
        db.session.rollback()
    try:
        sync_servers()
        db.session.commit()
    except PrometheusUnavailable:
        db.session.rollback()
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


