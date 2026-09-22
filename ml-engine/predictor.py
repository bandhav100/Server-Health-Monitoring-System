"""
SHMS Machine Learning Engine (Standalone)
=========================================
Independent Python Machine Learning & Statistical Analytics Engine for
Server Health Monitoring System (SHMS).

This module contains the exact mathematical algorithms used by the SHMS
Predictions Page:
1. Least-Squares Linear Regression Trend Modeling
2. Multi-Horizon Future Metric Forecasting (30m, 1h, 6h, 24h, 7d)
3. Goodness-of-Fit Confidence Scoring (R^2 Coefficient of Determination)
4. Deterministic Infrastructure Health Scoring (with thermal penalty)
5. Z-Score Statistical Anomaly Detection & Baseline Deviation Analysis

This file can run completely standalone without Flask, PostgreSQL, or web services.
"""

from datetime import datetime, timedelta, timezone
import json
import math
import sys
from statistics import mean, pstdev


METRICS = (
    "cpu_usage",
    "ram_usage",
    "disk_usage",
    "network_usage",
    "network_receive",
    "network_send",
    "temperature",
)

RANGE_HOURS = {
    "30m": 0.5,
    "1h": 1.0,
    "6h": 6.0,
    "24h": 24.0,
    "7d": 168.0,
}

RANGE_LABELS = {
    "30m": "30-Minute",
    "1h": "1-Hour",
    "6h": "6-Hour",
    "24h": "24-Hour",
    "7d": "7-Day",
}


# =====================================================================
# 1. CORE STATISTICAL & MATHEMATICAL FUNCTIONS
# =====================================================================

def linear_regression(values):
    """
    Computes least-squares linear regression (intercept, slope, r_squared)
    over a sequence of numerical float values.

    Formula:
        slope (m) = sum((x - x_mean) * (y - y_mean)) / sum((x - x_mean)^2)
        intercept (b) = y_mean - m * x_mean
        R^2 = 1 - (SS_res / SS_tot)
    """
    n = len(values)
    if n < 2:
        return (values[-1] if n == 1 else 0.0), 0.0, 0.0

    x_mean = (n - 1) / 2.0
    y_mean = sum(values) / n
    numerator = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(values))
    denominator = sum((i - x_mean) ** 2 for i in range(n))
    slope = (numerator / denominator) if denominator != 0 else 0.0
    intercept = y_mean - slope * x_mean

    # Coefficient of determination R^2
    ss_tot = sum((y - y_mean) ** 2 for y in values)
    ss_res = sum((y - (intercept + slope * i)) ** 2 for i, y in enumerate(values))
    r_squared = (1.0 - (ss_res / ss_tot)) if ss_tot > 1e-6 else 1.0
    return intercept, slope, max(0.0, min(1.0, r_squared))


def forecast_metric(timestamps, values, horizon_hours=6.0, is_percentage=True):
    """
    Generates real trend forecast points using least-squares linear regression.

    Parameters:
        timestamps: list of datetime objects or ISO timestamp strings
        values: list of float values
        horizon_hours: prediction window into future (e.g., 0.5, 1.0, 6.0, 24.0)
        is_percentage: if True, bounds predictions to [0.0, 100.0]

    Returns:
        list of dicts: [{"timestamp": "...", "value": 45.2}, ...]
    """
    if len(values) < 2:
        return []

    # Use up to the most recent 120 samples for active trend modeling
    recent_values = values[-120:]
    n = len(recent_values)
    intercept, slope, _ = linear_regression(recent_values)

    # Determine cadence
    last_dt = timestamps[-1]
    if isinstance(last_dt, str):
        try:
            last_dt = datetime.fromisoformat(last_dt.replace("Z", "+00:00"))
        except Exception:
            last_dt = datetime.utcnow()

    prev_dt = timestamps[-2]
    if isinstance(prev_dt, str):
        try:
            prev_dt = datetime.fromisoformat(prev_dt.replace("Z", "+00:00"))
        except Exception:
            prev_dt = last_dt - timedelta(seconds=60)

    delta_sec = (last_dt - prev_dt).total_seconds()
    cadence = max(delta_sec, 15.0) if delta_sec > 0 else 60.0

    desired_points = int((horizon_hours * 3600.0) / cadence)
    points = max(10, min(72, desired_points))

    forecast_points = []
    for idx in range(points):
        pred = intercept + slope * (n + idx)
        if is_percentage:
            pred = max(0.0, min(100.0, pred))
        else:
            pred = max(0.0, pred)

        future_time = last_dt + timedelta(seconds=cadence * (idx + 1))
        forecast_points.append({
            "timestamp": future_time.isoformat() + "Z",
            "value": round(pred, 2),
        })

    return forecast_points


def confidence_score(values):
    """
    Calculates statistical confidence percentage based on model fit (R^2)
    and sample variance, clamped to honest range [50.0%, 99.0%].
    """
    if len(values) < 3:
        return None
    recent = values[-120:]
    _, _, r2 = linear_regression(recent)
    return round(max(50.0, min(99.0, 50.0 + r2 * 49.0)), 1)


def health_score(cpu, ram, disk, temperature=0.0):
    """
    Calculates deterministic health score matching SHMS standard:
        100 - avg(cpu, ram, disk) with thermal penalty if temperature > 80.
    """
    values = [cpu or 0.0, ram or 0.0, disk or 0.0]
    avg_load = sum(values) / len(values)
    score = max(0.0, min(100.0, 100.0 - avg_load))
    if temperature and temperature > 80.0:
        score = max(0.0, score - (temperature - 80.0) * 1.5)
    return round(score, 1)


def detect_anomalies(data_points):
    """
    Performs Z-score and statistical deviation analysis over historical data.

    Parameters:
        data_points: list of dicts with metric fields and timestamps:
            [{"time": "...", "cpu_usage": 45.2, "ram_usage": 60.1, ...}, ...]

    Returns:
        list of anomaly alerts sorted by newest timestamp.
    """
    if len(data_points) < 3:
        return []

    latest = data_points[-1]
    labels = {
        "cpu_usage": "CPU",
        "ram_usage": "RAM",
        "disk_usage": "Disk",
        "temperature": "Temperature",
        "network_usage": "Network",
    }

    result = []
    for field, label in labels.items():
        vals = [float(pt.get(field) or 0.0) for pt in data_points if pt.get(field) is not None]
        if len(vals) < 3:
            continue

        expected = mean(vals)
        stdev = pstdev(vals)
        current = float(latest.get(field) or 0.0)
        deviation = (abs(current - expected) / stdev * 100.0) if stdev > 1e-4 else 0.0

        if deviation >= 25.0 or (field == "temperature" and current > 80.0) or (field == "disk_usage" and current > 90.0):
            severity = "critical" if (deviation >= 75.0 or current > 90.0 or (field == "temperature" and current > 85.0)) else "warning"
            result.append({
                "time": latest.get("time") or datetime.utcnow().isoformat() + "Z",
                "metric": label,
                "field": field,
                "current_value": round(current, 2),
                "expected_value": round(expected, 2),
                "deviation_percent": round(deviation, 1),
                "severity": severity,
                "reason": f"{label} reading {round(current, 2)} deviates significantly from historical baseline {round(expected, 2)}",
            })

    return sorted(result, key=lambda x: x["time"], reverse=True)


# =====================================================================
# 2. STANDALONE ML PREDICTION ENGINE CLASS
# =====================================================================

class SHMSPredictor:
    """
    High-level Machine Learning and Forecasting Engine for Server Telemetry.
    """

    def __init__(self, horizon="6h"):
        self.horizon = horizon
        self.horizon_hours = RANGE_HOURS.get(horizon, 6.0)

    def analyze(self, data_points):
        """
        Executes complete end-to-end telemetry analysis:
        - Current baseline averages
        - Linear regression trend modeling
        - Future forecasted metrics across all dimensions
        - Current vs Predicted health score
        - Metric-level statistical confidence
        - Active anomaly detection
        """
        if not data_points or len(data_points) < 2:
            return {
                "status": "insufficient_data",
                "message": "At least 2 data points required for statistical trend analysis.",
            }

        timestamps = [pt.get("time") or pt.get("timestamp") for pt in data_points]
        latest = data_points[-1]

        current = {}
        averages = {}
        forecasts = {}
        confidences = {}

        for m in METRICS:
            vals = [float(pt.get(m) or 0.0) for pt in data_points if pt.get(m) is not None]
            if not vals:
                vals = [0.0]
            current[m] = float(latest.get(m) or 0.0)
            averages[m] = round(mean(vals), 2)
            is_pct = m in ("cpu_usage", "ram_usage", "disk_usage")
            fc = forecast_metric(timestamps, vals, horizon_hours=self.horizon_hours, is_percentage=is_pct)
            forecasts[m] = fc
            confidences[m] = confidence_score(vals)

        predicted = {m: (forecasts[m][-1]["value"] if forecasts[m] else current[m]) for m in METRICS}

        health_current = health_score(
            current.get("cpu_usage", 0.0),
            current.get("ram_usage", 0.0),
            current.get("disk_usage", 0.0),
            current.get("temperature", 0.0),
        )

        health_predicted = health_score(
            predicted.get("cpu_usage", 0.0),
            predicted.get("ram_usage", 0.0),
            predicted.get("disk_usage", 0.0),
            predicted.get("temperature", 0.0),
        )

        valid_conf = [c for c in confidences.values() if c is not None]
        overall_confidence = round(mean(valid_conf), 1) if valid_conf else None

        # Anomaly scoring
        anomaly_scores = []
        for field in ("cpu_usage", "ram_usage", "disk_usage", "network_usage"):
            vals = [float(pt.get(field) or 0.0) for pt in data_points if pt.get(field) is not None]
            if len(vals) >= 2:
                std = pstdev(vals)
                if std > 1e-4:
                    z = abs(current[field] - averages[field]) / std
                    anomaly_scores.append(min(100.0, z * 25.0))
                else:
                    anomaly_scores.append(0.0)
        overall_anomaly_score = round(mean(anomaly_scores), 1) if anomaly_scores else 0.0

        detected_anomalies = detect_anomalies(data_points)

        return {
            "status": "success",
            "horizon": self.horizon,
            "horizon_hours": self.horizon_hours,
            "data_points_count": len(data_points),
            "current_metrics": current,
            "averages": averages,
            "predicted_metrics": predicted,
            "health_score": health_current,
            "predicted_health_score": health_predicted,
            "confidence_score": overall_confidence,
            "metric_confidences": confidences,
            "anomaly_score": overall_anomaly_score,
            "anomalies": detected_anomalies,
            "forecast_series": forecasts,
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
        }


# =====================================================================
# 3. STANDALONE CLI & DEMONSTRATION RUNNER
# =====================================================================

def _generate_synthetic_sample_data(num_samples=30):
    """Generates realistic telemetry samples for demonstration purposes."""
    base_time = datetime.now(timezone.utc) - timedelta(minutes=num_samples * 2)
    samples = []
    for i in range(num_samples):
        dt = base_time + timedelta(minutes=i * 2)
        # Upward creeping CPU trend with noise
        cpu = 30.0 + (i * 0.8) + (math.sin(i) * 3.5)
        # Moderate RAM usage
        ram = 48.0 + (i * 0.2) + (math.cos(i) * 1.5)
        # Slow disk creeping
        disk = 62.0 + (i * 0.05)
        # Temperature following CPU
        temp = 50.0 + (cpu * 0.25)
        # Network spikes
        net = 4.5 + (math.sin(i * 1.5) * 2.0)

        samples.append({
            "time": dt.isoformat(),
            "cpu_usage": round(max(0.0, min(100.0, cpu)), 2),
            "ram_usage": round(max(0.0, min(100.0, ram)), 2),
            "disk_usage": round(max(0.0, min(100.0, disk)), 2),
            "temperature": round(max(20.0, min(105.0, temp)), 2),
            "network_usage": round(max(0.0, net), 2),
            "network_receive": round(max(0.0, net * 0.6), 2),
            "network_send": round(max(0.0, net * 0.4), 2),
        })

    # Add an anomaly on the latest point for demonstration
    samples[-1]["cpu_usage"] = 84.5
    samples[-1]["temperature"] = 78.2
    return samples


def main():
    print("=================================================================")
    print("  SHMS Machine Learning Engine - Standalone Statistical Runner  ")
    print("=================================================================")

    # Check if a custom JSON file was provided as argument
    if len(sys.argv) > 1 and sys.argv[1].endswith(".json"):
        filepath = sys.argv[1]
        print(f"Loading telemetry samples from: {filepath}")
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            samples = data if isinstance(data, list) else data.get("samples", [])
        except Exception as e:
            print(f"Error loading file: {e}")
            sys.exit(1)
    else:
        print("No input file provided. Generating 30 synthetic telemetry samples...")
        samples = _generate_synthetic_sample_data(30)

    engine = SHMSPredictor(horizon="6h")
    results = engine.analyze(samples)

    print("\n--- Telemetry Overview ---")
    print(f"Historical Data Points Analyzed : {results['data_points_count']}")
    print(f"Forecasting Horizon             : {results['horizon']} ({results['horizon_hours']} hours)")
    print(f"Model Statistical Confidence    : {results['confidence_score']}%")
    print(f"Overall Anomaly Deviation Score : {results['anomaly_score']}/100")

    print("\n--- Current vs Predicted Metrics ---")
    print(f"{'Metric':<20} | {'Current':<10} | {'Baseline Avg':<12} | {'Forecast (' + results['horizon'] + ')':<15} | {'Confidence'}")
    print("-" * 75)
    for m in ("cpu_usage", "ram_usage", "disk_usage", "temperature", "network_usage"):
        cur = results['current_metrics'].get(m, 0.0)
        avg = results['averages'].get(m, 0.0)
        pred = results['predicted_metrics'].get(m, 0.0)
        conf = results['metric_confidences'].get(m)
        unit = "%" if "usage" in m else ("C" if m == "temperature" else "MB/s")
        conf_str = f"{conf}%" if conf is not None else "--"
        print(f"{m:<20} | {cur:>6.1f} {unit:<3} | {avg:>8.1f} {unit:<3} | {pred:>11.1f} {unit:<3} | {conf_str}")

    print("\n--- Health Score Assessment ---")
    print(f"Current Health Score   : {results['health_score']}/100")
    print(f"Predicted Health Score : {results['predicted_health_score']}/100")

    print("\n--- Detected Anomalies ---")
    if results['anomalies']:
        for a in results['anomalies']:
            print(f"[{a['severity'].upper()}] {a['metric']} at {a['time']}: Value={a['current_value']} (Expected={a['expected_value']}, Deviation={a['deviation_percent']}%)")
            print(f"         Reason: {a['reason']}")
    else:
        print("No active anomalies detected across analyzed window.")

    print("\n=================================================================")
    print("  Analysis Complete. Engine ready for CLI and embedded use.     ")
    print("=================================================================\n")


if __name__ == "__main__":
    main()
