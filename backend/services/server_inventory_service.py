from sqlalchemy import text

from extensions import db
from models.server import Server


_RELATED_TABLES = ("metrics_history", "alerts", "predictions")


def _inventory_key(value):
    return value.strip().casefold() if value else None


def remove_server(server):
    for table in _RELATED_TABLES:
        db.session.execute(
            text(f"DELETE FROM {table} WHERE server_id = :server_id"),
            {"server_id": server.id},
        )
    db.session.delete(server)


def deduplicate_servers():
    """Remove exporter artifacts and keep one server row per Tailscale IP."""
    servers = Server.query.order_by(Server.id.asc()).all()
    keepers = {}
    removed = 0

    for server in servers:
        name = (server.name or "").strip().casefold()
        ip = _inventory_key(server.tailscale_ip)
        if ":9100" in name or ":9100" in (ip or ""):
            remove_server(server)
            removed += 1
            continue
        if not ip:
            continue
        keeper = keepers.get(ip)
        if keeper is None:
            keepers[ip] = server
            continue

        for table in _RELATED_TABLES:
            db.session.execute(
                text(
                    f"UPDATE {table} SET server_id = :keeper_id "
                    "WHERE server_id = :duplicate_id"
                ),
                {"keeper_id": keeper.id, "duplicate_id": server.id},
            )
        db.session.delete(server)
        removed += 1

    if removed:
        db.session.flush()
    return removed


__all__ = ["deduplicate_servers", "remove_server"]