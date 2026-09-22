from datetime import datetime
import time

from flask import Blueprint, request

from middleware.auth import jwt_required_api
from services.prometheus_service import PrometheusService, PrometheusUnavailable
from utils.response import api_response


live_bp = Blueprint("live", __name__)


def _instance():
    return request.args.get("instance", "", type=str).strip()


def _selector(instance, extra=""):
    labels = [f'instance="{instance}"', f'job="{request.args.get("job", "windows_exporter")}"']
    if extra:
        labels.append(extra)
    return "{" + ",".join(labels) + "}"


def _value(result):
    if not result:
        return None
    try:
        return float(result[0].get("value", [None, None])[-1])
    except (TypeError, ValueError, IndexError, AttributeError):
        return None


def _series(result):
    values = []
    for item in result:
        try:
            values.append({
                "labels": item.get("metric", {}),
                "value": float(item.get("value", [None, None])[-1]),
            })
        except (TypeError, ValueError, IndexError, AttributeError):
            continue
    return values


def _query_values(expressions, instance):
    service = PrometheusService()
    data = {}
    errors = {}
    for name, expression in expressions.items():
        try:
            data[name] = _value(service.query(expression))
        except PrometheusUnavailable as exc:
            data[name] = None
            errors[name] = str(exc)
    return {"data": data, "errors": errors}


def _query_series(expressions, instance):
    service = PrometheusService()
    data = {}
    errors = {}
    for name, expression in expressions.items():
        try:
            data[name] = _series(service.query(expression))
        except PrometheusUnavailable as exc:
            data[name] = []
            errors[name] = str(exc)
    return {"data": data, "errors": errors}


def _response(payload, message="Live data fetched"):
    return api_response(True, message, payload, 200)


@live_bp.route("/live/kpis", methods=["GET"])
@jwt_required_api
def live_kpis():
    instance = _instance()
    if not instance:
        return api_response(False, "instance is required", None, 400)
    selector = _selector(instance)
    expressions = {
        "cpuUsage": f'100 - avg(rate(windows_cpu_time_total{_selector(instance, "mode=\\\"idle\\\"")}[5m])) * 100',
        "ramUsage": f'100 * (1 - windows_os_physical_memory_free_bytes{selector} / windows_cs_physical_memory_bytes{selector})',
        "diskUsage": f'100 * (1 - windows_logical_disk_free_bytes{_selector(instance, "volume=\\\"C:\\\"")} / windows_logical_disk_size_bytes{_selector(instance, "volume=\\\"C:\\\"")})',
        "temperature": f'windows_thermalzone_temperature_celsius{selector}',
        "networkIncoming": f'sum(rate(windows_net_bytes_received_total{selector}[5m]))',
        "networkOutgoing": f'sum(rate(windows_net_bytes_sent_total{selector}[5m]))',
        "diskRead": f'sum(rate(windows_logical_disk_read_bytes_total{selector}[5m]))',
        "diskWrite": f'sum(rate(windows_logical_disk_write_bytes_total{selector}[5m]))',
        "processes": f'windows_system_processes{selector}',
        "threads": f'windows_system_threads{selector}',
        "contextSwitches": f'rate(windows_system_context_switches_total{selector}[5m])',
        "queue": f'windows_system_processor_queue_length{selector}',
        "uptimeHours": f'(time() - windows_system_boot_time_timestamp{selector}) / 3600',
        "systemCalls": f'rate(windows_system_system_calls_total{selector}[5m])',
        "exceptions": f'rate(windows_system_exception_dispatches_total{selector}[5m])',
        "tcpConnections": f'windows_net_tcp_connections_established{selector}',
        "tcpRetransmissions": f'rate(windows_net_tcp_segments_retransmitted_total{selector}[5m])',
        "memoryFreeGb": f'windows_os_physical_memory_free_bytes{selector} / 1024 / 1024 /1024',
        "memoryUsedGb": f'(windows_cs_physical_memory_bytes{selector} - windows_os_physical_memory_free_bytes{selector}) /1024/1024/1024',
        "up": f'up{selector}',
    }
    payload = _query_values(expressions, instance)
    payload.update({"instance": instance, "job": request.args.get("job", "windows_exporter"), "timestamp": datetime.utcnow().isoformat() + "Z"})
    return _response(payload)


@live_bp.route("/live/cores", methods=["GET"])
@jwt_required_api
def live_cores():
    instance = _instance()
    selector = _selector(instance, 'mode="idle"')
    result = _query_series({"cores": f'100 - rate(windows_cpu_time_total{selector}[5m]) * 100'}, instance)
    return _response(result)


@live_bp.route("/live/disks", methods=["GET"])
@jwt_required_api
def live_disks():
    instance = _instance()
    expression = f'100 * (1 - windows_logical_disk_free_bytes{_selector(instance)} / windows_logical_disk_size_bytes{_selector(instance)})'
    return _response(_query_series({"usage": expression}, instance))


@live_bp.route("/live/network", methods=["GET"])
@jwt_required_api
def live_network():
    instance = _instance()
    expressions = {
        "incoming": f'sum(rate(windows_net_bytes_received_total{_selector(instance)}[1m]))',
        "outgoing": f'sum(rate(windows_net_bytes_sent_total{_selector(instance)}[1m]))',
    }
    return _response(_query_values(expressions, instance))


@live_bp.route("/live/processes/cpu", methods=["GET"])
@jwt_required_api
def live_cpu_processes():
    instance = _instance()
    expression = f'topk(10, 100 * rate(windows_process_cpu_time_total{_selector(instance, "mode!=\\\"idle\\\"")}[5m]))'
    return _response(_query_series({"processes": expression}, instance))


@live_bp.route("/live/processes/memory", methods=["GET"])
@jwt_required_api
def live_memory_processes():
    instance = _instance()
    expression = f'topk(10, windows_process_working_set_bytes{_selector(instance)} /1024/1024)'
    return _response(_query_series({"processes": expression}, instance))


@live_bp.route("/live/io", methods=["GET"])
@jwt_required_api
def live_io():
    instance = _instance()
    expressions = {
        "read": f'sum by(volume)(rate(windows_logical_disk_read_bytes_total{_selector(instance)}[5m]))',
        "write": f'sum by(volume)(rate(windows_logical_disk_write_bytes_total{_selector(instance)}[5m]))',
    }
    return _response(_query_series(expressions, instance))


@live_bp.route("/live/interfaces", methods=["GET"])
@jwt_required_api
def live_interfaces():
    instance = _instance()
    expressions = {
        "incoming": f'rate(windows_net_bytes_received_total{_selector(instance)}[5m])',
        "outgoing": f'rate(windows_net_bytes_sent_total{_selector(instance)}[5m])',
        "packetsReceived": f'rate(windows_net_packets_received_total{_selector(instance)}[5m])',
        "packetsSent": f'rate(windows_net_packets_sent_total{_selector(instance)}[5m])',
        "errors": f'rate(windows_net_packets_received_errors_total{_selector(instance)}[5m])',
    }
    return _response(_query_series(expressions, instance))


@live_bp.route("/live/services", methods=["GET"])
@jwt_required_api
def live_services():
    instance = _instance()
    return _response(_query_series({"states": f'windows_service_state{_selector(instance)}'}, instance))


@live_bp.route("/live/process-table", methods=["GET"])
@jwt_required_api
def live_process_table():
    instance = _instance()
    selector = _selector(instance)
    expressions = {
        "cpu": f'topk(10, 100 * rate(windows_process_cpu_time_total{_selector(instance, "mode!=\\\"idle\\\"")}[5m]))',
        "memory": f'topk(10, windows_process_working_set_bytes{selector} /1024/1024)',
        "threads": f'windows_process_threads{selector}',
        "privateMemory": f'windows_process_private_bytes{selector}',
        "handles": f'windows_process_handles{selector}',
    }
    return _response(_query_series(expressions, instance))


@live_bp.route("/live/alerts", methods=["GET"])
@jwt_required_api
def live_alerts():
    instance = _instance()
    selector = _selector(instance)
    expressions = {
        "cpu": f'100 - avg(rate(windows_cpu_time_total{_selector(instance, "mode=\\\"idle\\\"")}[5m])) * 100',
        "ram": f'100 * (1 - windows_os_physical_memory_free_bytes{selector} / windows_cs_physical_memory_bytes{selector})',
        "disk": f'100 * (1 - windows_logical_disk_free_bytes{_selector(instance, "volume=\\\"C:\\\"")} / windows_logical_disk_size_bytes{_selector(instance, "volume=\\\"C:\\\"")})',
        "queue": f'windows_system_processor_queue_length{selector}',
        "retransmissions": f'rate(windows_net_tcp_segments_retransmitted_total{selector}[5m])',
    }
    payload = _query_values(expressions, instance)
    alerts = []
    thresholds = [("cpu", "High CPU", 85), ("ram", "High RAM", 90), ("disk", "Disk Full", 90), ("queue", "Processor Queue", 5)]
    for key, title, threshold in thresholds:
        value = payload["data"].get(key)
        if value is not None and value > threshold:
            alerts.append({"title": title, "severity": "critical" if value > threshold + 5 else "warning", "value": value, "threshold": threshold})
    payload["alerts"] = alerts
    return _response(payload)


@live_bp.route("/live/history", methods=["GET"])
@jwt_required_api
def live_history():
    instance = _instance()
    service = PrometheusService()
    end = time.time()
    start = end - (60 * 60)
    expressions = {
        "cpu": f'100 - avg(rate(windows_cpu_time_total{_selector(instance, "mode=\\\"idle\\\"")}[5m])) * 100',
        "diskRead": f'sum(rate(windows_logical_disk_read_bytes_total{_selector(instance)}[5m]))',
        "diskWrite": f'sum(rate(windows_logical_disk_write_bytes_total{_selector(instance)}[5m]))',
    }
    data, errors = {}, {}
    for name, expression in expressions.items():
        try:
            range_start = end - (30 * 60) if name == "cpu" else start
            results = service.query(expression, start=range_start, end=end, step=60)
            data[name] = [{"timestamp": float(point[0]), "value": float(point[1])} for point in (results[0].get("values", []) if results else [])]
        except (PrometheusUnavailable, TypeError, ValueError, IndexError):
            data[name] = []
            errors[name] = "Prometheus returned no historical data"
    return _response({"data": data, "errors": errors})
