
# ðŸš€ Server Health Monitoring System (SHMS)
## Problem Statement 

ï»¿<<<<<<< HEAD
#Server-Health-Monitoring-System

# React + TypeScript + Vite


Monitoring the health of multiple servers in an infrastructure is challenging because CPU, memory, disk, network, and hardware metrics are distributed across different systems. Administrators need a centralized platform to monitor server health, visualize performance, and securely access monitoring dashboards from anywhere.

# ðŸ“Œ Project Overview

**SHMS (Server Health Monitoring System)** simulates a real-world production infrastructure by treating multiple **Windows systems as monitoring servers**. Each Windows machine acts as an individual server and exposes hardware and system metrics for centralized monitoring.

The platform collects **hardware metrics** (CPU temperature, GPU temperature, fan speed, voltage, and power usage) using **LibreHardwareMonitor Exporter** and **system metrics** (CPU usage, RAM, disk, network, uptime, and OS metrics) using **Windows Exporter**. **Prometheus** scrapes metrics from all simulated servers and stores them in a centralized time-series database.

A **React + Vite** frontend displays live server status, health summaries, and analytics with **Chart.js** for real-time graphs, while **Grafana** provides production-style infrastructure dashboards. The backend uses **Flask** and **PostgreSQL** to manage server details and monitoring APIs.

For secure communication between monitoring servers, **Tailscale (Zero-Trust VPN)** creates a private network, and **Cloudflare Tunnel** securely publishes the monitoring dashboard for remote access without exposing the local network. **Docker** and **Docker Compose** containerize the monitoring stack, and **GitHub Actions** automate frontend health checks and Cloudflare URL updates.

# âœ¨ Key Features

* ðŸ“Š Real-time infrastructure monitoring dashboard.
* ðŸ–¥ï¸ Monitor multiple Windows systems simultaneously.
* ðŸŒ¡ï¸ Live CPU, RAM, Disk, Temperature, and Network metrics.
* ðŸ“ˆ Prometheus-based metrics collection.
* ðŸ“‰ Grafana performance dashboards.
* ðŸ—„ï¸ PostgreSQL database integration.
* ðŸ³ Fully Dockerized multi-container deployment.
* â˜ï¸ Public frontend deployment using Cloudflare Tunnel.
* ðŸ¤– GitHub Actions automated frontend health checks.
* ðŸ”„ Automatic Cloudflare URL synchronization with GitHub repository variables.
* ðŸ“‹ Server status and infrastructure overview dashboard.

---

# ðŸ› ï¸ Technology Stack

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

# ðŸ—ï¸ System Architecture

```text
                    User Browser
                         â”‚
                         â–¼
              Cloudflare Tunnel (Public URL)
                         â”‚
                         â–¼
            React Frontend Dashboard (Docker)
                         â”‚
                         â–¼
               Flask Backend REST API
                         â”‚
                         â–¼
                PostgreSQL Database
                         â–²
                         â”‚
                Prometheus Server
                         â–²
                         â”‚
     LibreHardwareMonitor Exporter
                         â–²
                         â”‚
          Windows Systems / Servers
```

---

# ðŸ“‚ Project Structure

```text
Server-Health-Monitoring-System/
â”‚
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ public/
â”‚   â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ pages/
â”‚   â”œâ”€â”€ package.json
â”‚   â””â”€â”€ Dockerfile
â”‚
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ app.py
â”‚   â”œâ”€â”€ routes/
â”‚   â”œâ”€â”€ services/
â”‚   â”œâ”€â”€ models/
â”‚   â”œâ”€â”€ utils/
â”‚   â”œâ”€â”€ requirements.txt
â”‚   â””â”€â”€ Dockerfile
â”‚
â”œâ”€â”€ prometheus/
â”‚   â””â”€â”€ prometheus.yml
â”‚
â”œâ”€â”€ grafana/
â”‚   â”œâ”€â”€ dashboards/
â”‚   â””â”€â”€ provisioning/
â”‚
â”œâ”€â”€ exporter/
â”‚   â””â”€â”€ LibreHardwareMonitor Exporter
â”‚
â”œâ”€â”€ postgres/
â”‚
â”œâ”€â”€ .github/
â”‚   â””â”€â”€ workflows/
â”‚       â””â”€â”€ frontend-health-check.yml
â”‚
â”œâ”€â”€ docker-compose.yml
â”œâ”€â”€ start-shms.ps1
â”œâ”€â”€ nginx.conf
â”œâ”€â”€ README.md
â””â”€â”€ assets/
```

---

# ðŸ“Š Dashboard Overview

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

# ðŸ“ˆ Monitoring Components

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

# ðŸ“Š PromQL Queries Used

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

# ðŸ³ Docker Deployment

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

# âš™ï¸ Local Setup Guide

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

# ðŸŒ Application Access

| Service            | URL                     |
| ------------------ | ----------------------- |
| Frontend Dashboard | `http://localhost:5173` |
| Backend API        | `http://localhost:5000` |
| Prometheus         | `http://localhost:9090` |
| Grafana            | `http://localhost:3001` |

---

# â˜ï¸ Cloud Automation

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

# ðŸ”„ Cloud Automation Workflow

```text
Laptop Starts
      â”‚
      â–¼
Docker Desktop
      â”‚
      â–¼
Docker Containers
      â”‚
      â–¼
Cloudflare Tunnel
      â”‚
      â–¼
Public Dashboard URL
      â”‚
      â”œâ”€â”€ GitHub Secret (FRONTEND_URL)
      â”œâ”€â”€ GitHub Variable (FRONTEND_LINK)
      â””â”€â”€ Desktop Link File
```

---

# ðŸ¤– GitHub Actions Workflow

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

# ðŸ—„ï¸ Backend API Services

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

# ðŸ“Š Infrastructure Metrics

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

# ðŸ“‹ Dashboard Components

The monitoring dashboard is divided into multiple sections for infrastructure visibility.

* Infrastructure Overview
* Resource Utilization
* CPU Heatmap
* Performance Analytics
* Server Health Summary
* Database Health
* Historical Monitoring Views

---

# ðŸ“¸ Project Preview

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

# ðŸ” Repository Automation

## GitHub Repository Secret

| Secret         | Purpose                                         |
| -------------- | ----------------------------------------------- |
| `FRONTEND_URL` | Latest public dashboard URL for GitHub Actions. |

## GitHub Repository Variable

| Variable        | Purpose                                                                         |
| --------------- | ------------------------------------------------------------------------------- |
| `FRONTEND_LINK` | Displays the latest Cloudflare public dashboard URL inside repository settings. |
---

# ðŸš€ Future Enhancements

* Multi-server monitoring support.
* Historical analytics dashboard.
* Infrastructure alert notifications.
* Authentication and user management.
* Permanent Cloudflare Tunnel deployment.
* Kubernetes deployment support.
* Monitoring reports and analytics.
* Infrastructure scalability improvements.

---

# ðŸ“š Learning Outcomes

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

# ðŸ‘¨â€ðŸ’» Author

**Bandhav**

B.Tech â€“ Computer Science & Engineering (Data Science)

**B V Raju Institute of Technology (BVRIT)**

Infrastructure Monitoring â€¢ Cloud Automation â€¢ Backend Development â€¢ Monitoring Systems

---

## â­ If you found this project useful, consider giving it a Star on GitHub.

The first query should return `1`. The second should return process metrics including `windows_process_cpu_time_total`.

> **Live Dashboard:** https://allied-mom-factors-impressive.trycloudflare.com
