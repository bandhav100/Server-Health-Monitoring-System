from datetime import datetime, timedelta
from flask import Blueprint, request
from models.server import Server
from models.metrics_history import MetricsHistory
from models.alert import Alert
from models.audit_log import AuditLog
from middleware.auth import jwt_required_api
from utils.response import api_response
from utils.logger import logger
from services.prometheus_service import PrometheusService, PrometheusUnavailable
from services.prometheus_discovery_service import sync_servers
from services.tailscale_discovery_service import sync_machines, TailscaleUnavailable
from extensions import db


dashboard_bp = Blueprint("dashboard", __name__)


def _rounded(value):
    return round(value, 2) if value is not None else None


@dashboard_bp.route("/kpis", methods=["GET"])
@jwt_required_api
def kpis():
    """Get the live dashboard KPI values from Prometheus."""
    try:
        data = PrometheusService().get_dashboard_kpis(request.args.get("instance", "ALL"))
    except Exception as exc:
        logger.warning("Dashboard KPI query failed: %s", exc)
        return api_response(True, "Dashboard KPIs unavailable", {
            "status": "Unavailable", "cpu": 0, "ram": 0, "disk": 0,
            "uptime": 0, "uptimeHours": 0, "downloadMbps": 0,
            "uploadMbps": 0, "processes": 0, "healthyServers": 0,
            "offlineServers": 0, "totalServers": 0, "freeDiskGB": 0,
        }, 200)
    return api_response(True, "Dashboard KPIs fetched", data, 200)


@dashboard_bp.route("/charts/<hostname>", methods=["GET"])
@jwt_required_api
def charts(hostname):
    """Get 24-hour Prometheus chart data for a server hostname."""
    try:
        data = PrometheusService().get_chart_history(hostname)
    except Exception as exc:
        logger.warning("Dashboard chart query failed: %s", exc)
        logger.warning("Returning empty live chart series: %s", exc)
        return api_response(True, "Dashboard charts unavailable", {
            "cpu": [], "ram": [], "ramTrend": [], "disk": [],
            "uptimeTrend": [], "network": {"inbound": [], "outbound": []},
            "cpuByServer": [], "ramByServer": [], "diskByServer": [],
            "uptimeByServer": [], "ramDistribution": [], "serviceStates": [], "processes": [],
        }, 200)
    return api_response(True, "Dashboard charts fetched", data, 200)


@dashboard_bp.route("/charts", methods=["GET"])
@jwt_required_api
def filtered_charts():
    """Get dashboard chart series for ALL servers or one Prometheus instance."""
    try:
        data = PrometheusService().get_chart_history(
            request.args.get("instance", "ALL"),
            request.args.get("hours", 24, type=float),
        )
    except Exception as exc:
        logger.warning("Dashboard chart query failed: %s", exc)
        return api_response(True, "Dashboard charts unavailable", {
            "cpu": [], "ram": [], "ramTrend": [], "disk": [],
            "uptimeTrend": [], "network": {"inbound": [], "outbound": []},
            "cpuByServer": [], "ramByServer": [], "diskByServer": [],
            "uptimeByServer": [], "ramDistribution": [], "serviceStates": [], "processes": [],
        }, 200)
    return api_response(True, "Dashboard charts fetched", data, 200)


@dashboard_bp.route("/summary", methods=["GET"])
@jwt_required_api
def summary():
    """Get dashboard summary with aggregated metrics"""
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
    servers = Server.query.all()
    total_servers = len(servers)
    service = PrometheusService()
    snapshots = []
    for server in servers:
        try:
            snapshots.append(service.get_snapshot(server.prometheus_instance or server.name, server.prometheus_job))
        except PrometheusUnavailable:
            snapshots.append({"status": "down"})

    healthy_servers = sum(1 for snapshot in snapshots if snapshot.get("status") == "healthy")
    offline_servers = sum(1 for snapshot in snapshots if snapshot.get("status") in {"offline", "down"})
    warning_servers = sum(1 for snapshot in snapshots if snapshot.get("status") == "warning")
    critical_servers = sum(1 for snapshot in snapshots if snapshot.get("status") == "critical")

    def average(metric):
        values = [
            snapshot.get(metric)
            for snapshot in snapshots
            if snapshot.get("status") == "healthy" and snapshot.get(metric) is not None
        ]
        return round(sum(values) / len(values), 2) if values else None

    cpu_usage = average("cpu")
    ram_usage = average("ram")
    disk_usage = average("disk")
    network_usage = average("network")
    uptime = average("uptime")

    active_alerts = Alert.query.filter_by(acknowledged=False).count()
    
    # Calculate health score (0-100)
    health_values = [value for value in (cpu_usage, ram_usage, disk_usage) if value is not None]
    health_score = round(max(0, 100 - sum(health_values) / len(health_values)), 2) if health_values else None

    response = {
        "totalServers": total_servers,
        "healthyServers": healthy_servers,
        "warningServers": warning_servers,
        "criticalServers": critical_servers,
        "avgCpu": cpu_usage,
        "avgRam": ram_usage,
        "avgDisk": disk_usage,
        "avgNetwork": network_usage,
        "activeAlerts": active_alerts,
        "averageHealthScore": health_score,
        "healthScore": health_score,
        "serversOnline": healthy_servers,
        "offlineServers": offline_servers,
        "serversOffline": offline_servers,
        "uptime": uptime,
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
        "servers": [
            {
                "hostname": server.name,
                "ip": server.tailscale_ip,
                "instance": server.prometheus_instance,
                "status": snapshots[index].get("status", "offline"),
            }
            for index, server in enumerate(servers)
        ],
    }
    return api_response(True, "Dashboard summary fetched", response, 200)


@dashboard_bp.route("/<hostname>", methods=["GET"])
@jwt_required_api
def server_dashboard(hostname):
    server = Server.query.filter_by(name=hostname).first_or_404()
    snapshot = {"status": "offline"}
    try:
        snapshot = PrometheusService().get_snapshot(server.prometheus_instance or server.name, server.prometheus_job)
    except PrometheusUnavailable:
        pass
    return api_response(True, "Server dashboard fetched", {
        "hostname": server.name,
        "ip": server.tailscale_ip,
        "status": snapshot.get("status", "offline"),
        "os": server.operating_system or "Windows 11",
        "cpu": _rounded(snapshot.get("cpu")),
        "ram": _rounded(snapshot.get("ram")),
        "disk": _rounded(snapshot.get("disk")),
        "uptime": f'{snapshot["uptime"]:.1f} h' if snapshot.get("uptime") is not None else "Unavailable",
        "lastRefresh": datetime.utcnow().isoformat() + "Z",
    }, 200)


@dashboard_bp.route("/live/<int:server_id>", methods=["GET"])
@jwt_required_api
def live(server_id):
    """Get live metrics for a specific server"""
    server = Server.query.get_or_404(server_id)
    service = PrometheusService()
    try:
        metrics = service.get_instance_metrics(server.prometheus_instance or server.name, server.prometheus_job)
    except PrometheusUnavailable as exc:
        return api_response(False, f"Prometheus unavailable: {exc}", None, 503)

    response = {
        "server_id": server.id,
        "hostname": server.name,
        "ip": server.tailscale_ip,
        "server_name": server.name,
        "cpu": metrics.get("cpuUsage"),
        "ram": metrics.get("ramUsage"),
        "disk": metrics.get("diskUsage"),
        "cpuTemperature": metrics.get("cpuTemperature"),
        "gpuUsage": metrics.get("gpuUsage"),
        "gpuClock": metrics.get("gpuClock"),
        "gpuVoltage": metrics.get("gpuVoltage"),
        "gpuMemoryUsed": metrics.get("gpuMemoryUsed"),
        "ssdTemperature": metrics.get("ssdTemperature"),
        "network": metrics.get("networkUsage"),
        "temperature": metrics.get("temperature"),
        "uptime": metrics.get("uptime"),
        "status": metrics.get("status", "down"),
        "lastUpdated": datetime.utcnow().isoformat() + "Z"
    }
    return api_response(True, "Live metrics fetched", response, 200)


@dashboard_bp.route("/history/<int:server_id>", methods=["GET"])
@jwt_required_api
def history(server_id):
    """Get historical metrics for a specific server (last 24 data points)"""
    server = Server.query.get_or_404(server_id)
    
    # Get time window from query params (default 24 hours)
    hours = request.args.get('hours', 24, type=int)
    limit = request.args.get('limit', 24, type=int)
    
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    metrics = MetricsHistory.query.filter(
        MetricsHistory.server_id == server_id,
        MetricsHistory.created_at >= cutoff_time
    ).order_by(MetricsHistory.created_at.desc()).limit(limit).all()
    
    # Reverse to get chronological order.
    metrics_list = [
        {
            "cpu": _rounded(m.cpu_usage),
            "ram": _rounded(m.ram_usage),
            "disk": _rounded(m.disk_usage),
            "network": _rounded(m.network_usage),
            "networkReceive": _rounded(m.network_receive),
            "networkSend": _rounded(m.network_send),
            "temperature": _rounded(m.temperature),
            "uptime": _rounded(m.uptime),
            "timestamp": m.created_at.isoformat() + "Z" if m.created_at else datetime.utcnow().isoformat() + "Z"
        }
        for m in reversed(metrics)
    ]
    
    return api_response(True, "History fetched", metrics_list, 200)


@dashboard_bp.route("/activity", methods=["GET"])
@jwt_required_api
def activity():
    """Get activity timeline (audit logs)"""
    limit = request.args.get('limit', 50, type=int)
    
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    
    activity_list = [
        {
            "id": log.id,
            "actor": log.actor or "System",
            "action": log.action,
            "details": log.details,
            "timestamp": log.created_at.isoformat() + "Z" if log.created_at else datetime.utcnow().isoformat() + "Z"
        }
        for log in logs
    ]
    
    return api_response(True, "Activity fetched", activity_list, 200)
