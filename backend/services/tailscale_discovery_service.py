import json
import os
import shutil
import subprocess

from extensions import db
from models.server import Server
from services.server_inventory_service import deduplicate_servers, remove_server


class TailscaleUnavailable(Exception):
    """Raised when the local Tailscale CLI cannot provide status data."""


CANONICAL_TAILSCALE_IPS = {
    "100.84.0.0",
    "100.95.242.5",
    "100.104.89.32",
    "100.72.224.107",
    "100.102.76.81",
}


def _user_email(machine, user_profiles):
    profile_id = machine.get("UserProfileID")
    profile = user_profiles.get(profile_id, {}) if profile_id else {}
    return (
        machine.get("UserEmail")
        or machine.get("User")
        or profile.get("LoginName")
        or profile.get("DisplayName")
    )


def _machine_from_status(machine, user_profiles):
    addresses = machine.get("TailscaleIPs") or []
    hostname = machine.get("HostName") or machine.get("DNSName", "").rstrip(".")
    if not hostname or not addresses:
        return None
    operating_system = machine.get("OS") or machine.get("OperatingSystem")
    return {
        "hostname": hostname,
        "tailscale_ip": addresses[0],
        "os": operating_system,
        "online": bool(machine.get("Online", False)),
        "user_email": _user_email(machine, user_profiles),
    }


def discover_machines(status=None, runner=None):
    """Read all machines known by the local Tailscale client."""
    if status is None:
        command = runner or subprocess.run
        if shutil.which("tailscale") is None and runner is None and not os.name == "nt":
            raise TailscaleUnavailable("tailscale CLI is not installed")
        try:
            result = command(
                ["tailscale", "status", "--json"],
                capture_output=True,
                text=True,
                check=True,
                timeout=10,
            )
            status = json.loads(result.stdout)
        except (OSError, subprocess.SubprocessError, json.JSONDecodeError) as exc:
            raise TailscaleUnavailable(str(exc)) from exc

    user_profiles = status.get("UserProfiles") or {}
    machines = []
    self_machine = status.get("Self")
    if self_machine:
        machine = _machine_from_status(self_machine, user_profiles)
        if machine:
            machines.append(machine)
    for peer in (status.get("Peer") or {}).values():
        machine = _machine_from_status(peer, user_profiles)
        if machine:
            machines.append(machine)
    return machines


def sync_machines(status=None, runner=None):
    """Upsert Tailscale inventory and retain disappeared machines as offline."""
    deduplicate_servers()
    discovered = [
        machine for machine in discover_machines(status=status, runner=runner)
        if machine["tailscale_ip"].strip().casefold() in CANONICAL_TAILSCALE_IPS
    ]
    by_ip = {
        machine["tailscale_ip"].strip().casefold(): machine
        for machine in discovered
    }
    existing = {
        server.tailscale_ip.strip().casefold(): server
        for server in Server.query.all()
        if server.tailscale_ip
    }
    synced = []
    for machine in discovered:
        ip = machine["tailscale_ip"].strip()
        server = existing.get(ip.casefold())
        if server is None:
            server = Server(tailscale_ip=ip, source="tailscale")
            db.session.add(server)
        else:
            if not server.source:
                server.source = "tailscale"
        server.name = machine["hostname"]
        server.tailscale_ip = ip
        server.operating_system = machine["os"] or "Windows 11"
        server.location = machine["user_email"]
        server.status = "healthy" if machine["online"] else "offline"
        server.prometheus_instance = f"{ip}:9182"
        synced.append(server)

    for server in Server.query.all():
        # Only prune stale servers that were originally registered and managed by Tailscale
        if (server.source == "tailscale") and (not server.tailscale_ip or server.tailscale_ip.strip().casefold() not in by_ip):
            remove_server(server)
    return synced


__all__ = ["discover_machines", "sync_machines", "TailscaleUnavailable"]