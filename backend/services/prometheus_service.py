import time


def convert_series(results):
    output = []

    for item in results:
        metric = item.get("metric", {})
        hostname = metric.get("hostname") or metric.get("instance", "unknown").split(":")[0]
        try:
            value = round(float(item.get("value", [None, None])[-1]), 2)
        except (TypeError, ValueError):
            continue

        output.append({
            "hostname": hostname.replace("-1", ""),
            "value": value,
        })

    return output
from datetime import datetime
import json
from urllib.parse import urlparse

import requests
from flask import has_app_context
from config import Config


class PrometheusUnavailable(RuntimeError):
    """Raised when Prometheus cannot return a valid API response."""


def query_prometheus(query):
    """Safely execute an instant query and return an empty result on failure."""
    try:
        response = requests.get(
            f'{Config.PROMETHEUS_URL.rstrip("/")}/api/v1/query',
            params={"query": query},
            timeout=10,
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("status") != "success":
            return []
        return payload.get("data", {}).get("result", [])
    except (requests.RequestException, ValueError, TypeError):
        return []


class PrometheusService:
    _cache = {}
    _cache_ttl = 5

    def __init__(self, base_url=None):
        self.base_url = (base_url or Config.PROMETHEUS_URL).rstrip("/")

    def query(self, expr, start=None, end=None, step=None):
        range_query = start is not None and end is not None and step is not None
        endpoint = "/api/v1/query_range" if range_query else "/api/v1/query"
        params = {"query": expr}
        if range_query:
            params.update({"start": start, "end": end, "step": step})
        cache_key = (endpoint, tuple(sorted(params.items())))
        cached = self._cache.get(cache_key)
        if cached and time.monotonic() - cached[0] < self._cache_ttl:
            return cached[1]
        try:
            response = requests.get(f"{self.base_url}{endpoint}", params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            if data.get("status") != "success":
                raise PrometheusUnavailable(data.get("error", "Prometheus query failed"))
            result = data.get("data", {}).get("result", [])
            self._cache[cache_key] = (time.monotonic(), result)
            return result
        except PrometheusUnavailable:
            raise
        except (requests.RequestException, ValueError, TypeError) as exc:
            raise PrometheusUnavailable(str(exc)) from exc

    def active_targets(self):
        """Return Prometheus active scrape targets without filtering labels."""
        try:
            response = requests.get(f"{self.base_url}/api/v1/targets", params={"state": "active"}, timeout=10)
            response.raise_for_status()
            data = response.json()
            if data.get("status") != "success":
                raise PrometheusUnavailable(data.get("error", "Prometheus targets request failed"))
            return data.get("data", {}).get("activeTargets", [])
        except PrometheusUnavailable:
            raise
        except (requests.RequestException, ValueError, TypeError) as exc:
            raise PrometheusUnavailable(str(exc)) from exc

    def alert_rules(self):
        try:
            response = requests.get(f"{self.base_url}/api/v1/rules", timeout=10)
            response.raise_for_status()
            data = response.json()
            if data.get("status") != "success":
                return []
            alerts = []
            for group in data.get("data", {}).get("groups", []):
                for rule in group.get("rules", []):
                    if rule.get("type") != "alerting":
                        continue
                    for alert in rule.get("alerts", []):
                        if alert.get("state") not in {"pending", "firing"}:
                            continue
                        labels = alert.get("labels", {})
                        annotations = alert.get("annotations", {})
                        alerts.append({
                            "id": f'{labels.get("alertname", rule.get("name", "alert"))}:{alert.get("activeAt", "")}',
                            "hostname": labels.get("hostname") or labels.get("instance", "").split(":")[0],
                            "severity": labels.get("severity", "warning"),
                            "title": annotations.get("summary") or rule.get("name", "Prometheus alert"),
                            "current_value": alert.get("value"),
                            "threshold_value": annotations.get("threshold"),
                            "created_at": alert.get("activeAt"),
                            "instance": labels.get("instance"),
                        })
            return alerts
        except (requests.RequestException, ValueError, TypeError):
            return []

    def _build_selector(self, instance_name=None, job_name=None, extra=None):
        selectors = []
        if instance_name:
            selectors.append(f'instance="{instance_name}"')
        if job_name:
            selectors.append(f'job="{job_name}"')
        if extra:
            selectors.append(extra)
        if selectors:
            return "{" + ",".join(selectors) + "}"
        return "{}"

    @staticmethod
    def _value(result):
        if not result:
            return None
        value = result[0].get("value", [None, None])[-1]
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _safe_query(self, expr, start=None, end=None, step=None):
        try:
            return self.query(expr, start=start, end=end, step=step)
        except PrometheusUnavailable:
            return []

    def _metric(self, expression, instance_name=None, job_name=None):
        return self._value(self.query(expression(instance_name, job_name)))

    def get_kpis(self):
        """Return the dashboard's live KPI set."""
        return self.get_dashboard_kpis()

    def get_dashboard_kpis(self, hostname="all"):
        instance = None if not hostname or hostname.upper() == "ALL" or hostname.lower() == "all" else hostname
        selector = self._selector(instance, "windows_exporter")
        idle_selector = self._selector(instance, "windows_exporter", 'mode="idle"')
        disk_selector = self._selector(instance, "windows_exporter", 'volume="C:"')
        ram_expression = self._online(f'100 * (1 - windows_memory_physical_free_bytes{selector} / windows_memory_physical_total_bytes{selector})', instance)
        disk_expression = self._online(f'100 * (1 - windows_logical_disk_free_bytes{disk_selector} / windows_logical_disk_size_bytes{disk_selector})', instance)
        uptime_expression = self._online(f'(time() - windows_system_boot_time_timestamp{selector}) / 3600', instance)
        expressions = {
            "up": f'count(up{selector} == 1)',
            "cpu": f'avg(100 - (avg by(instance)(rate(windows_cpu_time_total{idle_selector}[5m])) * 100))',
            "ram": f'avg({ram_expression})',
            "disk": f'avg({disk_expression})',
            "uptime": f'avg({uptime_expression})',
            "healthyServers": f'count(up{selector} == 1)',
            "offlineServers": f'count(up{selector} == 0)',
            "totalServers": f'count(up{selector})',
            "totalRamGB": f'sum({self._online(f"windows_memory_physical_total_bytes{selector}", instance)}) / 1024 / 1024 / 1024',
            "availableRamGB": f'sum({self._online(f"windows_memory_physical_free_bytes{selector}", instance)}) / 1024 / 1024 / 1024',
            "freeDiskGB": f'sum({self._online(f"windows_logical_disk_free_bytes{disk_selector}", instance)}) / 1024 / 1024 / 1024',
            "usedDiskGB": f'sum({self._online(f"windows_logical_disk_size_bytes{disk_selector} - windows_logical_disk_free_bytes{disk_selector}", instance)}) / 1024 / 1024 / 1024',
            "downloadMbps": f'sum({self._online(f"rate(windows_net_bytes_received_total{selector}[5m])", instance)}) / 1024 / 1024',
            "uploadMbps": f'sum({self._online(f"rate(windows_net_bytes_sent_total{selector}[5m])", instance)}) / 1024 / 1024',
            "processes": f'avg({self._online(f"windows_system_processes{selector}", instance)})',
        }
        values = {}
        for name, expression in expressions.items():
            values[name] = self._value(self._safe_query(expression))

        def rounded(value, digits=2):
            return round(value, digits) if value is not None else 0

        availability = (values["up"] / values["totalServers"] * 100) if values["up"] is not None and values["totalServers"] else None
        cpu = values["cpu"]
        ram = values["ram"]
        disk = values["disk"]
        if values["up"] is None:
            status = "Unavailable"
        elif values["up"] == 0:
            status = "Offline"
        elif any(value is not None and value > 85 for value in (cpu, ram)):
            status = "Warning"
        else:
            status = "Healthy"
        network = (values["downloadMbps"] or 0) + (values["uploadMbps"] or 0)
        health_score = None
        if all(value is not None for value in (cpu, ram, disk, availability)):
            network_health = max(0, 100 - min(network, 100))
            health_score = max(0, min(100, 100 - cpu * 0.30 - ram * 0.25 - disk * 0.20 + availability * 0.15 + network_health * 0.10))

        return {
            "hostname": hostname,
            "status": status,
            "cpu": rounded(cpu), "ram": rounded(ram), "ramUsage": rounded(ram), "disk": rounded(disk),
            "uptime": rounded(values["uptime"], 1), "uptimeHours": rounded(values["uptime"], 2),
            "healthyServers": values["healthyServers"], "offlineServers": values["offlineServers"], "totalServers": values["totalServers"],
            "availability": rounded(availability), "healthScore": rounded(health_score),
            "totalRamGB": rounded(values["totalRamGB"], 1), "availableRamGB": rounded(values["availableRamGB"], 1),
            "usedRamGB": rounded(values["totalRamGB"] - values["availableRamGB"], 1) if values["totalRamGB"] is not None and values["availableRamGB"] is not None else None,
            "freeDiskGB": rounded(values["freeDiskGB"], 1), "usedDiskGB": rounded(values["usedDiskGB"], 1),
            "downloadMbps": rounded(values["downloadMbps"]), "uploadMbps": rounded(values["uploadMbps"]),
            "bandwidthMbps": rounded((values["downloadMbps"] + values["uploadMbps"]) if values["downloadMbps"] is not None and values["uploadMbps"] is not None else None),
            "processes": rounded(values["processes"], 0),
            "lastUpdated": datetime.utcnow().isoformat() + "Z",
        }

    def _selector(self, instance_name=None, job_name=None, extra=None):
        return self._build_selector(instance_name, job_name, extra)

    def _online(self, expression, instance_name=None):
        selector = self._selector(instance_name, "windows_exporter")
        return f'({expression}) and on(instance) (up{selector} == 1)'

    def get_cpu_usage(self, instance_name=None, job_name=None):
        return self._metric(lambda i, j: f'100 - avg by(hostname,instance)(rate(windows_cpu_time_total{self._selector(i, j, "mode=\\\"idle\\\"")}[5m])) * 100', instance_name, job_name)

    def get_memory_usage(self, instance_name=None, job_name=None):
        selector = self._selector(instance_name, job_name)
        return self._metric(lambda _i, _j: f'100 * (1 - windows_memory_physical_free_bytes{selector} / windows_memory_physical_total_bytes{selector})', instance_name, job_name)

    def get_disk_usage(self, instance_name=None, job_name=None):
        selector = self._selector(instance_name, job_name, 'volume="C:",filesystem="NTFS"')
        return self._metric(lambda _i, _j: f'100 - (windows_logical_disk_free_bytes{selector} / windows_logical_disk_size_bytes{selector}) * 100', instance_name, job_name)

    def get_free_disk(self, instance_name=None, job_name=None):
        selector = self._selector(instance_name, job_name, 'volume="C:"')
        return self._metric(lambda _i, _j: f'windows_logical_disk_free_bytes{selector} / 1024 / 1024 / 1024', instance_name, job_name)

    def get_used_disk(self, instance_name=None, job_name=None):
        selector = self._selector(instance_name, job_name, 'volume="C:"')
        return self._metric(lambda _i, _j: f'(windows_logical_disk_size_bytes{selector} - windows_logical_disk_free_bytes{selector}) / 1024 / 1024 / 1024', instance_name, job_name)

    def get_network_receive(self, instance_name=None, job_name=None):
        selector = self._selector(instance_name, job_name)
        return self._metric(lambda _i, _j: f'sum by(hostname,instance)(rate(windows_net_bytes_total{selector}[5m])) / 1024 / 1024', instance_name, job_name)

    def get_network_send(self, instance_name=None, job_name=None):
        selector = self._selector(instance_name, job_name)
        return self._metric(lambda _i, _j: f'sum by(hostname,instance)(rate(windows_net_bytes_total{selector}[5m])) / 1024 / 1024', instance_name, job_name)

    def get_uptime(self, instance_name=None, job_name=None):
        selector = self._selector(instance_name, job_name)
        return self._metric(lambda _i, _j: f'(time() - windows_system_boot_time_timestamp{selector}) / 3600', instance_name, job_name)

    def get_temperature(self, instance_name=None, job_name=None):
        selector = self._selector(instance_name, job_name)
        return self._metric(lambda _i, _j: f'windows_thermalzone_temperature_celsius{selector}', instance_name, job_name)

    def get_process_count(self, instance_name=None, job_name=None):
        selector = self._selector(instance_name, job_name)
        return self._metric(lambda _i, _j: f'windows_processes{selector}', instance_name, job_name)

    def get_top_cpu_processes(self, instance_name=None, job_name=None):
        selector = self._selector(
            instance_name,
            job_name,
            'mode!="idle",process!="Idle",process!="_Total"',
        )
        results = self.query(
            'topk(10, sum by(process)('
            f'rate(windows_process_cpu_time_total{selector}[5m])'
            ') * 100)'
        )
        processes = []
        for result in results:
            process = result.get("metric", {}).get("process", "").strip()
            try:
                value = round(float(result.get("value", [None, None])[-1]), 2)
            except (AttributeError, TypeError, ValueError, IndexError):
                continue
            if process and process not in {"Idle", "_Total"}:
                processes.append({"process": process, "value": value})
        return sorted(processes, key=lambda item: item["value"], reverse=True)[:10]

    def get_top_memory_processes(self, instance_name=None, job_name=None):
        selector = self._selector(instance_name, job_name)
        results = self.query(f'topk(10, windows_process_working_set_bytes{selector})')
        processes = []
        for result in results:
            process = result.get("metric", {}).get("process", "").strip()
            try:
                value = round(float(result.get("value", [None, None])[-1]), 2)
            except (AttributeError, TypeError, ValueError, IndexError):
                continue
            if process and process not in {"Idle", "_Total"}:
                processes.append({"process": process, "value": value})
        return sorted(processes, key=lambda item: item["value"], reverse=True)[:10]

    def get_history(self, query, start, end, step):
        return self.query(query, start=start, end=end, step=step)

    def get_cpu_history(self, hostname, hours=1, step=30):
        end = time.time()
        start = end - (hours * 60 * 60)
        hostname_matcher = json.dumps(str(hostname))
        query = (
            '100 - (avg by(hostname)('
            f'rate(windows_cpu_time_total{{hostname={hostname_matcher},mode="idle"}}[5m])'
            ') * 100)'
        )
        results = self.get_history(query, start, end, step)
        if not results:
            return []

        valid_samples = []
        for timestamp, value in results[0].get("values", []):
            try:
                numeric_value = float(value)
                numeric_timestamp = float(timestamp)
            except (TypeError, ValueError, OverflowError):
                continue
            if not (0 <= numeric_value <= 100):
                continue
            valid_samples.append((numeric_timestamp, numeric_value))

        if (
            len(valid_samples) > 1
            and abs(valid_samples[0][1] - valid_samples[1][1]) > 30
        ):
            valid_samples.pop(0)

        return [
            {
                "time": datetime.fromtimestamp(timestamp).strftime("%I:%M %p"),
                "cpu": round(value, 2),
            }
            for timestamp, value in valid_samples
        ]

    def get_metric_history(self, metric, instance_name=None, job_name=None, hours=24):
        end = time.time()
        start = end - (hours * 60 * 60)
        selector = self._selector(instance_name, job_name)
        disk_selector = self._selector(instance_name, job_name, 'volume="C:"')
        expressions = {
            "cpu": f'100 - avg by(hostname,instance)(rate(windows_cpu_time_total{self._selector(instance_name, job_name, "mode=\\\"idle\\\"")}[5m])) * 100',
            "ram": f'100 * (1 - windows_memory_physical_free_bytes{selector} / windows_memory_physical_total_bytes{selector})',
            "disk": f'100 - (windows_logical_disk_free_bytes{disk_selector} / windows_logical_disk_size_bytes{disk_selector}) * 100',
            "network": f'sum by(hostname,instance)(rate(windows_net_bytes_received_total{selector}[5m])) / 1024 / 1024',
        }
        results = self.get_history(expressions[metric], start, end, 300)
        points = []
        for result in results:
            labels = result.get("metric", {})
            for timestamp, value in result.get("values", []):
                try:
                    numeric_value = round(float(value), 2)
                except (TypeError, ValueError):
                    numeric_value = None
                points.append({
                    "hostname": labels.get("hostname"),
                    "instance": labels.get("instance") or instance_name,
                    "value": numeric_value,
                    "timestamp": datetime.utcfromtimestamp(float(timestamp)).isoformat() + "Z",
                })
        return points

    @staticmethod
    def _chart_points(results):
        points = []
        for result in results:
            for timestamp, value in result.get("values", []):
                try:
                    points.append({
                        "timestamp": float(timestamp),
                        "time": datetime.utcfromtimestamp(float(timestamp)).isoformat() + "Z",
                        "value": round(float(value), 2),
                    })
                except (TypeError, ValueError, OverflowError):
                    continue
        return points

    def get_chart_history(self, hostname, hours=24):
        """Return dashboard chart series for ALL servers or one Prometheus instance."""
        end = time.time()
        start = end - (hours * 60 * 60)
        instance = None if not hostname or str(hostname).upper() == "ALL" else hostname
        selector = self._selector(instance, "windows_exporter")
        idle_selector = self._selector(instance, "windows_exporter", 'mode="idle"')
        disk_selector = self._selector(instance, "windows_exporter", 'volume="C:"')
        aggregate = "avg(" if instance is None else ""
        close = ")" if instance is None else ""
        ram_expression = self._online(f'100 * (1 - windows_memory_physical_free_bytes{selector} / windows_memory_physical_total_bytes{selector})', instance)
        disk_expression = self._online(f'100 * (1 - windows_logical_disk_free_bytes{disk_selector} / windows_logical_disk_size_bytes{disk_selector})', instance)
        uptime_expression = self._online(f'(time() - windows_system_boot_time_timestamp{selector}) / 3600', instance)
        expressions = {
            "cpu": f'{aggregate}(100 - (avg(rate(windows_cpu_time_total{idle_selector}[5m])) * 100)){close}',
            "ram": f'{aggregate}{ram_expression}{close}',
            "disk": f'{aggregate}{disk_expression}{close}',
            "uptime": f'{aggregate}{uptime_expression}{close}',
            "inbound": f'{aggregate}{self._online(f"sum by(instance)(rate(windows_net_bytes_received_total{selector}[1m]))", instance)} / 1024 / 1024{close}',
            "outbound": f'{aggregate}{self._online(f"sum by(instance)(rate(windows_net_bytes_sent_total{selector}[1m]))", instance)} / 1024 / 1024{close}',
        }
        charts = {
            "cpu": [], "ram": [], "disk": [],
            "network": {"inbound": [], "outbound": []},
            "cpuByServer": [], "ramByServer": [], "diskByServer": [], "uptimeByServer": [],
            "ramDistribution": [], "serviceStates": [], "processes": [],
        }
        for name, expression in expressions.items():
            points = self._chart_points(self._safe_query(expression, start=start, end=end, step=300))
            if name in {"cpu", "ram", "disk"}:
                charts[name] = points
                if name == "ram":
                    charts["ramTrend"] = points
            elif name == "uptime":
                charts["uptimeTrend"] = points
            else:
                charts["network"][name] = points

        running_selector = self._selector(instance, "windows_exporter", 'state="running"')
        stopped_selector = self._selector(instance, "windows_exporter", 'state="stopped"')
        paused_selector = self._selector(instance, "windows_exporter", 'state="paused"')
        comparison_expressions = {
            "cpuByServer": f'100 - (avg by(hostname)({self._online(f"rate(windows_cpu_time_total{idle_selector}[5m])", instance)}) * 100)',
            "ramByServer": f'100 * (1 - avg by(hostname)({self._online(f"windows_memory_physical_free_bytes{selector} / windows_memory_physical_total_bytes{selector}", instance)}))',
            "diskByServer": disk_expression,
            "uptimeByServer": uptime_expression,
            "ramUsed": f'sum({self._online(f"windows_memory_physical_total_bytes{selector} - windows_memory_physical_free_bytes{selector}", instance)})',
            "ramFree": f'sum({self._online(f"windows_memory_physical_free_bytes{selector}", instance)})',
            "running": f'count({self._online(f"windows_service_state{running_selector}", instance)})',
            "stopped": f'count({self._online(f"windows_service_state{stopped_selector}", instance)})',
            "paused": f'count({self._online(f"windows_service_state{paused_selector}", instance)})',
        }
        comparison_results = {name: self._safe_query(expression) for name, expression in comparison_expressions.items()}

        charts["cpuByServer"] = convert_series(comparison_results["cpuByServer"])
        charts["ramByServer"] = convert_series(comparison_results["ramByServer"])
        charts["diskByServer"] = convert_series(comparison_results["diskByServer"])
        charts["uptimeByServer"] = convert_series(comparison_results["uptimeByServer"])
        charts["processes"] = self.get_top_cpu_processes(instance, "windows_exporter")
        charts["ramDistribution"] = [{"name": label, "value": value} for label, name in (("Used RAM", "ramUsed"), ("Free RAM", "ramFree")) if (value := self._value(comparison_results[name])) is not None]
        charts["serviceStates"] = [{"name": label, "value": value} for label, name in (("Running", "running"), ("Stopped", "stopped"), ("Paused", "paused")) if (value := self._value(comparison_results[name])) is not None]
        return charts

    def _expressions(self, instance_name=None, job_name=None):
        selector = self._selector(instance_name, job_name)
        disk_selector = self._selector(instance_name, job_name, 'volume="C:"')
        idle_selector = self._selector(instance_name, job_name, 'mode="idle"')
        running_selector = self._selector(instance_name, job_name, 'state="running"')
        stopped_selector = self._selector(instance_name, job_name, 'state="stopped"')
        paused_selector = self._selector(instance_name, job_name, 'state="paused"')
        return {
            "cpu": f'100 - avg by(hostname,instance)(rate(windows_cpu_time_total{idle_selector}[5m])) * 100',
            "ram": f'100 * (1 - windows_memory_physical_free_bytes{selector} / windows_memory_physical_total_bytes{selector})',
            "disk": f'100 - (windows_logical_disk_free_bytes{disk_selector} / windows_logical_disk_size_bytes{disk_selector}) * 100',
            "network": f'sum by(hostname,instance)(rate(windows_net_bytes_total{selector}[5m])) / 1024 / 1024',
            "uptime": f'(time() - windows_system_boot_time_timestamp{selector}) / 3600',
            "temperature": f'windows_thermalzone_temperature_celsius{selector}',
            "processCount": f'windows_system_processes{selector}',
            "availability": f'up{selector}',
        }

    def get_snapshot(self, instance_name=None, job_name=None):
        """Fetch the live Windows Exporter snapshot used by all API consumers."""
        values = {}
        for name, expression in self._expressions(instance_name, job_name).items():
            values[name] = self._value(self.query(expression))
        values["status"] = "healthy" if values.pop("availability") == 1 else "offline"
        return values

    def get_server_metrics(self, instance_name=None, job_name=None):
        selector = self._build_selector(instance_name, job_name)
        disk_selector = self._build_selector(instance_name, job_name, 'volume="C:"')
        idle_selector = self._build_selector(instance_name, job_name, 'mode="idle"')
        exprs = {
            "cpu_usage": f'100 - avg by(hostname,instance)(rate(windows_cpu_time_total{idle_selector}[5m])) * 100',
            "ram_usage": f'100 * (1 - windows_memory_physical_free_bytes{selector} / windows_memory_physical_total_bytes{selector})',
            "disk_usage": f'100 - (windows_logical_disk_free_bytes{disk_selector} / windows_logical_disk_size_bytes{disk_selector}) * 100',
            "network_receive": f'sum by(hostname,instance)(rate(windows_net_bytes_total{selector}[5m])) / 1024 / 1024',
            "network_send": f'sum by(hostname,instance)(rate(windows_net_bytes_total{selector}[5m])) / 1024 / 1024',
            "temperature": f'windows_thermalzone_temperature_celsius{selector}',
            "uptime": f'(time() - windows_system_boot_time_timestamp{selector}) / 3600',
            "process_count": f'windows_processes{selector}',
        }

        metrics = {}
        for key, expr in exprs.items():
            results = self.query(expr)
            values = []
            for item in results:
                metric = item.get("metric", {})
                value = item.get("value", [None, 0])[-1]
                values.append({
                    "hostname": metric.get("hostname"),
                    "instance": metric.get("instance"),
                    "job": metric.get("job"),
                    "value": float(value) if value is not None else None,
                })
            metrics[key] = values
        return metrics

    def get_instance_metrics(self, instance_name=None, job_name=None):
        aggregate = instance_name is None
        selector = self._selector(instance_name, job_name)
        disk_selector = self._selector(instance_name, job_name, 'volume="C:"')
        idle_selector = self._selector(instance_name, job_name, 'mode="idle"')
        running_selector = self._selector(instance_name, job_name, 'state="running"')
        stopped_selector = self._selector(instance_name, job_name, 'state="stopped"')
        paused_selector = self._selector(instance_name, job_name, 'state="paused"')
        cpu_temperature_selector = '{sensorName="Core (Tctl/Tdie)"}'
        gpu_core_selector = '{sensorName="GPU Core"}'
        gpu_memory_selector = '{sensorName="GPU Memory Used"}'
        ssd_temperature_selector = '{sensorName="Composite Temperature"}'
        def query_value(expression):
            return self._value(self._safe_query(expression))

        expressions = {
            "cpuUsage": f'100 - (avg(rate(windows_cpu_time_total{idle_selector}[5m])) * 100)',
            "cpuTemperature": f'avg(lhm_cpu_temperature_celsius{cpu_temperature_selector})' if aggregate else f'lhm_cpu_temperature_celsius{cpu_temperature_selector}',
            "gpuUsage": f'avg(lhm_gpuamd_load_percent{gpu_core_selector})' if aggregate else f'lhm_gpuamd_load_percent{gpu_core_selector}',
            "gpuClock": f'avg(lhm_gpuamd_clock_hertz{gpu_core_selector}) / 1000000000' if aggregate else f'lhm_gpuamd_clock_hertz{gpu_core_selector} / 1000000000',
            "gpuVoltage": 'lhm_gpuamd_voltage_volts{sensorName="GPU Core"}',
            "gpuMemoryUsed": f'sum(lhm_gpuamd_smalldata_bytes{gpu_memory_selector}) / 1024^2' if aggregate else f'lhm_gpuamd_smalldata_bytes{gpu_memory_selector} / 1024^2',
            "ssdTemperature": f'avg(lhm_storage_temperature_celsius{ssd_temperature_selector})' if aggregate else f'lhm_storage_temperature_celsius{ssd_temperature_selector}',
            "ramUsage": f'avg(100 * (1 - windows_memory_physical_free_bytes{selector} / windows_memory_physical_total_bytes{selector}))' if aggregate else f'100 * (1 - windows_memory_physical_free_bytes{selector} / windows_memory_physical_total_bytes{selector})',
            "diskUsage": f'avg(100 * (1 - windows_logical_disk_free_bytes{disk_selector} / windows_logical_disk_size_bytes{disk_selector}))' if aggregate else f'100 * (1 - windows_logical_disk_free_bytes{disk_selector} / windows_logical_disk_size_bytes{disk_selector})',
            "uptime": f'avg((time() - windows_system_boot_time_timestamp{selector}) / 3600)' if aggregate else f'(time() - windows_system_boot_time_timestamp{selector}) / 3600',
            "networkReceive": f'sum(rate(windows_net_bytes_received_total{selector}[5m])) / 1024 / 1024',
            "networkSend": f'sum(rate(windows_net_bytes_sent_total{selector}[5m])) / 1024 / 1024',
            "processCount": f'sum(windows_system_processes{selector})' if aggregate else f'windows_system_processes{selector}',
            "serviceRunning": f'count(windows_service_state{running_selector})',
            "serviceStopped": f'count(windows_service_state{stopped_selector})',
            "servicePaused": f'count(windows_service_state{paused_selector})',
            "memoryTotal": f'sum(windows_memory_physical_total_bytes{selector})' if aggregate else f'windows_memory_physical_total_bytes{selector}',
            "memoryFree": f'sum(windows_memory_physical_free_bytes{selector})' if aggregate else f'windows_memory_physical_free_bytes{selector}',
            "memoryCache": f'sum(windows_memory_cache_bytes{selector})' if aggregate else f'windows_memory_cache_bytes{selector}',
            "commitPressure": f'100 * (sum(windows_memory_committed_bytes{selector}) / sum(windows_memory_commit_limit{selector}))' if aggregate else f'100 * (windows_memory_committed_bytes{selector} / windows_memory_commit_limit{selector})',
            "diskTotal": f'sum(windows_logical_disk_size_bytes{disk_selector})' if aggregate else f'windows_logical_disk_size_bytes{disk_selector}',
            "diskFree": f'sum(windows_logical_disk_free_bytes{disk_selector})' if aggregate else f'windows_logical_disk_free_bytes{disk_selector}',
            "diskRead": f'sum(rate(windows_logical_disk_read_bytes_total{disk_selector}[1m])) / 1024 / 1024' if aggregate else f'rate(windows_logical_disk_read_bytes_total{disk_selector}[1m]) / 1024 / 1024',
            "diskWrite": f'sum(rate(windows_logical_disk_write_bytes_total{disk_selector}[1m])) / 1024 / 1024' if aggregate else f'rate(windows_logical_disk_write_bytes_total{disk_selector}[1m]) / 1024 / 1024',
            "threads": f'sum(windows_system_threads{selector})' if aggregate else f'windows_system_threads{selector}',
            "queueLength": f'sum(windows_system_processor_queue_length{selector})' if aggregate else f'windows_system_processor_queue_length{selector}',
            "contextSwitches": f'sum(rate(windows_system_context_switches_total{selector}[5m]))' if aggregate else f'rate(windows_system_context_switches_total{selector}[5m])',
            "systemCalls": f'sum(rate(windows_system_system_calls_total{selector}[5m]))' if aggregate else f'rate(windows_system_system_calls_total{selector}[5m])',
            "exceptions": f'sum(rate(windows_system_exception_dispatches_total{selector}[5m]))' if aggregate else f'rate(windows_system_exception_dispatches_total{selector}[5m])',
            "up": f'sum(up{selector})' if aggregate else f'up{selector}',
        }
        values = {name: query_value(expression) for name, expression in expressions.items()}
        core_results = self._safe_query(
            f'100 - (avg by(core)(rate(windows_cpu_time_total{idle_selector}[5m])) * 100)'
        )
        core_usage = []
        for item in core_results:
            value = item.get("value", [None, None])[-1]
            try:
                core_usage.append({"core": item.get("metric", {}).get("core", "CPU"), "value": round(float(value), 2)})
            except (TypeError, ValueError):
                continue
        def rounded(value, digits=2):
            return round(value, digits) if isinstance(value, (int, float)) else None
        snapshot = {key: rounded(value) for key, value in values.items()}
        snapshot.update({
            "cpuTemperature": rounded(values["cpuTemperature"], 1),
            "gpuUsage": rounded(values["gpuUsage"], 1),
            "gpuClock": rounded(values["gpuClock"], 2),
            "gpuVoltage": values["gpuVoltage"],
            "gpuMemoryUsed": rounded(values["gpuMemoryUsed"], 0),
            "ssdTemperature": rounded(values["ssdTemperature"], 1),
        })
        snapshot.update({
            "instance": instance_name,
            "cpuUsage": rounded(values["cpuUsage"]),
            "ramUsage": rounded(values["ramUsage"]),
            "diskUsage": rounded(values["diskUsage"]),
            "networkUsage": rounded((values["networkReceive"] or 0) + (values["networkSend"] or 0)),
            "coreUsage": core_usage,
            "up": rounded(values["up"]),
            "status": "healthy" if values["up"] == 1 else "offline" if values["up"] == 0 else "unknown",
        })
        if values["up"] == 0:
            snapshot = {key: value if key in {"instance", "up", "status"} else None for key, value in snapshot.items()}
        return snapshot
