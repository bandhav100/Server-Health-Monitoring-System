from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from flask_jwt_extended import verify_jwt_in_request
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


TARGET_SERVERS = [
    {
        "hostname": "Bandhav",
        "ip": "100.84.0.9",
        "instance": "100.84.0.9:9182",
        "environment": "Production",
        "has_lhm": True,
    },
    {
        "hostname": "Abhi",
        "ip": "100.95.242.5",
        "instance": "100.95.242.5:9182",
        "environment": "Production",
        "has_lhm": False,
    },
    {
        "hostname": "Manju",
        "ip": "100.104.89.32",
        "instance": "100.104.89.32:9182",
        "environment": "Staging",
        "has_lhm": False,
    },
    {
        "hostname": "Sai Vinay",
        "ip": "100.102.76.81",
        "instance": "100.102.76.81:9182",
        "environment": "Production",
        "has_lhm": False,
    },
    {
        "hostname": "Navadeep",
        "ip": "100.72.224.107",
        "instance": "100.72.224.107:9182",
        "environment": "Production",
        "has_lhm": False,
    },
]


def _format_uptime_str(seconds):
    if seconds is None or seconds < 0:
        return "--"
    total_minutes = int(seconds // 60)
    days = total_minutes // 1440
    hours = (total_minutes % 1440) // 60
    minutes = total_minutes % 60
    if days > 0:
        return f"{days}d {hours}h {minutes}m"
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


def _query_vector_map(service, expr):
    try:
        results = service.query(expr)
        mapping = {}
        for item in results:
            inst = item.get("metric", {}).get("instance", "")
            val = item.get("value", [None, None])[-1]
            if inst and val is not None:
                try:
                    mapping[inst] = float(val)
                except (ValueError, TypeError):
                    pass
        return mapping
    except Exception:
        return {}


def _query_scalar_val(service, expr):
    try:
        results = service.query(expr)
        if results:
            val = results[0].get("value", [None, None])[-1]
            return float(val) if val is not None else None
    except Exception:
        pass
    return None


@dashboard_bp.route("/live", methods=["GET"])
def live_all():
    """Get live metrics for all Prometheus target servers."""
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        pass

    service = PrometheusService()

    up_map = _query_vector_map(service, 'up{job="windows_exporter"}')
    cpu_map = _query_vector_map(service, '100 - (avg by(instance)(rate(windows_cpu_time_total{mode="idle"}[5m])) * 100)')
    ram_map = _query_vector_map(service, '100 * (1 - windows_memory_physical_free_bytes / windows_memory_physical_total_bytes)')
    if not ram_map:
        ram_map = _query_vector_map(service, '100 * (1 - windows_os_physical_memory_free_bytes / windows_cs_physical_memory_bytes)')
    disk_map = _query_vector_map(service, '100 * (1 - windows_logical_disk_free_bytes{volume="C:"} / windows_logical_disk_size_bytes{volume="C:"})')
    uptime_map = _query_vector_map(service, 'time() - windows_system_system_up_time')
    if not uptime_map:
        uptime_map = _query_vector_map(service, 'time() - windows_system_boot_time_timestamp')
    processes_map = _query_vector_map(service, 'windows_system_processes')
    threads_map = _query_vector_map(service, 'windows_system_threads')
    csw_map = _query_vector_map(service, 'rate(windows_system_context_switches_total[5m])')
    queue_map = _query_vector_map(service, 'windows_system_processor_queue_length')
    syscalls_map = _query_vector_map(service, 'rate(windows_system_system_calls_total[5m])')
    exceptions_map = _query_vector_map(service, 'rate(windows_system_exception_dispatches_total[5m])')
    net_in_map = _query_vector_map(service, 'sum by(instance)(rate(windows_net_bytes_received_total[5m])) / 1024 / 1024')
    net_out_map = _query_vector_map(service, 'sum by(instance)(rate(windows_net_bytes_sent_total[5m])) / 1024 / 1024')
    disk_read_map = _query_vector_map(service, 'rate(windows_logical_disk_read_bytes_total{volume="C:"}[5m]) / 1024 / 1024')
    disk_write_map = _query_vector_map(service, 'rate(windows_logical_disk_write_bytes_total{volume="C:"}[5m]) / 1024 / 1024')

    lhm_cpu_temp = _query_scalar_val(service, 'lhm_cpu_temperature_celsius{sensorName="Core (Tctl/Tdie)"}')
    if lhm_cpu_temp is None:
        lhm_cpu_temp = _query_scalar_val(service, 'avg(lhm_cpu_temperature_celsius)')
    lhm_gpu_usage = _query_scalar_val(service, 'lhm_gpuamd_load_percent{sensorName="GPU Core"}')
    if lhm_gpu_usage is None:
        lhm_gpu_usage = _query_scalar_val(service, 'avg(lhm_gpuamd_load_percent)')
    lhm_gpu_clock = _query_scalar_val(service, 'lhm_gpuamd_clock_hertz{sensorName="GPU Core"} / 1000000000')
    if lhm_gpu_clock is None:
        lhm_gpu_clock = _query_scalar_val(service, 'avg(lhm_gpuamd_clock_hertz) / 1000000000')
    lhm_gpu_voltage = _query_scalar_val(service, 'lhm_gpuamd_voltage_volts{sensorName="GPU Core"}')
    if lhm_gpu_voltage is None:
        lhm_gpu_voltage = _query_scalar_val(service, 'avg(lhm_gpuamd_voltage_volts)')
    lhm_gpu_memory = _query_scalar_val(service, 'lhm_gpuamd_smalldata_bytes{sensorName="GPU Memory Used"} / 1048576')
    if lhm_gpu_memory is None:
        lhm_gpu_memory = _query_scalar_val(service, 'avg(lhm_gpuamd_smalldata_bytes) / 1048576')
    lhm_ssd_temp = _query_scalar_val(service, 'lhm_storage_temperature_celsius{sensorName="Composite Temperature"}')
    if lhm_ssd_temp is None:
        lhm_ssd_temp = _query_scalar_val(service, 'avg(lhm_storage_temperature_celsius)')

    # Fallback to direct lhm-exporter scrape if Prometheus didn't return any LHM gauge
    if any(v is None for v in [lhm_cpu_temp, lhm_gpu_usage, lhm_gpu_clock, lhm_gpu_voltage, lhm_gpu_memory, lhm_ssd_temp]):
        try:
            import requests as req
            resp = req.get("http://lhm-exporter:9105/metrics", timeout=2)
            if resp.ok:
                for line in resp.text.splitlines():
                    if line.startswith("#"):
                        continue
                    parts = line.split()
                    if len(parts) >= 2:
                        try:
                            val = float(parts[-1])
                            if "lhm_cpu_temperature_celsius" in line and lhm_cpu_temp is None:
                                lhm_cpu_temp = val
                            elif "lhm_gpuamd_load_percent" in line and lhm_gpu_usage is None:
                                lhm_gpu_usage = val
                            elif "lhm_gpuamd_clock_hertz" in line and lhm_gpu_clock is None:
                                lhm_gpu_clock = val / 1000000000.0
                            elif "lhm_gpuamd_voltage_volts" in line and lhm_gpu_voltage is None:
                                lhm_gpu_voltage = val
                            elif "lhm_gpuamd_smalldata_bytes" in line and lhm_gpu_memory is None:
                                lhm_gpu_memory = val / 1048576.0
                            elif "lhm_storage_temperature_celsius" in line and lhm_ssd_temp is None:
                                lhm_ssd_temp = val
                        except (ValueError, TypeError):
                            pass
        except Exception:
            pass

    def r(val, digits=2):
        return round(val, digits) if isinstance(val, (int, float)) else None

    db_servers = {}
    try:
        db_servers = {s.tailscale_ip or s.ip_address: s for s in Server.query.all()}
    except Exception:
        pass

    servers_data = []
    for s in TARGET_SERVERS:
        inst = s["instance"]
        ip = s["ip"]
        db_s = db_servers.get(ip)

        # Build candidate instances in Prometheus
        candidates = [inst, f"{ip}:9182"]
        if s.get("has_lhm") or s["hostname"].lower() in {"bandhav", "localhost"}:
            candidates.extend(["host.docker.internal:9182", "localhost:9182", "127.0.0.1:9182"])

        # Determine the active lookup instance
        lookup_inst = inst
        for cand in candidates:
            if up_map.get(cand) == 1.0:
                lookup_inst = cand
                break
        else:
            for cand in candidates:
                if cand in cpu_map or cand in ram_map or cand in disk_map:
                    lookup_inst = cand
                    break

        is_up = up_map.get(lookup_inst) == 1.0 or any(up_map.get(cand) == 1.0 for cand in candidates)
        status = "Healthy" if is_up else "Offline"

        raw_uptime = uptime_map.get(lookup_inst)
        fmt_uptime = _format_uptime_str(raw_uptime) if raw_uptime is not None else "--"

        has_lhm = s["has_lhm"]
        # If server is online, fill offline/missing hardware metrics with active telemetry from exporter
        use_lhm = has_lhm or is_up
        metrics = {
            "cpu": r(cpu_map.get(lookup_inst), 1),
            "ram": r(ram_map.get(lookup_inst), 1),
            "disk": r(disk_map.get(lookup_inst), 1),
            "uptime": fmt_uptime,
            "cpuTemp": r(lhm_cpu_temp, 1) if use_lhm else None,
            "gpuUsage": r(lhm_gpu_usage, 0) if use_lhm else None,
            "gpuClock": r(lhm_gpu_clock, 2) if use_lhm else None,
            "gpuVoltage": r(lhm_gpu_voltage, 3) if use_lhm else None,
            "gpuMemory": r(lhm_gpu_memory, 0) if use_lhm else None,
            "ssdTemp": r(lhm_ssd_temp, 0) if use_lhm else None,
            "networkIn": r(net_in_map.get(lookup_inst), 2),
            "networkOut": r(net_out_map.get(lookup_inst), 2),
            "diskRead": r(disk_read_map.get(lookup_inst), 2),
            "diskWrite": r(disk_write_map.get(lookup_inst), 2),
            "processes": int(processes_map[lookup_inst]) if lookup_inst in processes_map else None,
            "threads": int(threads_map[lookup_inst]) if lookup_inst in threads_map else None,
            "contextSwitches": r(csw_map.get(lookup_inst), 0),
            "queueLength": r(queue_map.get(lookup_inst), 0),
            "systemCalls": r(syscalls_map.get(lookup_inst), 0),
            "exceptions": r(exceptions_map.get(lookup_inst), 2),
        }

        environment = s["environment"] if s.get("environment") else (db_s.environment if db_s and db_s.environment else "Production")

        servers_data.append({
            "id": db_s.id if db_s else None,
            "instance": lookup_inst,
            "hostname": s["hostname"],
            "ip": s["ip"],
            "environment": environment,
            "status": status,
            "metrics": metrics,
        })

    return jsonify(servers_data), 200


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
