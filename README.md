# 🚀 Server Health Monitoring System (SHMS)

### Real-Time Infrastructure Monitoring

A production-style server monitoring platform that collects real-time hardware metrics from multiple systems, visualizes them through interactive dashboards, and continuously monitors infrastructure health using automated health checks and cloud-based public access.

---

## 📌 Project Overview

**Server Health Monitoring System (SHMS)** is a full-stack infrastructure monitoring platform designed to monitor the health and performance of multiple servers and laptops in real time.

The application collects CPU, Memory, Disk, Temperature, and Network metrics from monitored machines using **LibreHardwareMonitor Exporter**, stores and processes data through a backend API, visualizes metrics with **Prometheus** and **Grafana**, and provides a centralized monitoring dashboard built with **React**.

To make the dashboard accessible from anywhere, SHMS uses **Cloudflare Tunnel** for temporary public deployment and **GitHub Actions** for automated frontend health checks.

---

# ✨ Features

* 📊 Real-time server health monitoring dashboard.
* 🖥️ Monitor multiple Windows systems simultaneously.
* 🌡️ Live CPU, RAM, Disk, Temperature and Network metrics.
* 📈 Prometheus metrics collection.
* 📉 Grafana visualization dashboards.
* 🗄️ PostgreSQL database integration.
* 🌐 Public frontend deployment using Cloudflare Tunnel.
* 🤖 Automated frontend health checks using GitHub Actions.
* 🔐 Automatic Cloudflare URL synchronization with GitHub Secrets and Variables.
* 🐳 Dockerized application deployment.

---

# 🛠️ Technology Stack

| Category          | Technology                    |
| ----------------- | ----------------------------- |
| Frontend          | React + Vite                  |
| Backend           | Flask (Python)                |
| Database          | PostgreSQL                    |
| Monitoring        | Prometheus                    |
| Visualization     | Grafana                       |
| Hardware Metrics  | LibreHardwareMonitor Exporter |
| Containerization  | Docker & Docker Compose       |
| Public Deployment | Cloudflare Tunnel             |
| Automation        | GitHub Actions                |
| Version Control   | Git & GitHub                  |

---

# 🏗️ System Architecture

<AsyncImageGroup query={["server monitoring architecture diagram react flask prometheus grafana postgres cloudflare docker","prometheus grafana architecture diagram","docker containers monitoring architecture"]} layout=bento/>

## Architecture Flow

```text
User Browser
        │
        ▼
Cloudflare Tunnel (Public URL)
        │
        ▼
React Frontend (Docker Container :5173)
        │
        ▼
Flask Backend API (Docker Container :5000)
        │
        ▼
PostgreSQL Database
        ▲
        │
Prometheus
        ▲
        │
LibreHardwareMonitor Exporter (Windows Metrics)
```

---

# 📂 Project Structure

```text
Server-Health-Monitoring-System
│
├── frontend/                      # React Dashboard
│   ├── src/
│   ├── public/
│   └── Dockerfile
│
├── backend/                       # Flask REST API
│   ├── app.py
│   ├── routes/
│   ├── services/
│   ├── models/
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
└── README.md
```

---

# 📊 Dashboard Preview

## SHMS Dashboard

<AsyncImageGroup query={["modern server monitoring dashboard dark theme CPU RAM disk network cards","React monitoring dashboard with server metrics","system monitoring dashboard UI"]} layout=bento/>

The dashboard displays:

* CPU Usage
* RAM Usage
* Disk Usage
* Temperature
* Network Usage
* Server Online / Offline Status
* Backend & Database Health

---

# 📈 Grafana Dashboard

<AsyncImageGroup query={["Grafana server monitoring dashboard CPU RAM Disk Temperature","Grafana Prometheus dashboard windows exporter","Grafana infrastructure monitoring dashboard"]} layout=bento/>

Visualizations include:

* CPU Utilization
* Memory Utilization
* Disk Utilization
* Temperature
* Network Throughput
* Server Health Timeline

---

# 📡 Prometheus Monitoring

<AsyncImageGroup query={["Prometheus targets page","Prometheus graph UI","Prometheus metrics browser"]} layout=bento/>

Prometheus scrapes metrics from LibreHardwareMonitor Exporter.

## Example Prometheus Configuration

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

# 📊 Useful PromQL Queries

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

## Temperature

```promql
lhm_temperature_celsius
```

## Network Speed

```promql
rate(windows_net_bytes_total[1m])
```

---

# 🐳 Docker Containers

<AsyncImageGroup query={["Docker Desktop containers list","docker compose containers monitoring stack"]} layout=bento/>

| Container    | Port     | Purpose                   |
| ------------ | -------- | ------------------------- |
| Frontend     | **5173** | React Dashboard           |
| Backend      | **5000** | Flask API                 |
| PostgreSQL   | **5432** | Database                  |
| Prometheus   | **9090** | Metrics Collector         |
| Grafana      | **3001** | Monitoring Dashboard      |
| LHM Exporter | **9105** | Hardware Metrics Exporter |

---

# ⚙️ Local Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/bandhav100/Server-Health-Monitoring-System.git

cd Server-Health-Monitoring-System
```

## 2️⃣ Start Docker Containers

```bash
docker compose up -d
```

## 3️⃣ Verify Running Containers

```bash
docker ps
```

Expected Containers:

```text
shms-frontend
shms-backend
shms-postgres
shms-prometheus
shms-grafana
shms-lhm-exporter
```

---

# 🌐 Access the Application

| Service     | URL                     |
| ----------- | ----------------------- |
| Frontend    | `http://localhost:5173` |
| Backend API | `http://localhost:5000` |
| Prometheus  | `http://localhost:9090` |
| Grafana     | `http://localhost:3001` |

---

# 🌍 Public Deployment using Cloudflare Tunnel

<AsyncImageGroup query={["Cloudflare Tunnel dashboard","Cloudflare Tunnel architecture diagram"]} layout=bento/>

SHMS frontend is publicly accessible using **Cloudflare Quick Tunnel**.

## Start Tunnel

```powershell
cloudflared tunnel --url http://localhost:5173
```

Example Output

```text
https://example.trycloudflare.com
```

> Every Quick Tunnel generates a temporary public URL.

---

# ⚡ Automatic Cloudflare URL Update

SHMS includes an automation script called:

```text
start-shms.ps1
```

This script automatically:

* Stops previous Cloudflare Tunnel.
* Waits for Docker Desktop.
* Starts Docker containers.
* Starts a new Cloudflare Tunnel.
* Reads the generated URL.
* Updates GitHub Secret.
* Updates GitHub Variable.
* Saves the latest URL to Desktop.

## Run Script

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\bandh\start-shms.ps1"
```

### Example Output

```text
New Frontend URL:
https://example.trycloudflare.com

Updating GitHub Secret...
Updating GitHub Variable...

GitHub Updated Successfully!
```

---

# 🔐 GitHub Secrets & Variables

## Repository Secret

| Secret         | Purpose                                             |
| -------------- | --------------------------------------------------- |
| `FRONTEND_URL` | Used by GitHub Actions for automated health checks. |

## Repository Variable

| Variable        | Purpose                                                                        |
| --------------- | ------------------------------------------------------------------------------ |
| `FRONTEND_LINK` | Stores the latest public Cloudflare URL visible in GitHub Repository Settings. |

---

# 🤖 GitHub Actions Automation

<AsyncImageGroup query={["GitHub Actions workflow success green check","GitHub Actions workflow run page"]} layout=bento/>

## Workflow

`SHMS Frontend Health Check`

### Workflow Features

* Runs every **10 minutes**.
* Checks frontend availability.
* Uses latest `FRONTEND_URL` secret.
* Reports success/failure in GitHub Actions.

### Workflow Configuration

```yaml
name: SHMS Frontend Health Check

on:
  schedule:
    - cron: "*/10 * * * *"

jobs:
  health-check:
    runs-on: ubuntu-latest

    steps:
      - name: Check Frontend URL
        run: |
          STATUS=$(curl -L -s -o /dev/null -w "%{http_code}" "${{ secrets.FRONTEND_URL }}")

          echo "Status: $STATUS"

          if [ "$STATUS" = "200" ]; then
            echo "Frontend is UP"
          else
            exit 1
          fi
```

---

# 🗄️ Backend API

The backend exposes REST APIs for monitoring and dashboard updates.

## API Endpoints

| Endpoint               | Method | Description             |
| ---------------------- | ------ | ----------------------- |
| `/api/dashboard/live`  | GET    | Live server metrics     |
| `/api/server/list`     | GET    | List monitored servers  |
| `/api/server/status`   | GET    | Online / Offline status |
| `/api/server/history`  | GET    | Historical metrics      |
| `/api/database/status` | GET    | PostgreSQL health       |

---

# 📊 Metrics Collected

| Category    | Metrics                      |
| ----------- | ---------------------------- |
| CPU         | Usage %, Frequency           |
| Memory      | Used, Available, Utilization |
| Disk        | Total, Used, Free            |
| Temperature | CPU Temperature              |
| Network     | Upload / Download Speed      |
| Database    | PostgreSQL Status            |
| Backend     | API Health                   |
| Server      | Online / Offline             |

---

# 💾 PostgreSQL Integration

<AsyncImageGroup query={["PostgreSQL logo database dashboard","PostgreSQL monitoring dashboard"]} layout=bento/>

The backend stores monitoring information and server metadata using PostgreSQL.

### Database Container

```text
postgres:15-alpine
```

### Port

```text
5432
```

---

# 🖥️ LibreHardwareMonitor Exporter

<AsyncImageGroup query={["LibreHardwareMonitor application sensors","LibreHardwareMonitor exporter metrics"]} layout=bento/>

Windows hardware metrics are exported through LibreHardwareMonitor Exporter.

Collected metrics include:

* CPU Usage
* CPU Temperature
* RAM Usage
* Disk Usage
* Fan Speed
* Network Statistics

Prometheus scrapes exporter metrics on port **9105**.

---

# 📸 Project Screenshots

## SHMS Dashboard

<AsyncImage query="modern server monitoring dashboard web application" aspectRatio="16:9"/>

---

## Prometheus Targets

<AsyncImage query="Prometheus targets page all targets up" aspectRatio="16:9"/>

---

## Grafana Dashboard

<AsyncImage query="Grafana infrastructure dashboard CPU RAM Disk Temperature" aspectRatio="16:9"/>

---

## GitHub Actions Health Check

<AsyncImage query="GitHub Actions workflow success page green check" aspectRatio="16:9"/>

---

# 🚨 Troubleshooting Guide

## 502 Bad Gateway

**Cause**

Cloudflare Tunnel is connected but frontend is unavailable.

**Solution**

```powershell
docker restart shms-frontend
```

Run Cloudflare script again.

---

## Error 1033

**Cause**

Quick Tunnel expired or disconnected.

**Solution**

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\bandh\start-shms.ps1"
```

A new public URL is generated automatically.

---

## Docker Not Running

Check:

```powershell
docker ps
```

Start Docker Desktop if containers are unavailable.

---

## Cloudflare URL Not Updating

Run:

```powershell
gh variable list --repo bandhav100/Server-Health-Monitoring-System
```

Verify:

* `FRONTEND_LINK`
* `FRONTEND_URL`

---

# 🔄 Automation Workflow

<AsyncImageGroup query={["CI CD automation workflow diagram GitHub Actions Docker Cloudflare","automation pipeline diagram monitoring platform"]} layout=bento/>

```text
Laptop Starts
      │
      ▼
Docker Desktop Starts
      │
      ▼
start-shms.ps1
      │
      ├── Starts Docker Containers
      ├── Starts Cloudflare Tunnel
      ├── Reads Public URL
      ├── Updates GitHub Secret
      ├── Updates GitHub Variable
      └── Saves URL to Desktop
      │
      ▼
GitHub Actions
      │
      ▼
Frontend Health Check (Every 10 Minutes)
```

---

# 👥 Team

| Member          | Responsibility                         |
| --------------- | -------------------------------------- |
| **Bandhav**     | Infrastructure Automation & Monitoring |
| Vinay Charan    | Product Owner & Scrum Master           |
| Sai Abhiram     | Lead Developer                         |
| Navadeep        | Backend Development                    |
| Manjunath       | Machine Learning Integration           |
| Nihal           | Testing & Quality Assurance            |
| Abhiram Krishna | Dashboard UI Development               |
| Prem Kumar      | Release Coordination & Deployment      |

---

# 🎯 Future Enhancements

* Permanent Cloudflare Tunnel.
* Email Notifications.
* Telegram Alerts.
* Slack Integration.
* Authentication & Authorization.
* Historical Analytics.
* Multi-server Monitoring.
* Kubernetes Deployment.
* Custom Domain Support.
* SSL Monitoring.

---

# 📚 Learning Outcomes

This project demonstrates practical implementation of:

* Infrastructure Monitoring
* Monitoring & Visualization
* Containerized Deployment
* CI/CD Automation
* Cloud-Based Public Deployment
* API Development
* Database Integration
* Multi-Service Application Deployment

---

# 👨‍💻 Author

## Bandhav

**B.Tech Computer Science & Engineering (Data Science)**

**B V Raju Institute of Technology (BVRIT)**

Infrastructure Monitoring • Cloud Automation • Backend Development • Monitoring Systems

---

## ⭐ If you found this project useful, consider giving it a Star on GitHub!
