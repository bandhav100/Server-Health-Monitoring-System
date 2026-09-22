# SHMS Machine Learning & Predictive Analytics Engine

Standalone, decoupled Python Machine Learning & Statistical Analytics Engine containing the core prediction, forecasting, anomaly detection, and health scoring algorithms from the **Server Health Monitoring System (SHMS)**.

---

## 1. Mathematical Algorithms

The engine implements five core mathematical algorithms copied directly from the SHMS production predictions pipeline:

### A. Least-Squares Linear Regression (Trend Modeling)
* Evaluates consecutive time-series samples (up to the most recent 120 samples).
* Calculates slope ($m$), intercept ($b$), and coefficient of determination ($R^2$):
  $$\text{slope } (m) = \frac{\sum (x - \bar{x})(y - \bar{y})}{\sum (x - \bar{x})^2}$$
  $$\text{intercept } (b) = \bar{y} - m\bar{x}$$
  $$R^2 = 1 - \frac{\text{SS}_{\text{res}}}{\text{SS}_{\text{tot}}}$$

### B. Multi-Horizon Trend Forecasting
* Supported Horizons: `30m`, `1h`, `6h`, `24h`, `7d`.
* Automatically calculates sample cadence ($\Delta t$).
* Projects between 10 and 72 future steps based on horizon length.
* Percentage metrics (CPU, RAM, Disk) are clamped to $[0\%, 100\%]$.
* Throughput/bandwidth metrics are non-negative ($\ge 0$).

### C. Statistical Confidence Scoring
* Maps goodness-of-fit ($R^2$) to honest confidence bounds:
  $$\text{Confidence} = 50.0 + (R^2 \times 49.0)$$
* Bounded to $[50.0\%, 99.0\%]$.

### D. Deterministic Infrastructure Health Scoring
* Combined health score:
  $$\text{Health} = 100.0 - \text{mean}(\text{CPU}, \text{RAM}, \text{Disk})$$
* Thermal Degradation Penalty:
  $$\text{If } T_{\text{CPU}} > 80^\circ\text{C: Penalty} = (T_{\text{CPU}} - 80) \times 1.5$$
  $$\text{Health} = \max(0.0, \text{Health} - \text{Penalty})$$

### E. Z-Score Anomaly Detection
* Computes baseline mean ($\mu$) and population standard deviation ($\sigma$).
* Deviation percentage:
  $$\text{Deviation} = \frac{|x_{\text{current}} - \mu|}{\sigma} \times 100\%$$
* Severity Rules:
  * **CRITICAL**: Deviation $\ge 75\%$, or Value $> 90\%$, or Temp $> 85^\circ\text{C}$.
  * **WARNING**: Deviation $\ge 25\%$, or Disk $> 90\%$, or Temp $> 80^\circ\text{C}$.
  * **NORMAL**: Within standard deviation baseline.

---

## 2. Directory Structure

```text
ml-engine/
  ├── predictor.py    # Complete standalone ML engine & CLI runner
  ├── README.txt      # Plain-text documentation & runbook
  └── README.md       # Markdown documentation
```

---

## 3. How to Run

### Requirements
* Python 3.9+
* Uses Python Standard Library (`statistics`, `datetime`, `json`, `math`). No `pip install` required.

### Standalone CLI Execution
Run with built-in synthetic telemetry demonstration:
```bash
python ml-engine/predictor.py
```

Run with custom JSON telemetry:
```bash
python ml-engine/predictor.py telemetry.json
```

---

## 4. Python API Usage

```python
from predictor import SHMSPredictor

# Initialize engine with horizon: '30m', '1h', '6h', '24h', '7d'
engine = SHMSPredictor(horizon="6h")

samples = [
    {"time": "2026-09-12T12:00:00Z", "cpu_usage": 45.0, "ram_usage": 52.0, "disk_usage": 60.0, "temperature": 55.0},
    {"time": "2026-09-12T12:05:00Z", "cpu_usage": 48.0, "ram_usage": 53.0, "disk_usage": 60.1, "temperature": 56.0},
]

results = engine.analyze(samples)
print("Health Score   :", results["health_score"])
print("Predicted CPU  :", results["predicted_metrics"]["cpu_usage"], "%")
print("Confidence     :", results["confidence_score"], "%")
print("Anomalies      :", len(results["anomalies"]))
```
