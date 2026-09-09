from flask import Blueprint, jsonify, request
from urllib.parse import urlencode
import requests
from config import Config
from models.server import Server
from middleware.auth import jwt_required_api
from utils.response import api_response
from utils.logger import logger


grafana_bp = Blueprint("grafana", __name__)


def _grafana_dashboard(uid):
    headers = {"Authorization": f"Bearer {Config.GRAFANA_API_TOKEN}"} if Config.GRAFANA_API_TOKEN else {}
    response = requests.get(f"{Config.GRAFANA_API_URL.rstrip('/')}/dashboards/uid/{uid}", headers=headers, timeout=5)
    response.raise_for_status()
    return response.json()


def _dashboard_url(server, uid, title=None):
    path = f"{Config.GRAFANA_URL.rstrip('/')}/d/{uid}"
    if title:
        path += "/shms"
    query = {
        "orgId": 1,
        "theme": "light",
        "kiosk": "",
        "from": "now-24h",
        "to": "now",
        "var-instance": server.prometheus_instance or ".*",
    }
    path += "?" + urlencode(query)
    return path


@grafana_bp.route("/grafana/dashboard/<int:server_id>", methods=["GET"])
@jwt_required_api
def get_grafana_dashboard(server_id):
    """Get Grafana dashboard URL for a server"""
    server = Server.query.get_or_404(server_id)
    
    dashboard_uid = server.grafana_uid
    if not dashboard_uid:
        return api_response(False, "Grafana dashboard is not configured for this server", None, 404)
    try:
        dashboard = _grafana_dashboard(dashboard_uid)
    except (requests.RequestException, ValueError) as exc:
        return api_response(False, f"Grafana unavailable: {exc}", None, 503)
    title = dashboard.get("dashboard", {}).get("title", "dashboard")
    data = {"server_id": server_id, "server_name": server.name, "dashboard_url": _dashboard_url(server, dashboard_uid, title), "dashboard_uid": dashboard_uid, "grafana_url": Config.GRAFANA_URL, "refresh_interval": dashboard.get("dashboard", {}).get("refresh"), "instance": server.prometheus_instance}
    return api_response(True, "Grafana dashboard URL fetched", data, 200)


@grafana_bp.route("/grafana/embed-url", methods=["GET"])
@jwt_required_api
def get_grafana_embed_url():
    """Return the shared embedded SHMS dashboard URL."""
    query = urlencode({
        "orgId": 1,
        "theme": "light",
        "kiosk": "",
        "from": "now-24h",
        "to": "now",
        "var-instance": ".*",
    })
    url = f"{Config.GRAFANA_URL.rstrip('/')}/d/ad5x2s5/shms?{query}"
    return jsonify({"success": True, "baseUrl": url}), 200


@grafana_bp.route("/grafana/panels/<int:server_id>", methods=["GET"])
@jwt_required_api
def get_grafana_panels(server_id):
    """Get available Grafana panels for a server"""
    server = Server.query.get_or_404(server_id)
    
    if not server.grafana_uid:
        return api_response(False, "Grafana dashboard is not configured for this server", None, 404)
    try:
        dashboard = _grafana_dashboard(server.grafana_uid)
    except (requests.RequestException, ValueError) as exc:
        return api_response(False, f"Grafana unavailable: {exc}", None, 503)
    panels = dashboard.get("dashboard", {}).get("panels", [])
    
    response = {
        "server_id": server_id,
        "server_name": server.name,
        "panels": panels
    }
    return api_response(True, "Grafana panels fetched", response, 200)


@grafana_bp.route("/grafana/url/<int:server_id>", methods=["GET"])
@jwt_required_api
def get_grafana_url(server_id):
    """Get Grafana URL (legacy endpoint)"""
    server = Server.query.get_or_404(server_id)
    if not server.grafana_uid:
        return api_response(False, "Grafana dashboard is not configured for this server", None, 404)
    try:
        dashboard = _grafana_dashboard(server.grafana_uid)
    except (requests.RequestException, ValueError) as exc:
        return api_response(False, f"Grafana unavailable: {exc}", None, 503)
    panels = dashboard.get("dashboard", {}).get("panels", [])
    data = {"dashboard_url": _dashboard_url(server, server.grafana_uid), "panel_ids": [panel.get("id") for panel in panels], "instance": server.prometheus_instance}
    return api_response(True, "Grafana URL fetched", data, 200)
