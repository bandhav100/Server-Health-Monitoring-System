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
        ip = _host_from_instance(instance) or "127.0.0.1"
        hostname = (
            labels.get("hostname")
            or labels.get("machine")
            or (
                "Bandhav" if "100.84.0.9" in instance or "host.docker.internal" in instance
                else "Saivinay" if "100.102.76.81" in instance
                else "Abhi" if "100.95.242.5" in instance
                else "Manju" if "100.104.89.32" in instance
                else "Navadeep" if "100.72.224.107" in instance
                else instance.split(":")[0]
            )
        )
        item = {
            "hostname": hostname,
            "instance": instance,
            "ip": ip,
            "job": labels.get("job") or target.get("scrapePool"),
            "health": target.get("health", "unknown"),
            "labels": labels,
            "scrape_url": target.get("scrapeUrl"),
            "os": labels.get("os") or labels.get("operating_system") or labels.get("platform") or "Windows",
        }
        discovered[instance] = item
    return list(discovered.values())


def sync_servers(service=None):
    """Upsert discovered targets by Prometheus instance or IP and commit."""
    discovered = discover_servers(service)
    synced = []
    for item in discovered:
        server = (
            Server.query.filter_by(prometheus_instance=item["instance"]).first()
            or Server.query.filter_by(tailscale_ip=item["ip"]).first()
            or Server.query.filter_by(name=item["hostname"]).first()
        )
        if server is None:
            server = Server(
                name=item["hostname"],
                hostname=item["hostname"],
                ip_address=item["ip"],
                tailscale_ip=item["ip"],
                prometheus_instance=item["instance"],
                prometheus_job=item["job"],
                operating_system=item["os"],
                status="healthy" if item["health"] == "up" else "offline",
            )
            db.session.add(server)
        else:
            if not server.name:
                server.name = item["hostname"]
            server.hostname = server.hostname or item["hostname"]
            server.prometheus_instance = item["instance"]
            server.prometheus_job = item["job"]
            server.status = "healthy" if item["health"] == "up" else "offline"
            if not server.ip_address:
                server.ip_address = item["ip"]
        synced.append(server)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

    return synced


__all__ = ["discover_servers", "sync_servers", "PrometheusUnavailable"]