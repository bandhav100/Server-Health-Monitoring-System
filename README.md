# 🚀 Server Health Monitoring System (SHMS)
> **Status:** Public Cloudflare Tunnel (Automatically Updated)
### Real-Time Infrastructure Monitoring & Cloud Automation Platform
A production-style infrastructure monitoring platform that collects real-time hardware metrics from multiple systems, visualizes them through interactive dashboards, automates health monitoring workflows, and securely publishes the monitoring dashboard using Cloudflare Tunnel.
---

# 📌 Project Overview

**Server Health Monitoring System (SHMS)** is a centralized infrastructure monitoring platform built to monitor the health, availability, and performance of multiple Windows systems and servers in real time.

The platform continuously collects hardware metrics such as CPU usage, Memory utilization, Disk usage, Temperature, and Network activity using **LibreHardwareMonitor Exporter**. These metrics are collected by **Prometheus**, visualized using **Grafana**, and displayed through a modern **React Dashboard** powered by a **Flask Backend** and **PostgreSQL** database.

The project also includes an automated cloud workflow that generates a public dashboard URL using **Cloudflare Tunnel** and synchronizes it with GitHub repository secrets and variables.

---

# ✨ Key Features

* 📊 Real-time infrastructure monitoring dashboard.
* 🖥️ Monitor multiple Windows systems simultaneously.
* 🌡️ Live CPU, RAM, Disk, Temperature, and Network metrics.
* 📈 Prometheus-based metrics collection.
* 📉 Grafana performance dashboards.
* 🗄️ PostgreSQL database integration.
* 🐳 Fully Dockerized multi-container deployment.
* ☁️ Public frontend deployment using Cloudflare Tunnel.
* 🤖 GitHub Actions automated frontend health checks.
* 🔄 Automatic Cloudflare URL synchronization with GitHub repository variables.
* 📋 Server status and infrastructure overview dashboard.

---

# 🛠️ Technology Stack

| Layer                   | Technology                    |
| ----------------------- | ----------------------------- |
| **Frontend**            | React + Vite                  |
| **Backend**             | Flask (Python)                |
| **Database**            | PostgreSQL                    |
| **Monitoring**          | Prometheus                    |
| **Visualization**       | Grafana                       |
| **Metrics Exporter**    | LibreHardwareMonitor Exporter & windows exporter |
| **Secure Networking (VPN)**| TailScale                  |
| **Containerization**    | Docker & Docker Compose       |
| **Cloud Automation**    | Cloudflare Tunnel             |
| **Workflow Automation** | GitHub Actions                |
| **Version Control**     | Git & GitHub                  |

---

# 🏗️ System Architecture

```text
                    User Browser
                         │
                         ▼
              Cloudflare Tunnel (Public URL)
                         │
                         ▼
            React Frontend Dashboard (Docker)
                         │
                         ▼
               Flask Backend REST API
                         │
                         ▼
                PostgreSQL Database
                         ▲
                         │
                Prometheus Server
                         ▲
                         │
     LibreHardwareMonitor Exporter
                         ▲
                         │
          Windows Systems / Servers
```

---

# 📂 Project Structure

```text
Server-Health-Monitoring-System/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── components/
│   ├── pages/
│   ├── package.json
│   └── Dockerfile
│
├── backend/
│   ├── app.py
│   ├── routes/
│   ├── services/
│   ├── models/
│   ├── utils/
│   ├── requirements.txt
│   └── Dockerfile
│
├── prometheus/
│   └── prometheus.yml
│
├── grafana/
│   ├── dashboards/
│   └── provisioning/
│
├── exporter/
│   └── LibreHardwareMonitor Exporter
│
├── postgres/
│
├── .github/
│   └── workflows/
│       └── frontend-health-check.yml
│
├── docker-compose.yml
├── start-shms.ps1
├── nginx.conf
├── README.md
└── assets/
```

---

# 📊 Dashboard Overview

The SHMS dashboard provides a centralized view of infrastructure health.

### Dashboard Modules

* Infrastructure Health Overview
* CPU Load Heatmap
* CPU Utilization
* Memory Usage
* Disk Utilization
* Temperature Monitoring
* Network Activity
* Server Status
* Database Health
* Historical Metrics

---

# 📈 Monitoring Components

## Prometheus

Prometheus continuously scrapes metrics from LibreHardwareMonitor Exporter running on monitored Windows systems.

### Collected Metrics

* CPU Usage
* CPU Frequency
* CPU Temperature
* Memory Utilization
* Disk Usage
* Network Upload / Download
* System Availability

### Prometheus Configuration

```yaml
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: "lhm-exporter"
    static_configs:
      - targets:
          - localhost:9105
```

---

## Grafana

Grafana visualizes metrics collected by Prometheus through interactive dashboards.

### Dashboard Panels

* CPU Performance
* RAM Utilization
* Disk Capacity
* Temperature Monitoring
* Network Throughput
* Infrastructure Health Timeline

---

# 📊 PromQL Queries Used

## CPU Usage

```promql
100 - (avg by(instance)(rate(windows_cpu_time_total{mode="idle"}[2m])) * 100)
```

## Memory Usage

```promql
100 * (
1 - windows_os_physical_memory_free_bytes /
windows_cs_physical_memory_bytes
)
```

## Disk Usage

```promql
100 * (
windows_logical_disk_size_bytes{volume="C:"}
-
windows_logical_disk_free_bytes{volume="C:"}
)
/ windows_logical_disk_size_bytes{volume="C:"}
```

## CPU Temperature

```promql
lhm_temperature_celsius
```

## Network Throughput

```promql
rate(windows_net_bytes_total[1m])
```

---

# 🐳 Docker Deployment

The complete monitoring stack is deployed using Docker Compose.

## Containers

| Container           | Port     | Purpose                   |
| ------------------- | -------- | ------------------------- |
| `shms-frontend`     | **5173** | React Dashboard           |
| `shms-backend`      | **5000** | Flask Backend API         |
| `shms-postgres`     | **5432** | PostgreSQL Database       |
| `shms-prometheus`   | **9090** | Metrics Collector         |
| `shms-grafana`      | **3001** | Monitoring Dashboard      |
| `shms-lhm-exporter` | **9105** | Hardware Metrics Exporter |

---

# ⚙️ Local Setup Guide

## 1. Clone Repository

```bash
git clone https://github.com/bandhav100/Server-Health-Monitoring-System.git

cd Server-Health-Monitoring-System
```

## 2. Start Docker Services

```bash
docker compose up -d
```

## 3. Verify Containers

```bash
docker ps
```

Expected running containers:

```text
shms-frontend
shms-backend
shms-postgres
shms-prometheus
shms-grafana
shms-lhm-exporter
```

---

# 🌐 Application Access

| Service            | URL                     |
| ------------------ | ----------------------- |
| Frontend Dashboard | `http://localhost:5173` |
| Backend API        | `http://localhost:5000` |
| Prometheus         | `http://localhost:9090` |
| Grafana            | `http://localhost:3001` |

---

# ☁️ Cloud Automation

SHMS uses **Cloudflare Tunnel** to securely publish the frontend dashboard without exposing local ports.

## Automated Cloud Workflow

The `start-shms.ps1` automation script performs the following tasks:

* Starts Docker containers.
* Launches a new Cloudflare Tunnel.
* Generates a public dashboard URL.
* Updates GitHub Repository Secret (`FRONTEND_URL`).
* Updates GitHub Repository Variable (`FRONTEND_LINK`).
* Saves the latest public dashboard URL to the desktop.

### Run Automation Script

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\bandh\start-shms.ps1"
```

### Automation Output

```text
Starting Docker Containers...
Starting Cloudflare Tunnel...

New Frontend URL:
https://example.trycloudflare.com

Updating GitHub Secret...
Updating GitHub Variable...

GitHub Updated Successfully!
```

---

# 🔄 Cloud Automation Workflow

```text
Laptop Starts
      │
      ▼
Docker Desktop
      │
      ▼
Docker Containers
      │
      ▼
Cloudflare Tunnel
      │
      ▼
Public Dashboard URL
      │
      ├── GitHub Secret (FRONTEND_URL)
      ├── GitHub Variable (FRONTEND_LINK)
      └── Desktop Link File
```

---

# 🤖 GitHub Actions Workflow

SHMS includes a scheduled GitHub Actions workflow to monitor frontend availability.

### Workflow Name

```text
SHMS Frontend Health Check
```

### Workflow Schedule

Runs automatically every **10 minutes**.

### Workflow Features

* Scheduled frontend availability check.
* Uses latest `FRONTEND_URL` secret.
* Maintains workflow execution history.
* Provides deployment health monitoring.

Workflow location:

```text
.github/workflows/frontend-health-check.yml
```

---

# 🗄️ Backend API Services

The backend exposes REST APIs for monitoring and dashboard updates.

## API Endpoints

| Endpoint               | Method | Description                   |
| ---------------------- | ------ | ----------------------------- |
| `/api/dashboard/live`  | GET    | Live monitoring metrics       |
| `/api/server/list`     | GET    | List monitored servers        |
| `/api/server/status`   | GET    | Current server availability   |
| `/api/server/history`  | GET    | Historical monitoring metrics |
| `/api/database/status` | GET    | Database connectivity status  |

---

# 📊 Infrastructure Metrics

| Category       | Metrics                     |
| -------------- | --------------------------- |
| CPU            | Usage Percentage, Frequency |
| Memory         | Used, Free, Utilization     |
| Disk           | Total, Used, Free Space     |
| Temperature    | CPU Temperature             |
| Network        | Upload & Download Activity  |
| Database       | PostgreSQL Connectivity     |
| Infrastructure | Server Availability         |

---

# 📋 Dashboard Components

The monitoring dashboard is divided into multiple sections for infrastructure visibility.

* Infrastructure Overview
* Resource Utilization
* CPU Heatmap
* Performance Analytics
* Server Health Summary
* Database Health
* Historical Monitoring Views

---

# 📸 Project Preview

### SHMS Dashboard

> Add the main monitoring dashboard screenshot here.

### CPU Load Heatmap

> Add CPU Load Heatmap screenshot here.

### Grafana Dashboard

> Add Grafana dashboard screenshot here.

### Prometheus Targets

> Add Prometheus targets screenshot here.

### Docker Containers

> Add Docker Desktop containers screenshot here.

### GitHub Actions Workflow

> Add GitHub Actions success workflow screenshot here.

---

# 🔐 Repository Automation

## GitHub Repository Secret

| Secret         | Purpose                                         |
| -------------- | ----------------------------------------------- |
| `FRONTEND_URL` | Latest public dashboard URL for GitHub Actions. |

## GitHub Repository Variable

| Variable        | Purpose                                                                         |
| --------------- | ------------------------------------------------------------------------------- |
| `FRONTEND_LINK` | Displays the latest Cloudflare public dashboard URL inside repository settings. |
---

# 🚀 Future Enhancements

* Multi-server monitoring support.
* Historical analytics dashboard.
* Infrastructure alert notifications.
* Authentication and user management.
* Permanent Cloudflare Tunnel deployment.
* Kubernetes deployment support.
* Monitoring reports and analytics.
* Infrastructure scalability improvements.

---

# 📚 Learning Outcomes

This project demonstrates practical implementation of:

* Infrastructure Monitoring
* Cloud Automation
* Monitoring & Visualization
* Containerized Application Deployment
* Backend API Development
* Database Integration
* Workflow Automation
* Multi-Service Application Architecture

---

# 👨‍💻 Author

**Bandhav**

B.Tech – Computer Science & Engineering (Data Science)

**B V Raju Institute of Technology (BVRIT)**

Infrastructure Monitoring • Cloud Automation • Backend Development • Monitoring Systems

---

## ⭐ If you found this project useful, consider giving it a Star on GitHub.
