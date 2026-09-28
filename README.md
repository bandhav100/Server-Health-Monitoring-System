# ðŸš€ Server Health Monitoring System (SHMS)

<div align="center">

  <img src="frontend/public/logo.png" alt="SHMS Logo" width="180"/>

  # ðŸš€ Server Health Monitoring System (SHMS)

  ### Production-Ready Infrastructure Monitoring Platform

  **Real-Time Monitoring â€¢ Predictive Analytics â€¢ CI/CD Automation â€¢ Observability**

  <br/>

  #### âš›ï¸ Application Stack

  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white"/>

  <br/><br/>

  #### ðŸ“Š Monitoring & Observability

  <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white"/>
  <img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white"/>
  <img src="https://img.shields.io/badge/Windows_Exporter-0078D4?style=for-the-badge&logo=windows&logoColor=white"/>
  <img src="https://img.shields.io/badge/LibreHardwareMonitor-FF6A00?style=for-the-badge&logo=github&logoColor=white"/>

  <br/><br/>

  #### âš™ï¸ DevOps & Deployment

  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white"/>
  <img src="https://img.shields.io/badge/Tailscale-242424?style=for-the-badge&logo=tailscale&logoColor=white"/>
  <img src="https://img.shields.io/badge/Cloudflare_Tunnel-F38020?style=for-the-badge&logo=cloudflare&logoColor=white"/>

</div>

---

---

# ðŸ“– Overview

**Server Health Monitoring System (SHMS)** is a full-stack DevOps monitoring platform built to monitor multiple Windows machines in real time and provide centralized infrastructure observability.

SHMS treats Windows systems as monitored servers by collecting hardware and operating system metrics using **Windows Exporter** and **LibreHardwareMonitor Exporter**. Metrics are securely collected through a **Tailscale private network**, scraped by **Prometheus**, stored in **PostgreSQL**, visualized through **React** and **Grafana**, and analyzed using a **FastAPI Machine Learning Engine**.

The complete deployment pipeline is automated using **Docker**, **Jenkins**, **GitHub**, and **Cloudflare Tunnel**.

---

# âœ¨ Features

### ðŸ“Š Real-Time Monitoring

* CPU Usage Monitoring
* Memory (RAM) Monitoring
* Disk Usage Monitoring
* Network Traffic Monitoring
* Temperature Monitoring
* System Uptime Monitoring

### ðŸ–¥ï¸ Server Management

* Monitor multiple Windows machines as servers.
* Online / Offline server detection.
* Live server status dashboard.
* Hardware resource monitoring.

### ðŸš¨ Alerts & Analytics

* Server health alerts.
* High CPU / Memory / Disk alerts.
* Historical performance analytics.
* Resource utilization reports.
* Performance trends dashboard.

### ðŸ¤– Machine Learning Predictions

* Predict server health.
* Healthy / Warning / Critical classification.
* Prediction dashboard with live metrics.

### âš™ï¸ DevOps Automation

* Docker Compose deployment.
* Jenkins CI/CD pipeline.
* Cloudflare Tunnel automation.
* Automated GitHub deployment updates.

---

# ðŸ› ï¸ Tech Stack

| Category                 | Technology                                      |
| ------------------------ | ----------------------------------------------- |
| ðŸŽ¨ **Frontend**          | React, Vite, Tailwind CSS, Recharts             |
| âš¡ **Backend API**        | Flask (Python REST API)                         |
| ðŸ¤– **Machine Learning**  | FastAPI (Python)                                |
| ðŸ—„ï¸ **Database**         | PostgreSQL                                      |
| ðŸ“Š **Monitoring**        | Prometheus                                      |
| ðŸ“ˆ **Visualization**     | Grafana                                         |
| ðŸ–¥ï¸ **Hardware Metrics** | Windows Exporter, LibreHardwareMonitor Exporter |
| ðŸ”’ **Secure Networking** | Tailscale                                       |
| ðŸ³ **Containerization**  | Docker, Docker Compose                          |
| âš™ï¸ **CI/CD**             | Jenkins                                         |
| ðŸŒ **Deployment**        | Cloudflare Tunnel                               |
| ðŸ”§ **Version Control**   | Git & GitHub                                    |

---
---

# ðŸ—ï¸ System Architecture

```text
                    Windows Machines
                           â”‚
      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
      â”‚                                         â”‚
 Windows Exporter                  LibreHardwareMonitor Exporter
      â”‚                                         â”‚
      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                           â”‚
                           â–¼
                 Tailscale Private Network
                           â”‚
                           â–¼
                    Prometheus Server
                           â”‚
             â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
             â–¼                           â–¼
      Grafana Dashboard             Flask Backend
                                            â”‚
                                            â–¼
                                    PostgreSQL Database
                                            â”‚
                                            â–¼
                                      React Dashboard
                                            â”‚
                                            â–¼
                               FastAPI ML Prediction Engine
                                            â”‚
                                            â–¼
                         Jenkins â€¢ Docker â€¢ Cloudflare Tunnel
```

---

# ðŸ”„ Project Workflow

```text
Windows Systems
      â”‚
      â–¼
Windows Exporter + LibreHardwareMonitor
      â”‚
      â–¼
Tailscale Secure Network
      â”‚
      â–¼
Prometheus Scrapes Metrics
      â”‚
      â–¼
Flask Backend API
      â”‚
      â–¼
PostgreSQL Database
      â”‚
      â–¼
React Dashboard
      â”‚
      â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º Grafana Dashboards
      â”‚
      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º FastAPI ML Predictions
                         â”‚
                         â–¼
                 Health Prediction Results
```

---

# ðŸ“‚ Project Structure

```text
Server-Health-Monitoring-System/
â”‚
â”œâ”€â”€ .github/                  # GitHub Actions & Workflows
â”œâ”€â”€ backend/                  # Flask Backend API
â”œâ”€â”€ frontend/                 # React + Vite Dashboard
â”œâ”€â”€ grafana/                  # Grafana Dashboards
â”œâ”€â”€ prometheus/               # Prometheus Configuration
â”œâ”€â”€ lhm-exporter/             # LibreHardwareMonitor Exporter
â”œâ”€â”€ ml-engine/                # FastAPI ML Prediction Engine
â”œâ”€â”€ jenkins/                  # Jenkins CI/CD Pipeline
â”œâ”€â”€ scripts/                  # Deployment Automation Scripts
â”‚
â”œâ”€â”€ docker-compose.yml
â”œâ”€â”€ README.md
â””â”€â”€ .gitignore
```

---

# ðŸ“Š Monitoring Stack

## Prometheus

Prometheus continuously scrapes infrastructure metrics from Windows systems connected through Tailscale.

**Collected Metrics**

* CPU Usage
* RAM Usage
* Disk Utilization
* Network Throughput
* System Uptime
* Hardware Temperature
* Fan Speed
* Server Availability

### Exporters Used

* Windows Exporter
* LibreHardwareMonitor Exporter

---

## Grafana

Grafana provides centralized visualization for infrastructure health.

### Available Dashboards

* CPU Monitoring Dashboard
* Memory Monitoring Dashboard
* Disk Usage Dashboard
* Network Monitoring Dashboard
* Temperature Dashboard
* Historical Performance Dashboard
* Server Availability Dashboard

---

## ðŸ”’ Tailscale Secure Networking

SHMS uses **Tailscale** to securely connect multiple Windows systems through a private mesh VPN network.

### Why Tailscale?

* Secure communication between monitored machines.
* No public IP exposure.
* Prometheus scrapes metrics using private Tailscale IP addresses.
* Simplifies monitoring across multiple Windows devices.

### Tailscale Workflow

```text
Windows Machine A
        â”‚
Windows Machine B
        â”‚
Windows Machine C
        â”‚
   Tailscale Mesh Network
        â”‚
        â–¼
 Prometheus Server
        â”‚
        â–¼
 Flask Backend â†’ PostgreSQL
        â”‚
        â–¼
 React Dashboard + Grafana
```

---

# ðŸ–¥ï¸ Dashboard Modules

| Module                 | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| ðŸŸ¢ **Live Monitoring** | Real-time CPU, RAM, Disk, Network, Temperature & Uptime metrics. |
| ðŸ–¥ï¸ **Servers**        | Connected Windows server status and availability.                |
| ðŸš¨ **Alerts**          | Health alerts and monitoring notifications.                      |
| ðŸ“ˆ **Analytics**       | Resource utilization and historical trends.                      |
| ðŸ¤– **Predictions**     | Machine learning prediction dashboard.                           |
| ðŸ“„ **Reports**         | Historical monitoring reports.                                   |
| ðŸ³ **Docker**          | Docker container monitoring and status.                          |
| ðŸ“Š **Grafana**         | Embedded Grafana dashboards.                                     |
| ðŸ“œ **Logs**            | Monitoring logs and events.                                      |
| âš™ï¸ **Settings**        | Dashboard configuration.                                         |

---

# ðŸ³ Docker Deployment

The complete monitoring platform runs using **Docker Compose**.

## Running Services

| Service           | Port     |
| ----------------- | -------- |
| React Frontend    | **5173** |
| Flask Backend     | **8081** |
| FastAPI ML Engine | **8000** |
| Grafana Dashboard | **3000** |
| Prometheus Server | **9090** |

### Start Monitoring Stack

```bash
docker compose up -d
```

### Stop Monitoring Stack

```bash
docker compose down
```

### View Running Containers

```bash
docker ps
```

---

# âš™ï¸ Jenkins CI/CD Pipeline

Jenkins automates the build and deployment process for SHMS.

## CI/CD Workflow

```text
GitHub Repository
        â”‚
        â–¼
   Jenkins Pipeline
        â”‚
        â–¼
 Checkout Source Code
        â”‚
        â–¼
 Install Dependencies
        â”‚
        â–¼
 Build React Frontend
        â”‚
        â–¼
 Build Flask Backend
        â”‚
        â–¼
 Build Docker Images
        â”‚
        â–¼
 Docker Compose Deployment
        â”‚
        â–¼
 Health Check Verification
        â”‚
        â–¼
 Cloudflare Tunnel Deployment
        â”‚
        â–¼
 Live SHMS Dashboard
```

### Pipeline Stages

1. Repository Checkout
2. Dependency Installation
3. Frontend Build
4. Backend Build
5. Docker Image Build
6. Container Deployment
7. Service Verification
8. Live Deployment

---

# ðŸ¤– Machine Learning Prediction Engine

The FastAPI ML Engine predicts server health using live monitoring metrics.

## Prediction API

```http
POST /predict/dashboard
```

### Input Metrics

* CPU Usage
* Memory Usage
* Disk Usage
* Temperature
* Network Activity
* System Uptime

### Prediction Results

| Status      | Description                   |
| ----------- | ----------------------------- |
| ðŸŸ¢ Healthy  | Server operating normally.    |
| ðŸŸ¡ Warning  | Resource usage increasing.    |
| ðŸ”´ Critical | Immediate attention required. |

---

# ðŸŒ Cloudflare Tunnel Deployment

Cloudflare Tunnel securely exposes the SHMS dashboard without opening public ports.

## Deployment Workflow

```text
Start Docker Containers
        â”‚
        â–¼
Restart Cloudflare Tunnel
        â”‚
        â–¼
Generate Public URL
        â”‚
        â–¼
Update GitHub Repository Website
        â”‚
        â–¼
Update GitHub Secrets & Variables
        â”‚
        â–¼
Create Deployment Commit
        â”‚
        â–¼
Push Changes to GitHub
```

### Run Deployment Script

```powershell
powershell -ExecutionPolicy Bypass -File .\start-shms.ps1
```

---

# ðŸš€ Quick Start

## Clone Repository

```bash
git clone https://github.com/bandhav100/Server-Health-Monitoring-System.git

cd Server-Health-Monitoring-System
```

## Backend Setup

```bash
cd backend

pip install -r requirements.txt

python app.py
```

**Backend:** `http://localhost:8081`

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

**Frontend:** `http://localhost:5173`

---

## ML Engine Setup

```bash
cd ml-engine

pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

**ML Engine:** `http://localhost:8000`

---

## Start Complete Monitoring Stack

```bash
docker compose up -d
```

---

# ðŸ“Œ Project Highlights

* ðŸ“Š Real-time Windows infrastructure monitoring.
* ðŸ–¥ï¸ Windows Exporter and LibreHardwareMonitor integration.
* ðŸ”’ Secure monitoring through Tailscale private networking.
* ðŸ“ˆ Prometheus metrics collection and Grafana dashboards.
* âš¡ Flask REST API with PostgreSQL backend.
* ðŸ¤– FastAPI Machine Learning prediction engine.
* ðŸ³ Fully Dockerized monitoring platform.
* âš™ï¸ Jenkins CI/CD automated deployment pipeline.
* ðŸŒ Cloudflare Tunnel automated public deployment.

---

> **Live Dashboard:** https://stickers-charitable-hints-stat.trycloudflare.com
