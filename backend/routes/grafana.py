from datetime import datetime
import os
import json
import logging
from pathlib import Path
from urllib.parse import urlencode
import requests
from flask import Blueprint, jsonify, request

from config import Config
from models.server import Server
from middleware.auth import jwt_required_api
from utils.response import api_response
from utils.logger import logger

grafana_bp = Blueprint("grafana", __name__)

STATE_FILE = Path(__file__).resolve().parent.parent / "tunnel_state.json"
_cached_tunnel_url = None


def get_active_tunnel_url():
    """Retrieve the active Cloudflare Tunnel URL from memory, state file, or env."""
    global _cached_tunnel_url
    if _cached_tunnel_url:
        return _cached_tunnel_url

    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                url = data.get("tunnel_url", "").strip()
                if url:
                    _cached_tunnel_url = url
                    return url
        except Exception as exc:
            logger.warning("Failed to read tunnel state file: %s", exc)

    env_url = (os.getenv("CLOUDFLARE_TUNNEL_URL") or getattr(Config, "CLOUDFLARE_TUNNEL_URL", "")).strip()
    if env_url:
        return env_url

    return None


def set_active_tunnel_url(url: str):
    """Store the newly detected Cloudflare tunnel URL."""
    global _cached_tunnel_url
    clean_url = url.strip().rstrip("/")
    _cached_tunnel_url = clean_url
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump({"tunnel_url": clean_url}, f)
        logger.info("Updated active Cloudflare tunnel URL: %s", clean_url)
    except Exception as exc:
        logger.error("Failed to persist tunnel state: %s", exc)
    return clean_url


def get_public_grafana_base_url():
    """
    Determine the best public/browser-accessible Grafana URL:
    1. Active Cloudflare/Custom Tunnel URL (if registered)
    2. Tailscale Funnel / domain (e.g. *.ts.net) -> uses same domain under /grafana
    3. Request arriving through reverse proxy (e.g. *.trycloudflare.com)
    4. Local development / fallback: http://localhost:3001
    """
    tunnel = get_active_tunnel_url()
    if tunnel:
        return tunnel

    host = request.headers.get("X-Forwarded-Host") or request.headers.get("Host") or ""
    proto = request.headers.get("X-Forwarded-Proto") or ("https" if request.is_secure else "http")

    # If arriving via Tailscale domain/funnel (*.ts.net), Grafana is served via /grafana reverse-proxy over HTTPS
    if "ts.net" in host or "tailscale" in host:
        return f"https://{host}/grafana"

    # If arriving via Cloudflare tunnel domain
    if "trycloudflare.com" in host or "cloudflare" in host:
        return f"{proto}://{host}"

    # If arriving via frontend proxy on port 5173
    if ":5173" in host:
        return f"{proto}://{host}/grafana"

    # Default fallback: host port 3000 or configured URL
    fallback = getattr(Config, "GRAFANA_URL", "http://localhost:3000")
    if any(k in fallback for k in ("grafana", "host.docker.internal", "backend")):
        return "http://localhost:3000"
    return fallback.rstrip("/")


def _grafana_api_request(endpoint: str, timeout=5):
    """Internal API request directly to Grafana container/host."""
    headers = {}
    if getattr(Config, "GRAFANA_API_TOKEN", None):
        headers["Authorization"] = f"Bearer {Config.GRAFANA_API_TOKEN}"

    # Try internal container first, then host fallback
    urls_to_try = [
        f"{Config.GRAFANA_API_URL.rstrip('/')}/{endpoint.lstrip('/')}",
        f"http://grafana:3000/api/{endpoint.lstrip('/')}",
        f"http://host.docker.internal:3000/api/{endpoint.lstrip('/')}",
        f"http://localhost:3000/api/{endpoint.lstrip('/')}",
        f"http://host.docker.internal:3001/api/{endpoint.lstrip('/')}",
        f"http://localhost:3001/api/{endpoint.lstrip('/')}",
    ]

    last_error = None
    for url in urls_to_try:
        try:
            resp = requests.get(url, headers=headers, timeout=timeout)
            if resp.ok:
                return resp.json()
        except requests.RequestException as exc:
            last_error = exc
            continue

    raise requests.RequestException(f"Failed to connect to Grafana API: {last_error}")


def _dashboard_url(instance: str, uid: str = "ad5x2s5", time_range: str = "24h", theme: str = "dark"):
    base_url = get_public_grafana_base_url().rstrip("/")
    query = {
        "orgId": 1,
        "theme": theme or "dark",
        "kiosk": "tv",
        "from": f"now-{time_range or '24h'}",
        "to": "now",
        "refresh": "30s",
        "var-instance": instance or ".*",
    }
    return f"{base_url}/d/{uid}/shms?{urlencode(query)}"


# ==========================================================
# PUBLIC: Embedded Dashboard URL (Frontend Iframe)
# MUST NOT REQUIRE JWT AUTHENTICATION
# ==========================================================
@grafana_bp.route("/grafana/embed-url", methods=["GET"])
def get_grafana_embed_url():
    """
    Public dynamic Grafana embed URL generator.
    Allows React iframe embedding without requiring auth headers.
    """
    instance = request.args.get("instance", ".*")
    time_range = request.args.get("timeRange", "24h")
    theme = request.args.get("theme", "dark")
    dashboard_uid = request.args.get("uid", "ad5x2s5")

    public_base = get_public_grafana_base_url().rstrip("/")
    full_dashboard_url = _dashboard_url(instance, dashboard_uid, time_range, theme)

    return jsonify(
        {
            "success": True,
            "grafana_url": public_base,
            "dashboard_uid": dashboard_uid,
            "dashboard_url": full_dashboard_url,
            "refresh_interval": "30s",
            "instance": instance,
        }
    ), 200


# ==========================================================
# Dynamic Tunnel Registration & Query
# ==========================================================
@grafana_bp.route("/tunnel/register", methods=["POST"])
@grafana_bp.route("/grafana/tunnel-url", methods=["POST"])
def register_tunnel_url():
    """Endpoint for scripts or webhooks to auto-register current Cloudflare tunnel URL."""
    payload = request.get_json(silent=True) or {}
    url = payload.get("url") or request.args.get("url") or request.form.get("url")
    if not url:
        return api_response(False, "Missing 'url' parameter", None, 400)

    registered = set_active_tunnel_url(url)
    return api_response(
        True,
        "Cloudflare tunnel URL registered successfully",
        {"tunnel_url": registered},
        200,
    )


@grafana_bp.route("/tunnel/url", methods=["GET"])
@grafana_bp.route("/grafana/tunnel-url", methods=["GET"])
def get_current_tunnel_url():
    """Returns the currently active tunnel or Grafana public URL."""
    active = get_public_grafana_base_url()
    return jsonify(
        {
            "success": True,
            "tunnel_url": get_active_tunnel_url(),
            "effective_url": active,
        }
    ), 200


# ==========================================================
# Grafana Service Health Check
# ==========================================================
@grafana_bp.route("/grafana/health", methods=["GET"])
def grafana_health():
    """Health check for Grafana service availability."""
    now = datetime.utcnow().isoformat() + "Z"
    urls = [
        f"{Config.GRAFANA_URL.rstrip('/')}/api/health",
        "http://grafana:3000/api/health",
        "http://localhost:3001/api/health",
    ]

    for target in urls:
        try:
            resp = requests.get(target, timeout=3)
            if resp.ok:
                raw_details = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {"message": "OK"}
                return jsonify(
                    {
                        "status": "healthy",
                        "service": "grafana",
                        "timestamp": now,
                        "details": raw_details,
                        "success": True,
                        "grafana_url": target,
                        "http_status": resp.status_code,
                    }
                ), 200
        except Exception:
            continue

    return jsonify(
        {
            "status": "unhealthy",
            "service": "grafana",
            "timestamp": now,
            "details": {"message": "Grafana server is unreachable"},
            "success": False,
            "message": "Grafana server is unreachable",
        }
    ), 503


# ==========================================================
# Protected: Dashboard URL for Selected Server (JWT Protected)
# ==========================================================
@grafana_bp.route("/grafana/dashboard/<int:server_id>", methods=["GET"])
@jwt_required_api
def get_grafana_dashboard(server_id):
    server = Server.query.get_or_404(server_id)
    uid = server.grafana_uid or "ad5x2s5"

    try:
        dashboard = _grafana_api_request(f"dashboards/uid/{uid}")
        title = dashboard.get("dashboard", {}).get("title", "SHMS Live Monitoring Dashboard")

        data = {
            "server_id": server.id,
            "server_name": server.name,
            "dashboard_uid": uid,
            "dashboard_url": _dashboard_url(server.prometheus_instance or ".*", uid),
            "grafana_url": get_public_grafana_base_url(),
            "refresh_interval": dashboard.get("dashboard", {}).get("refresh", "30s"),
            "instance": server.prometheus_instance,
        }

        return api_response(True, "Grafana dashboard URL fetched", data, 200)

    except Exception as exc:
        logger.error("Grafana Dashboard Error: %s", exc)
        return api_response(False, f"Grafana unavailable: {str(exc)}", None, 503)


# ==========================================================
# Protected: Dashboard Panels (JWT Protected)
# ==========================================================
@grafana_bp.route("/grafana/panels/<int:server_id>", methods=["GET"])
@jwt_required_api
def get_grafana_panels(server_id):
    server = Server.query.get_or_404(server_id)
    uid = server.grafana_uid or "ad5x2s5"

    try:
        dashboard = _grafana_api_request(f"dashboards/uid/{uid}")
        panels = dashboard.get("dashboard", {}).get("panels", [])

        return api_response(
            True,
            "Grafana panels fetched",
            {
                "server_id": server.id,
                "server_name": server.name,
                "panels": panels,
            },
            200,
        )
    except Exception as exc:
        logger.error("Grafana Panels Error: %s", exc)
        return api_response(False, f"Grafana unavailable: {str(exc)}", None, 503)


# ==========================================================
# Protected: Legacy Dashboard URL (JWT Protected)
# ==========================================================
@grafana_bp.route("/grafana/url/<int:server_id>", methods=["GET"])
@jwt_required_api
def get_grafana_url(server_id):
    server = Server.query.get_or_404(server_id)
    uid = server.grafana_uid or "ad5x2s5"

    try:
        dashboard = _grafana_api_request(f"dashboards/uid/{uid}")
        panels = dashboard.get("dashboard", {}).get("panels", [])

        data = {
            "dashboard_url": _dashboard_url(server.prometheus_instance or ".*", uid),
            "panel_ids": [panel.get("id") for panel in panels],
            "instance": server.prometheus_instance,
            "grafana_url": get_public_grafana_base_url(),
        }

        return api_response(True, "Grafana URL fetched", data, 200)

    except Exception as exc:
        logger.error("Grafana URL Error: %s", exc)
        return api_response(False, f"Grafana unavailable: {str(exc)}", None, 503)