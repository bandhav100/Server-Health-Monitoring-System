"""
Seed initial baseline data for SHMS:
- 5 Discovered Servers
- 24-hour MetricsHistory records for realistic chart & prediction baselines
- Initial alerts for live alerts table & analytics
- Initial predictions
- Initial completed reports
Idempotent and non-destructive.
"""
from datetime import datetime, timedelta
import random
from extensions import db
from models.server import Server
from models.metrics_history import MetricsHistory
from models.alert import Alert
from models.prediction import Prediction
from models.report import Report
from utils.logger import logger


DEFAULT_SERVERS = [
    {
        "name": "Bandhav",
        "hostname": "Bandhav",
        "ip_address": "100.84.0.9",
        "tailscale_ip": "100.84.0.9",
        "prometheus_instance": "100.84.0.9:9182",
        "prometheus_job": "windows_exporter",
        "operating_system": "windows",
        "environment": "Production",
        "description": "Primary Windows Host",
        "status": "healthy",
        "source": "discovered",
    },
    {
        "name": "Saivinay",
        "hostname": "Saivinay",
        "ip_address": "100.102.76.81",
        "tailscale_ip": "100.102.76.81",
        "prometheus_instance": "100.102.76.81:9182",
        "prometheus_job": "windows_exporter",
        "operating_system": "windows",
        "environment": "Production",
        "description": "Secondary Node",
        "status": "healthy",
        "source": "discovered",
    },
    {
        "name": "Abhi",
        "hostname": "Abhi",
        "ip_address": "100.95.242.5",
        "tailscale_ip": "100.95.242.5",
        "prometheus_instance": "100.95.242.5:9182",
        "prometheus_job": "windows_exporter",
        "operating_system": "windows",
        "environment": "Production",
        "description": "Compute Node",
        "status": "healthy",
        "source": "discovered",
    },
    {
        "name": "Manju",
        "hostname": "Manju",
        "ip_address": "100.104.89.32",
        "tailscale_ip": "100.104.89.32",
        "prometheus_instance": "100.104.89.32:9182",
        "prometheus_job": "windows_exporter",
        "operating_system": "windows",
        "environment": "Staging",
        "description": "Staging Cluster Member",
        "status": "healthy",
        "source": "discovered",
    },
    {
        "name": "Navadeep",
        "hostname": "Navadeep",
        "ip_address": "100.72.224.107",
        "tailscale_ip": "100.72.224.107",
        "prometheus_instance": "100.72.224.107:9182",
        "prometheus_job": "windows_exporter",
        "operating_system": "windows",
        "environment": "Production",
        "description": "Database Replica Server",
        "status": "healthy",
        "source": "discovered",
    },
]


def seed_servers():
    seeded = []
    for s_info in DEFAULT_SERVERS:
        existing = Server.query.filter(
            (Server.prometheus_instance == s_info["prometheus_instance"]) |
            (Server.name == s_info["name"]) |
            (Server.ip_address == s_info["ip_address"])
        ).first()

        if not existing:
            server = Server(**s_info)
            db.session.add(server)
            seeded.append(server)
        else:
            # Update missing attributes
            if not existing.prometheus_instance:
                existing.prometheus_instance = s_info["prometheus_instance"]
            if not existing.ip_address:
                existing.ip_address = s_info["ip_address"]
            if not existing.operating_system:
                existing.operating_system = "windows"
            seeded.append(existing)

    db.session.commit()
    return seeded


def seed_metrics_history(servers):
    total_metrics = MetricsHistory.query.count()
    if total_metrics >= 50:
        return

    now = datetime.utcnow()
    records = []
    # Seed 24 historical hours of points for each server
    for server in servers:
        base_cpu = random.uniform(18.0, 32.0)
        base_ram = random.uniform(45.0, 68.0)
        base_disk = random.uniform(35.0, 55.0)

        for hour in range(24, 0, -1):
            ts = now - timedelta(hours=hour, minutes=random.randint(0, 5))
            cpu = round(max(5.0, min(95.0, base_cpu + random.uniform(-8.0, 12.0))), 2)
            ram = round(max(20.0, min(90.0, base_ram + random.uniform(-4.0, 6.0))), 2)
            disk = round(max(10.0, min(90.0, base_disk + (24 - hour) * 0.05)), 2)
            net_in = round(random.uniform(2.5, 18.0), 2)
            net_out = round(random.uniform(1.0, 12.0), 2)
            temp = round(random.uniform(42.0, 54.0), 1)
            uptime = round(120.0 + (24 - hour), 1)

            mh = MetricsHistory(
                server_id=server.id,
                cpu_usage=cpu,
                ram_usage=ram,
                disk_usage=disk,
                network_usage=round(net_in + net_out, 2),
                network_receive=net_in,
                network_send=net_out,
                temperature=temp,
                uptime=uptime,
                created_at=ts,
            )
            records.append(mh)

    db.session.bulk_save_objects(records)
    db.session.commit()
    logger.info("Seeded %d metrics history records", len(records))


def seed_alerts(servers):
    if Alert.query.count() > 0 or not servers:
        return

    now = datetime.utcnow()
    alerts_data = [
        {
            "server_id": servers[0].id,
            "severity": "WARNING",
            "title": "High Memory Utilization",
            "description": f"RAM usage reached 78.5% on {servers[0].name} (threshold: 75%)",
            "metric": "RAM",
            "category": "Memory",
            "current_value": 78.5,
            "threshold_value": 75.0,
            "status": "ACTIVE",
            "acknowledged": False,
            "created_at": now - timedelta(minutes=45),
        },
        {
            "server_id": servers[1].id if len(servers) > 1 else servers[0].id,
            "severity": "INFO",
            "title": "Windows Exporter Scrape Stable",
            "description": f"All 12 WMI collectors reporting normally on {servers[1].name if len(servers) > 1 else servers[0].name}",
            "metric": "System",
            "category": "System",
            "current_value": 1.0,
            "threshold_value": 1.0,
            "status": "ACTIVE",
            "acknowledged": False,
            "created_at": now - timedelta(hours=2),
        },
        {
            "server_id": servers[2].id if len(servers) > 2 else servers[0].id,
            "severity": "CRITICAL",
            "title": "Temporary CPU Spike",
            "description": f"CPU peaked at 92.4% during scheduled task on {servers[2].name if len(servers) > 2 else servers[0].name}",
            "metric": "CPU",
            "category": "Compute",
            "current_value": 92.4,
            "threshold_value": 90.0,
            "status": "RESOLVED",
            "acknowledged": True,
            "resolved_at": now - timedelta(minutes=15),
            "created_at": now - timedelta(hours=4),
        },
    ]

    for a in alerts_data:
        created_time = a.pop("created_at")
        resolved_time = a.pop("resolved_at", None)
        alert = Alert(**a)
        alert.created_at = created_time
        if resolved_time:
            alert.resolved_at = resolved_time
        db.session.add(alert)

    db.session.commit()
    logger.info("Seeded initial alerts")


def seed_predictions(servers):
    if Prediction.query.count() > 0 or not servers:
        return

    for server in servers:
        p = Prediction(
            server_id=server.id,
            cpu_forecast=round(random.uniform(22.0, 35.0), 2),
            ram_forecast=round(random.uniform(55.0, 68.0), 2),
            predicted_disk=round(random.uniform(42.0, 52.0), 2),
            predicted_network=round(random.uniform(8.0, 16.0), 2),
            anomaly_score=round(random.uniform(4.0, 12.0), 1),
            confidence=round(random.uniform(91.0, 97.0), 1),
            health_score=round(random.uniform(88.0, 96.0), 1),
            source="historical-linear-regression",
        )
        db.session.add(p)

    db.session.commit()
    logger.info("Seeded initial predictions")


def seed_reports(servers):
    if Report.query.count() > 0:
        return

    now = datetime.utcnow()
    reports_data = [
        {
            "name": "Weekly Infrastructure Performance Audit.pdf",
            "server_id": None,
            "server_name": "All Servers",
            "metrics": "cpu_usage,ram_usage,disk_usage,network_usage",
            "time_range": "7d",
            "start_time": now - timedelta(days=7),
            "end_time": now,
            "format": "PDF",
            "file_size": 142850,
            "status": "completed",
            "created_at": now - timedelta(hours=6),
        },
        {
            "name": "Daily Server Health Summary.csv",
            "server_id": servers[0].id if servers else None,
            "server_name": servers[0].name if servers else "Bandhav",
            "metrics": "cpu_usage,ram_usage",
            "time_range": "24h",
            "start_time": now - timedelta(hours=24),
            "end_time": now,
            "format": "CSV",
            "file_size": 38400,
            "status": "completed",
            "created_at": now - timedelta(hours=1),
        },
    ]

    for rep in reports_data:
        created_time = rep.pop("created_at")
        r = Report(**rep)
        r.created_at = created_time
        db.session.add(r)

    db.session.commit()
    logger.info("Seeded initial reports")


def seed_all():
    try:
        servers = seed_servers()
        seed_metrics_history(servers)
        seed_alerts(servers)
        seed_predictions(servers)
        seed_reports(servers)
        logger.info("All baseline seeds verified and applied successfully")
    except Exception as exc:
        db.session.rollback()
        logger.error("Seed execution error: %s", exc)
