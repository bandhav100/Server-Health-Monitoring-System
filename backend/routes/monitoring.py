from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from models.server import Server
from models.metrics_history import MetricsHistory
from middleware.auth import jwt_required_api
from services.prometheus_service import PrometheusService, PrometheusUnavailable
from utils.response import api_response
from utils.logger import logger


monitoring_bp = Blueprint("monitoring", __name__)
metrics_bp = Blueprint("metrics", __name__)


def _rounded(value):
    return round(value, 2) if value is not None else None


def _prometheus_history(server, metric, hours):
    points = PrometheusService().get_metric_history(
        metric, server.prometheus_instance, server.prometheus_job, hours
    )
    for point in points:
        point["hostname"] = point.get("hostname") or server.name
    return points


@monitoring_bp.route("/live", methods=["GET"])
@jwt_required_api
def get_live_metrics_by_instance():
    instance = request.args.get("instance", "ALL", type=str).strip() or "ALL"
    server = None if instance.upper() == "ALL" else Server.query.filter_by(prometheus_instance=instance).first()
    service = PrometheusService()
    try:
        metrics = service.get_instance_metrics(None if instance.upper() == "ALL" else instance, "windows_exporter")
    except PrometheusUnavailable as exc:
        return api_response(False, f"Prometheus unavailable: {exc}", None, 503)

    metrics.update({
        "hostname": server.name if server else ("All Servers" if instance.upper() == "ALL" else instance.split(":")[0]),
        "instance": instance,
        "status": metrics.get("status", "unknown").capitalize(),
        "cpu": metrics.get("cpuUsage"),
        "ram": metrics.get("ramUsage"),
        "disk": metrics.get("diskUsage"),
        "cpuTemperature": metrics.get("cpuTemperature"),
        "gpuUsage": metrics.get("gpuUsage"),
        "gpuClock": metrics.get("gpuClock"),
        "gpuVoltage": metrics.get("gpuVoltage"),
        "gpuMemoryUsed": metrics.get("gpuMemoryUsed"),
        "ssdTemperature": metrics.get("ssdTemperature"),
        "networkIn": metrics.get("networkReceive"),
        "networkOut": metrics.get("networkSend"),
        "processes": metrics.get("processCount"),
        "services": metrics.get("serviceRunning"),
    })
    return api_response(True, "Live metrics fetched", metrics, 200)


@metrics_bp.route("/metrics/cpu-history", methods=["GET"])
@jwt_required_api
def get_cpu_history():
    hostname = request.args.get("hostname", "", type=str).strip()
    if not hostname:
        return jsonify({"success": False, "hostname": "", "history": [], "message": "hostname is required"}), 400

    try:
        history = PrometheusService().get_cpu_history(hostname)
    except PrometheusUnavailable as exc:
        return jsonify({"success": False, "hostname": hostname, "history": [], "message": str(exc)}), 503

    return jsonify({"success": True, "hostname": hostname, "history": history}), 200


@monitoring_bp.route("/live/<int:server_id>", methods=["GET"])
@jwt_required_api
def get_live_metrics(server_id):
    """Get current live metrics for a server"""
    server = Server.query.get_or_404(server_id)
    
    service = PrometheusService()
    instance_name = server.prometheus_instance or server.name
    try:
        metrics = service.get_instance_metrics(instance_name, server.prometheus_job)
    except PrometheusUnavailable as exc:
        return api_response(False, f"Prometheus unavailable: {exc}", None, 503)
    
    response = {
        "server_id": server.id,
        "hostname": server.name,
        "server_name": server.name,
        "serverName": server.name,
        "ipAddress": server.tailscale_ip,
        "instance": instance_name,
        "cpu": metrics.get("cpuUsage"),
        "ram": metrics.get("ramUsage"),
        "disk": metrics.get("diskUsage"),
        "network": metrics.get("networkUsage"),
        "networkReceive": metrics.get("networkReceive"),
        "networkSend": metrics.get("networkSend"),
        "temperature": metrics.get("temperature"),
        "cpuTemperature": metrics.get("cpuTemperature"),
        "gpuUsage": metrics.get("gpuUsage"),
        "gpuClock": metrics.get("gpuClock"),
        "gpuVoltage": metrics.get("gpuVoltage"),
        "gpuMemoryUsed": metrics.get("gpuMemoryUsed"),
        "ssdTemperature": metrics.get("ssdTemperature"),
        "uptime": metrics.get("uptime"),
        "processCount": metrics.get("processCount"),
        "serviceRunning": metrics.get("serviceRunning"),
        "serviceStopped": metrics.get("serviceStopped"),
        "servicePaused": metrics.get("servicePaused"),
        "memoryTotal": metrics.get("memoryTotal"),
        "memoryFree": metrics.get("memoryFree"),
        "memoryCache": metrics.get("memoryCache"),
        "commitPressure": metrics.get("commitPressure"),
        "diskTotal": metrics.get("diskTotal"),
        "diskFree": metrics.get("diskFree"),
        "diskRead": metrics.get("diskRead"),
        "diskWrite": metrics.get("diskWrite"),
        "threads": metrics.get("threads"),
        "queueLength": metrics.get("queueLength"),
        "contextSwitches": metrics.get("contextSwitches"),
        "systemCalls": metrics.get("systemCalls"),
        "coreUsage": metrics.get("coreUsage", []),
        "status": metrics.get("status", "unknown"),
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    return api_response(True, "Live metrics fetched", response, 200)


@monitoring_bp.route("/cpu/<int:server_id>", methods=["GET"])
@jwt_required_api
def get_cpu_metrics(server_id):
    """Get historical CPU metrics for a server"""
    server = Server.query.get_or_404(server_id)
    
    hours = request.args.get('hours', 24, type=int)
    limit = request.args.get('limit', 24, type=int)
    
    try:
        data = _prometheus_history(server, "cpu", hours)[-limit:]
    except PrometheusUnavailable as exc:
        return api_response(False, f"Prometheus unavailable: {exc}", None, 503)
    
    return api_response(True, "CPU metrics fetched", data, 200)


@monitoring_bp.route("/memory/<int:server_id>", methods=["GET"])
@jwt_required_api
def get_memory_metrics(server_id):
    """Get historical memory metrics for a server"""
    server = Server.query.get_or_404(server_id)
    
    hours = request.args.get('hours', 24, type=int)
    limit = request.args.get('limit', 24, type=int)
    
    try:
        data = _prometheus_history(server, "ram", hours)[-limit:]
    except PrometheusUnavailable as exc:
        return api_response(False, f"Prometheus unavailable: {exc}", None, 503)
    
    return api_response(True, "Memory metrics fetched", data, 200)


@monitoring_bp.route("/disk/<int:server_id>", methods=["GET"])
@jwt_required_api
def get_disk_metrics(server_id):
    """Get historical disk metrics for a server"""
    server = Server.query.get_or_404(server_id)
    
    hours = request.args.get('hours', 24, type=int)
    limit = request.args.get('limit', 24, type=int)
    
    try:
        data = _prometheus_history(server, "disk", hours)[-limit:]
    except PrometheusUnavailable as exc:
        return api_response(False, f"Prometheus unavailable: {exc}", None, 503)
    
    return api_response(True, "Disk metrics fetched", data, 200)


@monitoring_bp.route("/network/<int:server_id>", methods=["GET"])
@jwt_required_api
def get_network_metrics(server_id):
    """Get historical network metrics for a server"""
    server = Server.query.get_or_404(server_id)
    
    hours = request.args.get('hours', 24, type=int)
    limit = request.args.get('limit', 24, type=int)
    
    try:
        data = [
            {**point, "in": point["value"], "out": point["value"]}
            for point in _prometheus_history(server, "network", hours)[-limit:]
        ]
    except PrometheusUnavailable as exc:
        return api_response(False, f"Prometheus unavailable: {exc}", None, 503)
    
    return api_response(True, "Network metrics fetched", data, 200)


@monitoring_bp.route("/processes/<int:server_id>", methods=["GET"])
@jwt_required_api
def get_processes(server_id):
    """Get running processes for a server"""
    server = Server.query.get_or_404(server_id)
    
    service = PrometheusService()
    instance_name = server.prometheus_instance or server.name
    try:
        processes = {
            "cpu": service.get_top_cpu_processes(instance_name, server.prometheus_job),
            "memory": service.get_top_memory_processes(instance_name, server.prometheus_job),
        }
    except PrometheusUnavailable as exc:
        return api_response(False, f"Prometheus unavailable: {exc}", None, 503)
    return api_response(True, "Processes fetched", processes, 200)
