================================================================================
SHMS MACHINE LEARNING & PREDICTIVE ANALYTICS ENGINE
================================================================================

This folder contains the complete, standalone Python Machine Learning & Statistical
Analytics Engine used by the Server Health Monitoring System (SHMS) Predictions Page.

It is decoupled from the web frontend, Flask API, and PostgreSQL database,
allowing it to be executed independently as a CLI tool or imported into external
Python pipelines.

--------------------------------------------------------------------------------
1. CORE ALGORITHMS & MATHEMATICAL LOGIC
--------------------------------------------------------------------------------

The engine implements five core mathematical algorithms copied directly from the
SHMS production predictions pipeline:

A. LEAST-SQUARES LINEAR REGRESSION (TREND MODELING)
   - Evaluates consecutive time-series samples (up to the most recent 120 samples).
   - Computes:
       slope (m) = sum((x - x_mean) * (y - y_mean)) / sum((x - x_mean)^2)
       intercept (b) = y_mean - m * x_mean
   - Computes coefficient of determination R^2:
       R^2 = 1 - (SS_residual / SS_total)

B. MULTI-HORIZON TREND FORECASTING
   - Supports five distinct forecast horizons:
       * 30m  (30 Minutes)
       * 1h   (1 Hour)
       * 6h   (6 Hours)
       * 24h  (24 Hours)
       * 7d   (7 Days)
   - Automatically detects sample cadence (time delta between readings).
   - Projects between 10 and 72 future time steps based on horizon length.
   - Constrains percentage-based metrics (CPU, RAM, Disk) to honest bounds [0%, 100%].
   - Constrains throughput and count metrics to non-negative bounds (>= 0).

C. STATISTICAL CONFIDENCE SCORING
   - Derived directly from regression model goodness-of-fit (R^2).
   - Formula:
       Confidence = 50.0 + (R^2 * 49.0)
   - Bounded to the interval [50.0%, 99.0%].
   - High R^2 (linear, predictable trend) results in 90%+ confidence.
   - Noisy, chaotic readings reduce confidence toward 50%.

D. DETERMINISTIC INFRASTRUCTURE HEALTH SCORE
   - Computes a combined 0-100 system score:
       Health = 100.0 - mean(CPU_Usage, RAM_Usage, Disk_Usage)
   - Thermal Degradation Penalty:
       If CPU Temperature > 80°C:
           Penalty = (Temperature - 80.0) * 1.5
           Health = max(0.0, Health - Penalty)
   - Computes both Current Health and Predicted Future Health.

E. Z-SCORE ANOMALY DETECTION & BASELINE DEVIATION
   - Calculates historical mean baseline and population standard deviation (pstdev).
   - Deviation percentage:
       Deviation% = (|Current_Value - Baseline_Mean| / Standard_Deviation) * 100
   - Severity Classification:
       * CRITICAL: Deviation >= 75%, or Current Metric > 90%, or Temp > 85°C.
       * WARNING : Deviation >= 25%, or Disk > 90%, or Temp > 80°C.
       * NORMAL  : Within baseline tolerances.

--------------------------------------------------------------------------------
2. FILE STRUCTURE
--------------------------------------------------------------------------------

ml-engine/
  ├── predictor.py    --> Complete standalone ML engine & CLI runner
  ├── README.txt      --> Plain-text documentation & usage runbook
  └── README.md       --> Markdown-formatted documentation

--------------------------------------------------------------------------------
3. HOW TO RUN THE ENGINE
--------------------------------------------------------------------------------

Prerequisites:
  Python 3.9+ (uses Python standard library: statistics, datetime, json, math)
  No external dependencies required (no pip install needed).

A. Run Default Demonstration (Synthetic Telemetry)
   From the repository root:
     python ml-engine/predictor.py

   From inside the ml-engine directory:
     cd ml-engine
     python predictor.py

B. Run with a Custom JSON Telemetry File
     python ml-engine/predictor.py path/to/telemetry.json

--------------------------------------------------------------------------------
4. INPUT TELEMETRY DATA FORMAT
--------------------------------------------------------------------------------

The engine expects an array of telemetry objects sorted chronologically:

[
  {
    "time": "2026-09-12T10:00:00Z",
    "cpu_usage": 45.2,
    "ram_usage": 60.1,
    "disk_usage": 68.4,
    "temperature": 55.0,
    "network_usage": 5.2
  },
  {
    "time": "2026-09-12T10:02:00Z",
    "cpu_usage": 48.0,
    "ram_usage": 60.5,
    "disk_usage": 68.5,
    "temperature": 56.2,
    "network_usage": 6.1
  }
]

Supported metric keys:
  * cpu_usage       (float, 0-100 %)
  * ram_usage       (float, 0-100 %)
  * disk_usage      (float, 0-100 %)
  * temperature     (float, °C)
  * network_usage   (float, MB/s)
  * network_receive (float, MB/s)
  * network_send    (float, MB/s)

--------------------------------------------------------------------------------
5. EMBEDDED PYTHON API USAGE
--------------------------------------------------------------------------------

You can import and use SHMSPredictor directly in your own scripts:

```python
from predictor import SHMSPredictor

# Initialize engine with preferred horizon: "30m", "1h", "6h", "24h", "7d"
engine = SHMSPredictor(horizon="6h")

# Your list of telemetry dictionaries
samples = [
    {"time": "2026-09-12T12:00:00Z", "cpu_usage": 45.0, "ram_usage": 52.0, "disk_usage": 60.0, "temperature": 55.0},
    {"time": "2026-09-12T12:05:00Z", "cpu_usage": 48.0, "ram_usage": 53.0, "disk_usage": 60.1, "temperature": 56.0},
    # ...
]

results = engine.analyze(samples)

print("Current Health  :", results["health_score"])
print("Predicted Health:", results["predicted_health_score"])
print("Confidence      :", results["confidence_score"], "%")
print("Predicted CPU   :", results["predicted_metrics"]["cpu_usage"], "%")
print("Detected Anomalies:", len(results["anomalies"]))
```

--------------------------------------------------------------------------------
6. OUTPUT SCHEMA
--------------------------------------------------------------------------------

The `analyze()` method returns a dictionary containing:
  - status:                 "success" or "insufficient_data"
  - horizon:                Selected horizon code (e.g. "6h")
  - horizon_hours:          Horizon duration in hours (e.g. 6.0)
  - data_points_count:      Number of analyzed samples
  - current_metrics:        Dict of latest readings per metric
  - averages:               Dict of historical baseline averages
  - predicted_metrics:      Dict of projected future values
  - health_score:           Current health score (0-100)
  - predicted_health_score: Projected future health score (0-100)
  - confidence_score:       Overall statistical confidence (50-99%)
  - metric_confidences:     Per-metric confidence breakdown
  - anomaly_score:          Overall anomaly index (0-100)
  - anomalies:              List of detected anomaly records
  - forecast_series:        Time-series array of future projected points
  - analyzed_at:            ISO 8601 UTC timestamp of execution

================================================================================
SHMS v3.1 Enterprise Operations
================================================================================
