import csv
import json
import os
import time
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request, send_file
from fpdf import FPDF

from extensions import db
from middleware.auth import jwt_required_api
from models.metrics_history import MetricsHistory
from models.report import Report
from models.server import Server
from services.prometheus_service import PrometheusService, PrometheusUnavailable
from utils.logger import logger
from utils.response import api_response

reports_bp = Blueprint("reports", __name__)

EXPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "exports", "reports")
os.makedirs(EXPORTS_DIR, exist_ok=True)

METRIC_DEFINITIONS = {
    "cpu_usage": {"name": "CPU Usage", "unit": "%", "col": "cpu_usage"},
    "ram_usage": {"name": "RAM Usage", "unit": "%", "col": "ram_usage"},
    "disk_usage": {"name": "Disk Usage", "unit": "%", "col": "disk_usage"},
    "network_in": {"name": "Network Incoming", "unit": "MB/s", "col": "network_receive"},
    "network_out": {"name": "Network Outgoing", "unit": "MB/s", "col": "network_send"},
    "network_usage": {"name": "Total Network Bandwidth", "unit": "MB/s", "col": "network_usage"},
    "temperature": {"name": "CPU Temperature", "unit": "°C", "col": "temperature"},
    "uptime": {"name": "System Uptime", "unit": "hours", "col": "uptime"},
    "used_memory": {"name": "Used Memory", "unit": "GB", "prom": "(windows_memory_physical_total_bytes{sel} - windows_memory_available_bytes{sel}) / 1024^3"},
    "free_memory": {"name": "Available Memory", "unit": "GB", "prom": "windows_memory_available_bytes{sel} / 1024^3"},
    "disk_read": {"name": "Disk Read Speed", "unit": "MB/s", "prom": "rate(windows_logical_disk_read_bytes_total{sel}[1m]) / 1024^2"},
    "disk_write": {"name": "Disk Write Speed", "unit": "MB/s", "prom": "rate(windows_logical_disk_written_bytes_total{sel}[1m]) / 1024^2"},
    "processes": {"name": "System Processes", "unit": "count", "prom": "windows_system_processes{sel}"},
    "threads": {"name": "System Threads", "unit": "count", "prom": "windows_system_threads{sel}"},
    "queue": {"name": "Processor Queue", "unit": "length", "prom": "windows_system_processor_queue_length{sel}"},
    "context_switches": {"name": "Context Switches", "unit": "/s", "prom": "rate(windows_system_context_switches_total{sel}[1m])"},
    "system_calls": {"name": "System Calls", "unit": "/s", "prom": "rate(windows_system_system_calls_total{sel}[1m])"},
    "exceptions": {"name": "Exceptions", "unit": "/s", "prom": "rate(windows_system_exception_dispatches_total{sel}[1m])"},
}


def _parse_time_bounds(data):
    time_range = str(data.get("time_range") or "24h").strip().lower()
    now = datetime.utcnow()

    range_deltas = {
        "15m": timedelta(minutes=15),
        "30m": timedelta(minutes=30),
        "1h": timedelta(hours=1),
        "6h": timedelta(hours=6),
        "12h": timedelta(hours=12),
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
    }

    if time_range in range_deltas:
        start_dt = now - range_deltas[time_range]
        end_dt = now
    elif time_range == "custom":
        raw_start = data.get("start_time")
        raw_end = data.get("end_time")
        if not raw_start or not raw_end:
            raise ValueError("Start date and end date are required for custom time range.")
        try:
            start_dt = datetime.fromisoformat(raw_start.replace("Z", "+00:00")).astimezone(timezone.utc).replace(tzinfo=None)
            end_dt = datetime.fromisoformat(raw_end.replace("Z", "+00:00")).astimezone(timezone.utc).replace(tzinfo=None)
        except Exception:
            raise ValueError("Invalid custom date format. Use ISO 8601 strings.")

        if start_dt >= end_dt:
            raise ValueError("Start date must be earlier than end date.")
        if end_dt > now + timedelta(minutes=5):
            end_dt = now
    else:
        start_dt = now - timedelta(hours=24)
        end_dt = now
        time_range = "24h"

    return start_dt, end_dt, time_range


def _fetch_report_dataset(server_id, metric_keys, start_dt, end_dt):
    server = Server.query.get(server_id) if server_id and server_id != "ALL" else None

    # 1. Query PostgreSQL metrics_history
    query = MetricsHistory.query.filter(
        MetricsHistory.created_at >= start_dt,
        MetricsHistory.created_at <= end_dt,
    )
    if server:
        query = query.filter(MetricsHistory.server_id == server.id)

    rows = query.order_by(MetricsHistory.created_at.asc()).all()

    # Downsampling if many points
    target_count = 100
    step_skip = max(1, len(rows) // target_count)
    sampled_rows = rows[::step_skip]
    if rows and rows[-1] not in sampled_rows:
        sampled_rows.append(rows[-1])

    data_points = []
    for r in sampled_rows:
        if not r.created_at:
            continue
        pt = {
            "time": r.created_at.isoformat() + "Z",
            "timestamp": r.created_at.timestamp(),
        }
        for key in metric_keys:
            m_def = METRIC_DEFINITIONS.get(key, {})
            col = m_def.get("col")
            if col and hasattr(r, col):
                val = getattr(r, col)
                if val is not None:
                    if key == "uptime":
                        # If val > 10000, it was stored in seconds; otherwise it is already in hours
                        uptime_hours = float(val) / 3600.0 if float(val) > 10000 else float(val)
                        pt[key] = round(uptime_hours, 2)
                    elif key == "temperature":
                        temp_f = float(val)
                        pt[key] = round(temp_f, 2) if temp_f > 0 else None
                    else:
                        pt[key] = round(float(val), 2)
                else:
                    pt[key] = None
        data_points.append(pt)

    prom_service = PrometheusService()
    duration_sec = int((end_dt - start_dt).total_seconds())
    step = max(15, duration_sec // 72)
    selector = f'{{instance="{server.prometheus_instance}",job="windows_exporter"}}' if (server and server.prometheus_instance) else '{job="windows_exporter"}'

    # Real Prometheus fallback for CPU Temperature if historical rows have 0 or None
    if "temperature" in metric_keys:
        has_real_temp = any(pt.get("temperature") is not None and pt["temperature"] > 0 for pt in data_points)
        if not has_real_temp:
            try:
                prom_res = prom_service.query("lhm_cpu_temperature_celsius", start=start_dt.timestamp(), end=end_dt.timestamp(), step=step)
                if prom_res and len(prom_res) > 0:
                    v_list = prom_res[0].get("values", [])
                    if not data_points:
                        for ts, val in v_list:
                            data_points.append({
                                "time": datetime.fromtimestamp(float(ts), tz=timezone.utc).isoformat(),
                                "timestamp": float(ts),
                                "temperature": round(float(val), 2),
                            })
                    else:
                        for pt in data_points:
                            t_epoch = pt["timestamp"]
                            nearest = min(v_list, key=lambda v: abs(float(v[0]) - t_epoch)) if v_list else None
                            if nearest:
                                pt["temperature"] = round(float(nearest[1]), 2)
            except Exception as exc:
                logger.warning("Prometheus temperature query failed: %s", exc)

    # Real Prometheus fallback for Uptime if all values are 0 or None
    if "uptime" in metric_keys:
        has_real_uptime = any(pt.get("uptime") is not None and pt["uptime"] > 0 for pt in data_points)
        if not has_real_uptime:
            try:
                uptime_expr = f'(time() - windows_system_boot_time_timestamp{selector}) / 3600'
                prom_res = prom_service.query(uptime_expr, start=start_dt.timestamp(), end=end_dt.timestamp(), step=step)
                if prom_res and len(prom_res) > 0:
                    v_list = prom_res[0].get("values", [])
                    for pt in data_points:
                        t_epoch = pt["timestamp"]
                        nearest = min(v_list, key=lambda v: abs(float(v[0]) - t_epoch)) if v_list else None
                        if nearest:
                            pt["uptime"] = round(float(nearest[1]), 2)
            except Exception as exc:
                logger.warning("Prometheus uptime query failed: %s", exc)

    # 2. If Prometheus metrics are requested that aren't in metrics_history
    prom_metrics = [k for k in metric_keys if METRIC_DEFINITIONS.get(k, {}).get("prom")]
    if prom_metrics:
        for p_key in prom_metrics:
            expr = METRIC_DEFINITIONS[p_key]["prom"].replace("{sel}", selector)
            try:
                prom_res = prom_service.query(expr, start=start_dt.timestamp(), end=end_dt.timestamp(), step=step)
                if prom_res and len(prom_res) > 0:
                    values_list = prom_res[0].get("values", [])
                    # Merge or populate
                    if not data_points:
                        for ts, val in values_list:
                            data_points.append({
                                "time": datetime.fromtimestamp(float(ts), tz=timezone.utc).isoformat(),
                                "timestamp": float(ts),
                                p_key: round(float(val), 2),
                            })
                    else:
                        # Nearest neighbor match
                        for pt in data_points:
                            t_epoch = pt["timestamp"]
                            nearest = min(values_list, key=lambda v: abs(float(v[0]) - t_epoch)) if values_list else None
                            if nearest and abs(float(nearest[0]) - t_epoch) <= step * 2:
                                pt[p_key] = round(float(nearest[1]), 2)
                            else:
                                pt[p_key] = None
            except Exception as exc:
                logger.warning("Prometheus metric %s query failed: %s", p_key, exc)

    # 3. Calculate statistics for each metric
    statistics = {}
    for key in metric_keys:
        m_def = METRIC_DEFINITIONS.get(key, {})
        valid_vals = []
        peak_time = None
        peak_val = None

        for pt in data_points:
            v = pt.get(key)
            if v is not None and isinstance(v, (int, float)):
                valid_vals.append((v, pt["time"]))
                if peak_val is None or v > peak_val:
                    peak_val = v
                    peak_time = pt["time"]

        if valid_vals:
            nums = [x[0] for x in valid_vals]
            statistics[key] = {
                "name": m_def.get("name", key),
                "unit": m_def.get("unit", ""),
                "min": round(min(nums), 2),
                "max": round(max(nums), 2),
                "peak": round(max(nums), 2),
                "avg": round(sum(nums) / len(nums), 2),
                "latest": round(valid_vals[-1][0], 2),
                "peak_time": peak_time,
                "sample_count": len(valid_vals),
            }
        else:
            statistics[key] = {
                "name": m_def.get("name", key),
                "unit": m_def.get("unit", ""),
                "min": None,
                "max": None,
                "peak": None,
                "avg": None,
                "latest": None,
                "peak_time": None,
                "sample_count": 0,
            }

    return server, data_points, statistics


@reports_bp.route("/data", methods=["POST"])
@jwt_required_api
def get_report_data():
    """Fetches real historical report data and computed statistics."""
    data = request.get_json() or {}
    server_id = data.get("server_id")
    raw_metrics = data.get("metrics") or ["cpu_usage", "ram_usage", "disk_usage"]

    metric_keys = [m for m in raw_metrics if m in METRIC_DEFINITIONS]
    if not metric_keys:
        metric_keys = ["cpu_usage", "ram_usage", "disk_usage"]

    try:
        start_dt, end_dt, time_range = _parse_time_bounds(data)
    except ValueError as exc:
        return api_response(False, str(exc), None, 400)

    server, data_points, statistics = _fetch_report_dataset(server_id, metric_keys, start_dt, end_dt)

    payload = {
        "server": server.to_dict() if server else {"id": None, "name": "All Servers"},
        "time_range": time_range,
        "start": start_dt.isoformat() + "Z",
        "end": end_dt.isoformat() + "Z",
        "metrics": metric_keys,
        "statistics": statistics,
        "series": data_points,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
    return api_response(True, "Report data fetched", payload, 200)


def _clean_str(val):
    if val is None:
        return ""
    return str(val).encode("latin-1", "replace").decode("latin-1")


def _build_pdf_report(server_name, time_range, start_dt, end_dt, metric_keys, statistics, data_points, filepath):
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Header branding
    pdf.set_fill_color(15, 23, 42)
    pdf.rect(0, 0, 210, 32, "F")
    pdf.set_font("Arial", "B", 18)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(15, 8)
    pdf.cell(0, 8, _clean_str("SHMS - Server Health Monitoring System"), 0, 1)

    pdf.set_font("Arial", "", 10)
    pdf.set_text_color(148, 163, 184)
    pdf.set_xy(15, 18)
    pdf.cell(0, 6, _clean_str("Enterprise Infrastructure Performance Report"), 0, 1)

    # Metadata Card
    pdf.set_xy(15, 38)
    pdf.set_font("Arial", "B", 12)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 8, _clean_str("Report Details"), 0, 1)

    pdf.set_font("Arial", "", 9)
    pdf.set_text_color(71, 85, 105)
    pdf.cell(40, 6, _clean_str(f"Target Server: {server_name}"), 0, 0)
    pdf.cell(50, 6, _clean_str(f"Time Range: {time_range.upper()}"), 0, 0)
    pdf.cell(0, 6, _clean_str(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC"), 0, 1)

    pdf.cell(90, 6, _clean_str(f"Window Start: {start_dt.strftime('%Y-%m-%d %H:%M:%S')} UTC"), 0, 0)
    pdf.cell(0, 6, _clean_str(f"Window End: {end_dt.strftime('%Y-%m-%d %H:%M:%S')} UTC"), 0, 1)
    pdf.ln(4)

    # Statistics Summary Table
    pdf.set_font("Arial", "B", 12)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 8, _clean_str("Executive Metric Statistics"), 0, 1)

    pdf.set_font("Arial", "B", 9)
    pdf.set_fill_color(241, 245, 249)
    pdf.set_text_color(51, 65, 85)
    pdf.cell(45, 7, _clean_str("Metric"), 1, 0, "L", True)
    pdf.cell(20, 7, _clean_str("Unit"), 1, 0, "C", True)
    pdf.cell(25, 7, _clean_str("Min"), 1, 0, "R", True)
    pdf.cell(25, 7, _clean_str("Average"), 1, 0, "R", True)
    pdf.cell(25, 7, _clean_str("Peak / Max"), 1, 0, "R", True)
    pdf.cell(25, 7, _clean_str("Latest"), 1, 0, "R", True)
    pdf.cell(15, 7, _clean_str("Points"), 1, 1, "C", True)

    pdf.set_font("Arial", "", 9)
    pdf.set_text_color(30, 41, 59)
    for key in metric_keys:
        stat = statistics.get(key, {})
        name = stat.get("name", key)
        unit = stat.get("unit", "")
        min_val = f"{stat['min']}" if stat.get("min") is not None else "--"
        avg_val = f"{stat['avg']}" if stat.get("avg") is not None else "--"
        max_val = f"{stat['max']}" if stat.get("max") is not None else "--"
        latest_val = f"{stat['latest']}" if stat.get("latest") is not None else "--"
        count = f"{stat.get('sample_count', 0)}"

        pdf.cell(45, 6, _clean_str(name[:24]), 1, 0, "L")
        pdf.cell(20, 6, _clean_str(unit), 1, 0, "C")
        pdf.cell(25, 6, _clean_str(min_val), 1, 0, "R")
        pdf.cell(25, 6, _clean_str(avg_val), 1, 0, "R")
        pdf.cell(25, 6, _clean_str(max_val), 1, 0, "R")
        pdf.cell(25, 6, _clean_str(latest_val), 1, 0, "R")
        pdf.cell(15, 6, _clean_str(count), 1, 1, "C")

    pdf.ln(6)

    # Detailed Telemetry Samples Table
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, _clean_str("Telemetry Time-Series Sample Data"), 0, 1)

    pdf.set_font("Arial", "B", 8)
    pdf.set_fill_color(241, 245, 249)
    pdf.cell(45, 6, _clean_str("Timestamp (UTC)"), 1, 0, "L", True)

    display_metrics = metric_keys[:5]
    col_width = max(24, int(135 / max(1, len(display_metrics))))
    for key in display_metrics:
        stat = statistics.get(key, {})
        lbl = f"{stat.get('name', key)[:12]} ({stat.get('unit', '')})"
        pdf.cell(col_width, 6, _clean_str(lbl), 1, 0, "R", True)
    pdf.ln()

    pdf.set_font("Arial", "", 8)
    # Print up to 35 evenly spaced samples
    sample_rows = data_points[:: max(1, len(data_points) // 35)]
    for pt in sample_rows:
        t_str = pt.get("time", "")[:19].replace("T", " ")
        pdf.cell(45, 5, _clean_str(t_str), 1, 0, "L")
        for key in display_metrics:
            val = pt.get(key)
            val_str = f"{val:.1f}" if val is not None else "--"
            pdf.cell(col_width, 5, _clean_str(val_str), 1, 0, "R")
        pdf.ln()

    # Footer
    pdf.set_y(-15)
    pdf.set_font("Arial", "I", 8)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 10, _clean_str("SHMS Operations Console - Confidential Infrastructure Report"), 0, 0, "C")

    pdf.output(filepath, "F")


@reports_bp.route("/generate", methods=["POST"])
@jwt_required_api
def generate_report():
    """Generates a permanent downloadable report file and saves to database history."""
    data = request.get_json() or {}
    server_id = data.get("server_id")
    raw_metrics = data.get("metrics") or ["cpu_usage", "ram_usage", "disk_usage"]
    fmt = str(data.get("format") or "CSV").strip().upper()

    if fmt not in {"CSV", "PDF", "JSON"}:
        fmt = "CSV"

    metric_keys = [m for m in raw_metrics if m in METRIC_DEFINITIONS]
    if not metric_keys:
        metric_keys = ["cpu_usage", "ram_usage", "disk_usage"]

    try:
        start_dt, end_dt, time_range = _parse_time_bounds(data)
    except ValueError as exc:
        return api_response(False, str(exc), None, 400)

    server, data_points, statistics = _fetch_report_dataset(server_id, metric_keys, start_dt, end_dt)
    server_name = server.name if server else "All-Servers"
    clean_server = server_name.lower().replace(" ", "-")

    # Filename convention
    filename = f"shms-{clean_server}-{time_range}.{fmt.lower()}"
    filepath = os.path.join(EXPORTS_DIR, filename)

    if fmt == "CSV":
        columns = ["timestamp"] + metric_keys
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(columns)
            for pt in data_points:
                row = [pt["time"]] + [pt.get(k, "") if pt.get(k) is not None else "" for k in metric_keys]
                writer.writerow(row)
    elif fmt == "PDF":
        try:
            _build_pdf_report(
                server_name=server_name,
                time_range=time_range,
                start_dt=start_dt,
                end_dt=end_dt,
                metric_keys=metric_keys,
                statistics=statistics,
                data_points=data_points,
                filepath=filepath,
            )
        except Exception as exc:
            logger.exception("Failed generating PDF report: %s", exc)
            return api_response(False, f"Failed to build PDF report: {exc}", None, 500)
    elif fmt == "JSON":
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump({
                "title": f"SHMS Telemetry Report - {server_name}",
                "server": server.to_dict() if server else {"id": None, "name": "All Servers"},
                "time_range": time_range,
                "start": start_dt.isoformat() + "Z",
                "end": end_dt.isoformat() + "Z",
                "metrics": metric_keys,
                "statistics": statistics,
                "series": data_points,
                "generated_at": datetime.utcnow().isoformat() + "Z",
            }, f, indent=2)

    file_size = os.path.getsize(filepath) if os.path.exists(filepath) else 0

    # Persist in Report model
    try:
        report = Report(
            name=filename,
            server_id=server.id if server else None,
            server_name=server_name,
            metrics=",".join(metric_keys),
            time_range=time_range,
            start_time=start_dt,
            end_time=end_dt,
            format=fmt,
            file_path=filepath,
            file_size=file_size,
            status="completed",
            statistics=json.dumps(statistics),
        )
        db.session.add(report)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        logger.exception("Failed to save report record in database: %s", exc)
        return api_response(False, f"Report generated but database save failed: {exc}", None, 500)

    res_payload = report.to_dict()
    res_payload["download_url"] = f"/api/reports/{report.id}/download"
    return api_response(True, "Report generated successfully", res_payload, 201)


@reports_bp.route("", methods=["GET"])
@jwt_required_api
def list_reports():
    """Lists generated report history."""
    reports = Report.query.order_by(Report.id.desc()).limit(50).all()
    payload = [r.to_dict() for r in reports]
    for p in payload:
        p["download_url"] = f"/api/reports/{p['id']}/download"
    return api_response(True, "Reports fetched", payload, 200)


@reports_bp.route("/<int:report_id>/download", methods=["GET"])
@reports_bp.route("/api/reports/<int:report_id>/download", methods=["GET"])
def download_report(report_id):
    """Serves the generated report file."""
    report = Report.query.get_or_404(report_id)
    if not report.file_path or not os.path.exists(report.file_path):
        return api_response(False, "Report file not found on server", None, 404)

    mimetypes = {
        "PDF": "application/pdf",
        "CSV": "text/csv",
        "JSON": "application/json",
    }
    mimetype = mimetypes.get(report.format, "application/octet-stream")
    return send_file(
        report.file_path,
        mimetype=mimetype,
        as_attachment=True,
        download_name=report.name,
    )


@reports_bp.route("/<int:report_id>", methods=["DELETE"])
@jwt_required_api
def delete_report(report_id):
    """Deletes a report record and its file."""
    report = Report.query.get_or_404(report_id)
    try:
        if report.file_path and os.path.exists(report.file_path):
            try:
                os.remove(report.file_path)
            except OSError:
                pass
        db.session.delete(report)
        db.session.commit()
        return api_response(True, "Report deleted successfully", {"id": report_id}, 200)
    except Exception as exc:
        db.session.rollback()
        return api_response(False, f"Failed to delete report: {exc}", None, 500)
