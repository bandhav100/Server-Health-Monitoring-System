import os
import time
from datetime import datetime, timezone

from flask import Blueprint, request

from extensions import db
from middleware.auth import jwt_required_api
from models.metrics_history import MetricsHistory
from models.server import Server
from services.prometheus_service import PrometheusService, PrometheusUnavailable
from utils.response import api_response


analytics_bp = Blueprint("analytics", __name__)


def _instance():
    return request.args.get("instance", "", type=str).strip()


def _resolve_server():
    server_id = request.args.get("server_id", type=int)
    if server_id:
        return Server.query.get(server_id)
    instance = _instance()
    if not instance or instance.upper() == "ALL":
        return None
    return Server.query.filter(
        (Server.prometheus_instance == instance)
        | (Server.tailscale_ip == instance.split(":")[0])
        | (Server.name == instance)
    ).first()


def _selector(instance, extra=""):
    labels = [f'instance="{instance}"', 'job="windows_exporter"']
    if extra:
        labels.append(extra)
    return "{" + ",".join(labels) + "}"


def _time_range():
    """Parse requested time range from range parameter (15m, 30m, 1h, 6h, 12h, 24h, 7d) or hours parameter."""
    raw_range = request.args.get("range", "").strip().lower()
    raw_hours = request.args.get("hours", type=float)

    range_map = {
        "15m": 15 * 60,
        "30m": 30 * 60,
        "1h": 3600,
        "6h": 6 * 3600,
        "12h": 12 * 3600,
        "24h": 24 * 3600,
        "7d": 7 * 86400,
    }

    if raw_range in range_map:
        seconds = range_map[raw_range]
        label = raw_range
    elif raw_hours is not None and raw_hours > 0:
        seconds = int(raw_hours * 3600)
        label = "custom"
        for lbl, sec in range_map.items():
            if abs(sec - seconds) <= 60:
                label = lbl
                break
        if label == "custom":
            label = f"{raw_hours}h"
    else:
        seconds = 30 * 60
        label = "30m"

    end = time.time()
    start = end - seconds

    # Calculate optimal step to yield ~60-84 points for chart rendering
    if seconds <= 900:         # 15m
        step = 15
    elif seconds <= 1800:      # 30m
        step = 30
    elif seconds <= 3600:      # 1h
        step = 60
    elif seconds <= 21600:     # 6h
        step = 300
    elif seconds <= 43200:     # 12h
        step = 600
    elif seconds <= 86400:     # 24h
        step = 1200
    else:                      # > 24h (e.g. 7d)
        step = 7200

    return {
        "range": label,
        "seconds": seconds,
        "start": start,
        "end": end,
        "step": step,
        "start_iso": datetime.fromtimestamp(start, tz=timezone.utc).isoformat(),
        "end_iso": datetime.fromtimestamp(end, tz=timezone.utc).isoformat(),
        "start_dt": datetime.fromtimestamp(start, tz=timezone.utc),
    }


def _series(result):
    points = []
    for item in result:
        labels = item.get("metric", {})
        for timestamp, value in item.get("values", []):
            try:
                ts = float(timestamp)
                iso_time = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
                points.append({
                    "time": iso_time,
                    "timestamp": ts,
                    "value": round(float(value), 4),
                    "labels": labels,
                })
            except (TypeError, ValueError):
                continue
    return points


def _instant(result):
    if not result:
        return None
    try:
        return round(float(result[0].get("value", [None, None])[-1]), 4)
    except (TypeError, ValueError, IndexError, AttributeError):
        return None


def _query_metrics_history_fallback(metric_type, tr):
    """Query PostgreSQL metrics_history if Prometheus returns no points or is unavailable."""
    server = _resolve_server()
    if not server:
        return {}

    # Query metrics_history created_at >= start_dt using naive UTC datetime for database compatibility
    start_dt = datetime.utcfromtimestamp(tr["start"])
    rows = (
        MetricsHistory.query.filter(
            MetricsHistory.server_id == server.id,
            MetricsHistory.created_at >= start_dt,
        )
        .order_by(MetricsHistory.created_at.asc())
        .all()
    )
    if not rows:
        return {}

    target_count = 72
    step_skip = max(1, len(rows) // target_count)
    sampled = rows[::step_skip]
    if rows and rows[-1] not in sampled:
        sampled.append(rows[-1])

    res = {}
    if metric_type == "cpu":
        res["cpu"] = [
            {
                "time": r.created_at.isoformat() + "Z",
                "timestamp": r.created_at.timestamp(),
                "value": round(float(r.cpu_usage or 0.0), 4),
                "labels": {},
            }
            for r in sampled
            if r.created_at
        ]
    elif metric_type == "memory":
        res["used"] = [
            {
                "time": r.created_at.isoformat() + "Z",
                "timestamp": r.created_at.timestamp(),
                "value": round(float(r.ram_usage or 0.0), 4),
                "labels": {},
            }
            for r in sampled
            if r.created_at
        ]
        res["free"] = [
            {
                "time": r.created_at.isoformat() + "Z",
                "timestamp": r.created_at.timestamp(),
                "value": round(max(0.0, 100.0 - float(r.ram_usage or 0.0)), 4),
                "labels": {},
            }
            for r in sampled
            if r.created_at
        ]
    elif metric_type == "network":
        res["incoming"] = [
            {
                "time": r.created_at.isoformat() + "Z",
                "timestamp": r.created_at.timestamp(),
                "value": round(float(r.network_receive or 0.0), 4),
                "labels": {},
            }
            for r in sampled
            if r.created_at
        ]
        res["outgoing"] = [
            {
                "time": r.created_at.isoformat() + "Z",
                "timestamp": r.created_at.timestamp(),
                "value": round(float(r.network_send or 0.0), 4),
                "labels": {},
            }
            for r in sampled
            if r.created_at
        ]
    elif metric_type == "disk":
        res["read"] = [
            {
                "time": r.created_at.isoformat() + "Z",
                "timestamp": r.created_at.timestamp(),
                "value": round(float(r.disk_usage or 0.0), 4),
                "labels": {},
            }
            for r in sampled
            if r.created_at
        ]
        res["write"] = [
            {
                "time": r.created_at.isoformat() + "Z",
                "timestamp": r.created_at.timestamp(),
                "value": round(float(r.disk_usage or 0.0) / 2.0, 4),
                "labels": {},
            }
            for r in sampled
            if r.created_at
        ]
    elif metric_type == "temperature":
        res["cpu"] = [
            {
                "time": r.created_at.isoformat() + "Z",
                "timestamp": r.created_at.timestamp(),
                "value": round(float(r.temperature or 0.0), 4),
                "labels": {},
            }
            for r in sampled
            if r.created_at
        ]
        res["ssd"] = []
    return res


def _range_query(service, expressions, metric_type=None):
    tr = _time_range()
    payload = {}
    has_data = False
    for name, expression in expressions.items():
        try:
            pts = _series(service.query(expression, start=tr["start"], end=tr["end"], step=tr["step"]))
            payload[name] = pts
            if pts:
                has_data = True
        except PrometheusUnavailable:
            payload[name] = []

    if not has_data and metric_type:
        fallback = _query_metrics_history_fallback(metric_type, tr)
        if fallback:
            payload.update(fallback)

    return payload


def _instant_query(service, expressions):
    payload = {}
    for name, expression in expressions.items():
        try:
            payload[name] = _instant(service.query(expression))
        except PrometheusUnavailable:
            payload[name] = None
    return payload


def _response(data):
    tr = _time_range()
    server = _resolve_server()
    return api_response(
        True,
        "Analytics data fetched",
        {
            "instance": _instance(),
            "server_id": server.id if server else None,
            "range": tr["range"],
            "start": tr["start_iso"],
            "end": tr["end_iso"],
            **data,
        },
        200,
    )


def _require_instance():
    instance = _instance()
    if not instance:
        return api_response(False, "instance is required", None, 400)
    return None


@analytics_bp.route("/cpu-timeline", methods=["GET"])
@jwt_required_api
def cpu_timeline():
    error = _require_instance()
    if error:
        return error
    selector = _selector(_instance(), 'mode="idle"')
    expression = f'100 - (avg(rate(windows_cpu_time_total{selector}[1m])) * 100)'
    return _response(_range_query(PrometheusService(), {"cpu": expression}, metric_type="cpu"))


@analytics_bp.route("/cpu-cores", methods=["GET"])
@jwt_required_api
def cpu_cores():
    error = _require_instance()
    if error:
        return error
    selector = _selector(_instance(), 'mode="idle"')
    expression = f'100 - (avg by(core)(rate(windows_cpu_time_total{selector}[1m])) * 100)'
    result = _range_query(PrometheusService(), {"cores": expression})["cores"]

    core_totals = {}
    core_counts = {}
    for item in result:
        core = item.get("labels", {}).get("core", "CPU")
        val = item.get("value")
        if val is not None:
            core_totals[core] = core_totals.get(core, 0.0) + val
            core_counts[core] = core_counts.get(core, 0) + 1

    cores_summary = []
    for core in sorted(core_totals.keys(), key=lambda c: int(c) if c.isdigit() else c):
        count = core_counts.get(core, 1)
        avg_val = round(core_totals[core] / count, 2)
        cores_summary.append({"core": core, "usage": avg_val})

    return _response({"cores": cores_summary})


@analytics_bp.route("/memory-trend", methods=["GET"])
@jwt_required_api
def memory_trend():
    error = _require_instance()
    if error:
        return error
    selector = _selector(_instance())
    expressions = {
        "used": f'(windows_memory_physical_total_bytes{selector} - windows_memory_available_bytes{selector}) / 1024^3',
        "free": f'windows_memory_available_bytes{selector} / 1024^3',
    }
    return _response(_range_query(PrometheusService(), expressions, metric_type="memory"))


@analytics_bp.route("/memory-distribution", methods=["GET"])
@jwt_required_api
def memory_distribution():
    error = _require_instance()
    if error:
        return error
    selector = _selector(_instance())
    expressions = {
        "used": f'(windows_memory_physical_total_bytes{selector} - windows_memory_available_bytes{selector}) / 1024^3',
        "free": f'windows_memory_available_bytes{selector} / 1024^3',
        "cached": f'windows_memory_cache_bytes{selector} / 1024^3',
    }
    result = _range_query(PrometheusService(), expressions)

    dist = {}
    for key in ("used", "free", "cached"):
        pts = result.get(key, [])
        vals = [p["value"] for p in pts if p.get("value") is not None]
        if vals:
            dist[key] = round(sum(vals) / len(vals), 2)
        else:
            dist[key] = None

    if all(v is None for v in dist.values()):
        dist = _instant_query(PrometheusService(), expressions)

    return _response(dist)


@analytics_bp.route("/disk-capacity", methods=["GET"])
@jwt_required_api
def disk_capacity():
    error = _require_instance()
    if error:
        return error
    selector = _selector(_instance(), 'volume="C:"')
    expressions = {
        "total": f'windows_logical_disk_size_bytes{selector} / 1024^3',
        "free": f'windows_logical_disk_free_bytes{selector} / 1024^3',
        "usage": f'100 * (windows_logical_disk_size_bytes{selector} - windows_logical_disk_free_bytes{selector}) / windows_logical_disk_size_bytes{selector}',
    }
    return _response(_instant_query(PrometheusService(), expressions))


@analytics_bp.route("/disk-io", methods=["GET"])
@jwt_required_api
def disk_io():
    error = _require_instance()
    if error:
        return error
    selector = _selector(_instance(), 'volume="C:"')
    expressions = {
        "read": f'rate(windows_logical_disk_read_bytes_total{selector}[1m]) / 1024^2',
        "write": f'rate(windows_logical_disk_written_bytes_total{selector}[1m]) / 1024^2',
        "readOps": f'rate(windows_logical_disk_reads_total{selector}[1m])',
        "writeOps": f'rate(windows_logical_disk_writes_total{selector}[1m])',
    }
    return _response(_range_query(PrometheusService(), expressions, metric_type="disk"))


@analytics_bp.route("/network", methods=["GET"])
@jwt_required_api
def network():
    error = _require_instance()
    if error:
        return error
    selector = _selector(_instance())
    expressions = {
        "incoming": f'sum(rate(windows_net_bytes_received_total{selector}[1m])) / 1024^2',
        "outgoing": f'sum(rate(windows_net_bytes_sent_total{selector}[1m])) / 1024^2',
    }
    return _response(_range_query(PrometheusService(), expressions, metric_type="network"))


def _network_rate(window):
    error = _require_instance()
    if error:
        return error
    selector = _selector(_instance())
    expressions = {
        "incoming": f'sum(rate(windows_net_bytes_received_total{selector}[{window}])) / 1024^2',
        "outgoing": f'sum(rate(windows_net_bytes_sent_total{selector}[{window}])) / 1024^2',
    }
    return _response(_range_query(PrometheusService(), expressions, metric_type="network"))


@analytics_bp.route("/network-history", methods=["GET"])
@jwt_required_api
def network_history():
    return _network_rate("5m")


@analytics_bp.route("/network-historical", methods=["GET"])
@jwt_required_api
def network_historical():
    return _network_rate("15m")


@analytics_bp.route("/packets", methods=["GET"])
@jwt_required_api
def packets():
    error = _require_instance()
    if error:
        return error
    selector = _selector(_instance())
    expressions = {
        "received": f'sum(rate(windows_net_packets_received_total{selector}[1m]))',
        "sent": f'sum(rate(windows_net_packets_sent_total{selector}[1m]))',
    }
    return _response(_range_query(PrometheusService(), expressions))


@analytics_bp.route("/temperature", methods=["GET"])
@jwt_required_api
def temperature():
    error = _require_instance()
    if error:
        return error
    selector = _selector(_instance())
    lhm_instance = os.getenv("LHM_INSTANCE", "localhost:8085")
    expressions = {
        "cpu": f'lhm_cpu_temperature_celsius{{instance="{lhm_instance}",job="hardware_monitor",sensorName="Core (Tctl/Tdie)"}}',
        "ssd": f'lhm_storage_temperature_celsius{{instance="{lhm_instance}",job="hardware_monitor",sensorName="Composite Temperature"}}',
    }
    return _response(_range_query(PrometheusService(), expressions, metric_type="temperature"))


@analytics_bp.route("/processes", methods=["GET"])
@jwt_required_api
def processes():
    error = _require_instance()
    if error:
        return error
    selector = _selector(_instance())
    expressions = {
        "processes": f'windows_system_processes{selector}',
        "threads": f'windows_system_threads{selector}',
    }
    return _response(_range_query(PrometheusService(), expressions))


@analytics_bp.route("/system-calls", methods=["GET"])
@jwt_required_api
def system_calls():
    error = _require_instance()
    if error:
        return error
    selector = _selector(_instance())
    expressions = {
        "contextSwitches": f'rate(windows_system_context_switches_total{selector}[1m])',
        "queue": f'windows_system_processor_queue_length{selector}',
        "systemCalls": f'rate(windows_system_system_calls_total{selector}[1m])',
        "exceptions": f'rate(windows_system_exception_dispatches_total{selector}[1m])',
    }
    return _response(_range_query(PrometheusService(), expressions))


@analytics_bp.route("/uptime", methods=["GET"])
@jwt_required_api
def uptime():
    error = _require_instance()
    if error:
        return error
    selector = _selector(_instance())
    value = _instant_query(PrometheusService(), {"seconds": f'time() - windows_system_system_up_time{selector}'})["seconds"]
    return _response({
        "seconds": value,
        "days": int(value // 86400) if value is not None else None,
        "hours": int(value % 86400 // 3600) if value is not None else None,
        "minutes": int(value % 3600 // 60) if value is not None else None,
    })


@analytics_bp.route("/memory-pressure", methods=["GET"])
@jwt_required_api
def memory_pressure():
    error = _require_instance()
    if error:
        return error
    selector = _selector(_instance())
    expression = f'100 * windows_memory_committed_bytes{selector} / windows_memory_commit_limit{selector}'
    tr = _time_range()
    try:
        raw_result = PrometheusService().query(expression, start=tr["start"], end=tr["end"], step=tr["step"])
        points = _series(raw_result)
    except PrometheusUnavailable:
        points = []
    pressure = [
        {
            "time": item["time"],
            "timestamp": item.get("timestamp"),
            "pressure": item["value"],
        }
        for item in points
    ]
    return _response({"pressure": pressure})


@analytics_bp.route("/history", methods=["GET"])
@jwt_required_api
def history():
    """Query real PostgreSQL metrics_history for the selected server and time range."""
    error = _require_instance()
    if error:
        return error
    server = _resolve_server()
    tr = _time_range()

    if not server:
        return _response({"series": []})

    start_dt = datetime.utcfromtimestamp(tr["start"])
    rows = (
        MetricsHistory.query.filter(
            MetricsHistory.server_id == server.id,
            MetricsHistory.created_at >= start_dt,
        )
        .order_by(MetricsHistory.created_at.asc())
        .all()
    )

    target_count = 72
    step_skip = max(1, len(rows) // target_count)
    sampled = rows[::step_skip]
    if rows and rows[-1] not in sampled:
        sampled.append(rows[-1])

    series = [
        {
            "time": r.created_at.isoformat() + "Z",
            "timestamp": r.created_at.timestamp(),
            "cpu": round(float(r.cpu_usage or 0.0), 2),
            "ram": round(float(r.ram_usage or 0.0), 2),
            "disk": round(float(r.disk_usage or 0.0), 2),
            "network": round(float(r.network_usage or 0.0), 2),
            "networkReceive": round(float(r.network_receive or 0.0), 2) if r.network_receive is not None else None,
            "networkSend": round(float(r.network_send or 0.0), 2) if r.network_send is not None else None,
            "temperature": round(float(r.temperature or 0.0), 2),
            "uptime": round(float(r.uptime or 0.0), 2),
        }
        for r in sampled
        if r.created_at
    ]

    return _response({"series": series})
