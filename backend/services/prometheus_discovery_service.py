from urllib.parse import urlparse

from models.server import Server
from extensions import db
from services.prometheus_service import PrometheusService, PrometheusUnavailable


def _host_from_instance(instance):
    if not instance:
        return None
    parsed = urlparse(f"//{instance}")
    return parsed.hostname or instance.split(":", 1)[0]


def discover_servers(service=None):
    """Normalize active Prometheus targets into SHMS server records."""
    targets = (service or PrometheusService()).active_targets()
    discovered = {}
    for target in targets:
        labels = {
            **(target.get("discoveredLabels") or {}),
            **(target.get("labels") or {}),
        }
        if labels.get("job") == "prometheus":
            continue
        instance = labels.get("instance")
        if not instance:
            scrape_url = target.get("scrapeUrl") or target.get("globalUrl")
            parsed = urlparse(scrape_url or "")
            instance = parsed.netloc or scrape_url
        hostname = labels.get("hostname") or labels.get("machine")
        ip = _host_from_instance(instance)
        if not hostname or not ip:
            continue
        item = {
            "hostname": hostname,
            "instance": instance,
            "ip": ip,
            "job": labels.get("job") or target.get("scrapePool"),
            "health": target.get("health", "unknown"),
            "labels": labels,
            "scrape_url": target.get("scrapeUrl"),
            "os": labels.get("os") or labels.get("operating_system") or labels.get("platform"),
        }
        current = discovered.get(ip)
        if current is None or (
            item["health"] == "up" and current["health"] != "up"
        ) or (
            _host_from_instance(item["instance"]) == ip
            and _host_from_instance(current["instance"]) != ip
        ):
            discovered[ip] = item
    return list(discovered.values())


def sync_servers(service=None):
    """Upsert discovered targets by Tailscale IP and remove stale inventory."""
    discovered = discover_servers(service)
    discovered_by_ip = {item["ip"]: item for item in discovered}
    discovered = list(discovered_by_ip.values())
    discovered_ips = set(discovered_by_ip)
    existing = {server.tailscale_ip: server for server in Server.query.all() if server.tailscale_ip}
    synced = []
    for item in discovered:
        server = existing.get(item["ip"])
        if server is None:
            server = Server(tailscale_ip=item["ip"])
        server.name = item["hostname"]
        server.tailscale_ip = item["ip"]
        server.operating_system = item["os"]
        server.prometheus_instance = item["instance"]
        server.prometheus_job = item["job"]
        server.status = "healthy" if item["health"] == "up" else item["health"]
        synced.append(server)

    return synced


__all__ = ["discover_servers", "sync_servers", "PrometheusUnavailable"]