## Baseline Anomaly Scope Analysis

*Anomaly Thresholds

 CPU Usage > 90% = Anomaly
 RAM Usage > 90% = Anomaly
 Disk Usage > 95% = Anomaly
 Network Traffic > 150 MB/s = Anomaly

*Feature Matrix Layout

| CPU Usage | RAM Usage | Disk Usage | Network Traffic | Status |
|------------|------------|------------|------------|------------|
|     25    |    40     |     50     |        10       | Normal |
|     45    |    55     |     60     |        15       | Normal |
|     95    |    92     |     88     |        200      | Anomaly |
|     30    |    35     |     45     |        12       | Normal |
|     98    |    96     |     95     |        250      | Anomaly |

##  Workflow

Server Metrics
↓
Data Collection
↓
Feature Matrix
↓
Anomaly Detection
↓
Alert Generation