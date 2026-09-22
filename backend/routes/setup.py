import time
import requests
from flask import Blueprint, request

from extensions import db
from middleware.auth import jwt_required_api
from models.server import Server
from services.prometheus_service import PrometheusService, PrometheusUnavailable
from utils.response import api_response
from utils.logger import logger

setup_bp = Blueprint("setup", __name__)


@setup_bp.route("/verify-exporter", methods=["POST"])
@jwt_required_api
def verify_exporter():
    """Actually tests if Windows Exporter is reachable at http://host:port/metrics."""
    data = request.get_json() or {}
    host = str(data.get("host") or "").strip()
    port = data.get("port") or 9182

    if not host:
        return api_response(False, "Host or IP address is required", None, 400)

    url = f"http://{host}:{port}/metrics"
    start_time = time.time()
    try:
        response = requests.get(url, timeout=5)
        latency_ms = int((time.time() - start_time) * 1000)

        # Check if response actually contains Prometheus / windows_exporter metrics
        content = response.text[:2000]
        has_metrics = "windows_" in content or "go_" in content or "# HELP" in content

        if response.status_code == 200 and has_metrics:
            return api_response(
                True,
                "Windows Exporter verified successfully",
                {
                    "verified": True,
                    "endpoint": url,
                    "status_code": response.status_code,
                    "latency_ms": latency_ms,
                    "metrics_detected": True,
                },
                200,
            )
        else:
            return api_response(
                False,
                f"Endpoint responded with HTTP {response.status_code}, but metrics were not recognized",
                {
                    "verified": False,
                    "endpoint": url,
                    "status_code": response.status_code,
                    "latency_ms": latency_ms,
                    "metrics_detected": has_metrics,
                },
                400,
            )
    except requests.exceptions.ConnectTimeout:
        return api_response(
            False,
            f"Connection timed out reaching {url}. Ensure Windows Exporter service is running and port {port} is open in Windows Firewall.",
            {"verified": False, "endpoint": url, "error": "timeout"},
            400,
        )
    except requests.exceptions.ConnectionError as exc:
        return api_response(
            False,
            f"Unable to connect to {url}. Connection refused or host unreachable.",
            {"verified": False, "endpoint": url, "error": str(exc)},
            400,
        )
    except Exception as exc:
        return api_response(
            False,
            f"Verification failed: {exc}",
            {"verified": False, "endpoint": url, "error": str(exc)},
            500,
        )


@setup_bp.route("/test-lhm", methods=["POST"])
@jwt_required_api
def test_lhm():
    """Actually tests LibreHardwareMonitor connectivity on the target machine."""
    data = request.get_json() or {}
    host = str(data.get("host") or "").strip()
    port = data.get("port") or 8085

    if not host:
        return api_response(False, "Host or IP address is required", None, 400)

    url = f"http://{host}:{port}/data.json"
    start_time = time.time()
    try:
        response = requests.get(url, timeout=4)
        latency_ms = int((time.time() - start_time) * 1000)
        if response.status_code == 200:
            return api_response(
                True,
                "LibreHardwareMonitor endpoint reachable",
                {
                    "reachable": True,
                    "endpoint": url,
                    "status_code": 200,
                    "latency_ms": latency_ms,
                },
                200,
            )
    except Exception:
        pass

    # Also check if Prometheus has LHM metrics for this target or general LHM instance
    try:
        results = PrometheusService().query('lhm_cpu_temperature_celsius')
        if results and len(results) > 0:
            return api_response(
                True,
                "Hardware monitoring active via Prometheus scraper",
                {
                    "reachable": True,
                    "endpoint": f"http://{host}:{port}",
                    "via_prometheus": True,
                },
                200,
            )
    except Exception:
        pass

    return api_response(
        False,
        "Hardware monitoring endpoint unavailable. Ensure LibreHardwareMonitor is running with Web Server enabled on port 8085.",
        {
            "reachable": False,
            "endpoint": url,
        },
        400,
    )


@setup_bp.route("/verify-prom-target", methods=["POST"])
@jwt_required_api
def verify_prom_target():
    """Verifies that the target is registered in Prometheus and checks scrape status."""
    data = request.get_json() or {}
    instance = str(data.get("instance") or data.get("target") or "").strip()

    if not instance:
        return api_response(False, "Target instance is required (e.g. 100.84.0.9:9182)", None, 400)

    service = PrometheusService()
    try:
        active = service.active_targets()
    except PrometheusUnavailable as exc:
        return api_response(False, f"Prometheus is unavailable: {exc}", None, 503)

    target_info = None
    for t in active:
        scrape_url = t.get("scrapeUrl", "")
        labels = t.get("labels", {})
        t_instance = labels.get("instance", "")

        if instance in t_instance or instance in scrape_url:
            target_info = t
            break

    if target_info:
        health = target_info.get("health", "unknown")
        last_scrape = target_info.get("lastScrape")
        last_error = target_info.get("lastError", "")
        return api_response(
            True,
            f"Prometheus target found with status: {health}",
            {
                "found": True,
                "health": health,
                "instance": instance,
                "scrape_url": target_info.get("scrapeUrl"),
                "last_scrape": last_scrape,
                "last_error": last_error,
                "scrape_interval": target_info.get("scrapeInterval"),
            },
            200,
        )
    else:
        return api_response(
            False,
            f"Target {instance} is not currently configured in Prometheus active scrape targets.",
            {
                "found": False,
                "instance": instance,
            },
            404,
        )


@setup_bp.route("/verify-all", methods=["POST"])
@jwt_required_api
def verify_all():
    """Runs full verification suite for a target server."""
    data = request.get_json() or {}
    server_id = data.get("server_id")
    host = str(data.get("host") or "").strip()
    port = data.get("port") or 9182

    server = None
    if server_id:
        server = Server.query.get(server_id)
        if server:
            host = server.ip_address or server.tailscale_ip or host
            port = server.exporter_port or port

    if not host and server:
        host = server.prometheus_instance.split(":")[0] if server.prometheus_instance else ""

    if not host:
        return api_response(False, "Server or Host is required", None, 400)

    target_instance = f"{host}:{port}"

    # 1. Database check
    db_ok = True
    try:
        from sqlalchemy import text
        db.session.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    # 2. Prometheus service check
    prom_service = PrometheusService()
    prom_ok = False
    target_in_prom = False
    prom_target_health = "unknown"
    try:
        targets = prom_service.active_targets()
        prom_ok = True
        for t in targets:
            if target_instance in t.get("labels", {}).get("instance", "") or target_instance in t.get("scrapeUrl", ""):
                target_in_prom = True
                prom_target_health = t.get("health", "unknown")
                break
    except Exception:
        prom_ok = False

    # 3. Direct Windows Exporter check
    exporter_ok = False
    exporter_latency = None
    try:
        res = requests.get(f"http://{host}:{port}/metrics", timeout=4)
        if res.status_code == 200 and ("windows_" in res.text or "go_" in res.text):
            exporter_ok = True
            exporter_latency = int(res.elapsed.total_seconds() * 1000)
    except Exception:
        exporter_ok = False

    # 4. Hardware Monitor check
    lhm_ok = False
    try:
        lhm_res = requests.get(f"http://{host}:8085/data.json", timeout=3)
        if lhm_res.status_code == 200:
            lhm_ok = True
    except Exception:
        pass
    if not lhm_ok and prom_ok:
        try:
            q = prom_service.query('lhm_cpu_temperature_celsius')
            if q and len(q) > 0:
                lhm_ok = True
        except Exception:
            pass

    # 5. Metrics availability in Prometheus
    metrics_ok = False
    if prom_ok:
        try:
            q = prom_service.query(f'up{{instance="{target_instance}"}}')
            if q and str(q[0].get("value", [None, None])[-1]) == "1":
                metrics_ok = True
        except Exception:
            metrics_ok = False

    # Calculate overall completion
    steps = {
        "step1_server_registered": server is not None,
        "step2_exporter_reachable": exporter_ok,
        "step3_hardware_monitor": lhm_ok,
        "step4_prometheus_target": target_in_prom and (prom_target_health == "up" or metrics_ok),
        "step5_connectivity": db_ok and prom_ok,
        "step6_metrics_flowing": metrics_ok or exporter_ok,
    }

    all_healthy = steps["step1_server_registered"] and (steps["step2_exporter_reachable"] or steps["step4_prometheus_target"]) and steps["step5_connectivity"]

    return api_response(
        True,
        "Full verification completed",
        {
            "server": server.to_dict() if server else {"name": host, "host": host, "port": port},
            "target": target_instance,
            "all_healthy": all_healthy,
            "status": "complete" if all_healthy else "incomplete",
            "components": {
                "database": "Connected" if db_ok else "Unavailable",
                "prometheus": "Available" if prom_ok else "Unavailable",
                "windows_exporter": "Online" if (exporter_ok or prom_target_health == "up") else "Offline",
                "hardware_monitoring": "Available" if lhm_ok else "Unavailable",
                "prometheus_target": prom_target_health.capitalize() if target_in_prom else "Not Found",
                "metrics_stream": "Streaming" if metrics_ok else "Awaiting Scrape",
            },
            "steps": steps,
        },
        200,
    )

