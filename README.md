# 🚀 Server Health Monitoring System (SHMS)

<div align="center">

  <img src="frontend/public/logo.png" alt="SHMS Logo" width="180"/>

  # 🚀 Server Health Monitoring System (SHMS)

  ### Production-Ready Infrastructure Monitoring Platform

  **Real-Time Monitoring • Predictive Analytics • CI/CD Automation • Observability**

  <br/>

  #### ⚛️ Application Stack

  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white"/>

  <br/><br/>

  #### 📊 Monitoring & Observability

  <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white"/>
  <img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white"/>
  <img src="https://img.shields.io/badge/Windows_Exporter-0078D4?style=for-the-badge&logo=windows&logoColor=white"/>
  <img src="https://img.shields.io/badge/LibreHardwareMonitor-FF6A00?style=for-the-badge&logo=github&logoColor=white"/>

  <br/><br/>

  #### ⚙️ DevOps & Deployment

  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white"/>
  <img src="https://img.shields.io/badge/Tailscale-242424?style=for-the-badge&logo=tailscale&logoColor=white"/>
  <img src="https://img.shields.io/badge/Cloudflare_Tunnel-F38020?style=for-the-badge&logo=cloudflare&logoColor=white"/>

</div>

---

---

# 📖 Overview

**Server Health Monitoring System (SHMS)** is a full-stack DevOps monitoring platform built to monitor multiple Windows machines in real time and provide centralized infrastructure observability.

SHMS treats Windows systems as monitored servers by collecting hardware and operating system metrics using **Windows Exporter** and **LibreHardwareMonitor Exporter**. Metrics are securely collected through a **Tailscale private network**, scraped by **Prometheus**, stored in **PostgreSQL**, visualized through **React** and **Grafana**, and analyzed using a **FastAPI Machine Learning Engine**.

The complete deployment pipeline is automated using **Docker**, **Jenkins**, **GitHub**, and **Cloudflare Tunnel**.

---

# ✨ Features

### 📊 Real-Time Monitoring

* CPU Usage Monitoring
* Memory (RAM) Monitoring
* Disk Usage Monitoring
* Network Traffic Monitoring
* Temperature Monitoring
* System Uptime Monitoring

### 🖥️ Server Management

* Monitor multiple Windows machines as servers.
* Online / Offline server detection.
* Live server status dashboard.
* Hardware resource monitoring.

### 🚨 Alerts & Analytics

* Server health alerts.
* High CPU / Memory / Disk alerts.
* Historical performance analytics.
* Resource utilization reports.
* Performance trends dashboard.

### 🤖 Machine Learning Predictions

* Predict server health.
* Healthy / Warning / Critical classification.
* Prediction dashboard with live metrics.

### ⚙️ DevOps Automation

* Docker Compose deployment.
* Jenkins CI/CD pipeline.
* Cloudflare Tunnel automation.
* Automated GitHub deployment updates.

---

# 🛠️ Tech Stack

| Category                 | Technology                                      |
| ------------------------ | ----------------------------------------------- |
| 🎨 **Frontend**          | React, Vite, Tailwind CSS, Recharts             |
| ⚡ **Backend API**        | Flask (Python REST API)                         |
| 🤖 **Machine Learning**  | FastAPI (Python)                                |
| 🗄️ **Database**         | PostgreSQL                                      |
| 📊 **Monitoring**        | Prometheus                                      |
| 📈 **Visualization**     | Grafana                                         |
| 🖥️ **Hardware Metrics** | Windows Exporter, LibreHardwareMonitor Exporter |
| 🔒 **Secure Networking** | Tailscale                                       |
| 🐳 **Containerization**  | Docker, Docker Compose                          |
| ⚙️ **CI/CD**             | Jenkins                                         |
| 🌐 **Deployment**        | Cloudflare Tunnel                               |
| 🔧 **Version Control**   | Git & GitHub                                    |

---

# 🖼️ Dashboard Preview

> Replace these placeholders with actual SHMS dashboard screenshots.

### 🟢 Live Monitoring Dashboard

<p align="center">
  <img src="frontend/public/logo.png" width="700"/>
</p>

### 📈 Analytics Dashboard

<p align="center">
  <img src="frontend/public/logo.png" width="700"/>
</p>

### 📊 Grafana Monitoring Dashboard

<p align="center">
  <img src="frontend/public/logo.png" width="700"/>
</p>

---

# 🏗️ System Architecture

```text
                    Windows Machines
                           │
      ┌────────────────────┴────────────────────┐
      │                                         │
 Windows Exporter                  LibreHardwareMonitor Exporter
      │                                         │
      └────────────────────┬────────────────────┘
                           │
                           ▼
                 Tailscale Private Network
                           │
                           ▼
                    Prometheus Server
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
      Grafana Dashboard             Flask Backend
                                            │
                                            ▼
                                    PostgreSQL Database
                                            │
                                            ▼
                                      React Dashboard
                                            │
                                            ▼
                               FastAPI ML Prediction Engine
                                            │
                                            ▼
                         Jenkins • Docker • Cloudflare Tunnel
```

---

# 🔄 Project Workflow

```text
Windows Systems
      │
      ▼
Windows Exporter + LibreHardwareMonitor
      │
      ▼
Tailscale Secure Network
      │
      ▼
Prometheus Scrapes Metrics
      │
      ▼
Flask Backend API
      │
      ▼
PostgreSQL Database
      │
      ▼
React Dashboard
      │
      ├──────────► Grafana Dashboards
      │
      └──────────► FastAPI ML Predictions
                         │
                         ▼
                 Health Prediction Results
```

---

# 📂 Project Structure

```text
Server-Health-Monitoring-System/
│
├── .github/                  # GitHub Actions & Workflows
├── backend/                  # Flask Backend API
├── frontend/                 # React + Vite Dashboard
├── grafana/                  # Grafana Dashboards
├── prometheus/               # Prometheus Configuration
├── lhm-exporter/             # LibreHardwareMonitor Exporter
├── ml-engine/                # FastAPI ML Prediction Engine
├── jenkins/                  # Jenkins CI/CD Pipeline
├── scripts/                  # Deployment Automation Scripts
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

# 📊 Monitoring Stack

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

## 🔒 Tailscale Secure Networking

SHMS uses **Tailscale** to securely connect multiple Windows systems through a private mesh VPN network.

### Why Tailscale?

* Secure communication between monitored machines.
* No public IP exposure.
* Prometheus scrapes metrics using private Tailscale IP addresses.
* Simplifies monitoring across multiple Windows devices.

### Tailscale Workflow

```text
Windows Machine A
        │
Windows Machine B
        │
Windows Machine C
        │
   Tailscale Mesh Network
        │
        ▼
 Prometheus Server
        │
        ▼
 Flask Backend → PostgreSQL
        │
        ▼
 React Dashboard + Grafana
```

---

# 🖥️ Dashboard Modules

| Module                 | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| 🟢 **Live Monitoring** | Real-time CPU, RAM, Disk, Network, Temperature & Uptime metrics. |
| 🖥️ **Servers**        | Connected Windows server status and availability.                |
| 🚨 **Alerts**          | Health alerts and monitoring notifications.                      |
| 📈 **Analytics**       | Resource utilization and historical trends.                      |
| 🤖 **Predictions**     | Machine learning prediction dashboard.                           |
| 📄 **Reports**         | Historical monitoring reports.                                   |
| 🐳 **Docker**          | Docker container monitoring and status.                          |
| 📊 **Grafana**         | Embedded Grafana dashboards.                                     |
| 📜 **Logs**            | Monitoring logs and events.                                      |
| ⚙️ **Settings**        | Dashboard configuration.                                         |

---

# 🐳 Docker Deployment

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

# ⚙️ Jenkins CI/CD Pipeline

Jenkins automates the build and deployment process for SHMS.

## CI/CD Workflow

```text
GitHub Repository
        │
        ▼
   Jenkins Pipeline
        │
        ▼
 Checkout Source Code
        │
        ▼
 Install Dependencies
        │
        ▼
 Build React Frontend
        │
        ▼
 Build Flask Backend
        │
        ▼
 Build Docker Images
        │
        ▼
 Docker Compose Deployment
        │
        ▼
 Health Check Verification
        │
        ▼
 Cloudflare Tunnel Deployment
        │
        ▼
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

# 🤖 Machine Learning Prediction Engine

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
| 🟢 Healthy  | Server operating normally.    |
| 🟡 Warning  | Resource usage increasing.    |
| 🔴 Critical | Immediate attention required. |

---

# 🌐 Cloudflare Tunnel Deployment

Cloudflare Tunnel securely exposes the SHMS dashboard without opening public ports.

## Deployment Workflow

```text
Start Docker Containers
        │
        ▼
Restart Cloudflare Tunnel
        │
        ▼
Generate Public URL
        │
        ▼
Update GitHub Repository Website
        │
        ▼
Update GitHub Secrets & Variables
        │
        ▼
Create Deployment Commit
        │
        ▼
Push Changes to GitHub
```

### Run Deployment Script

```powershell
powershell -ExecutionPolicy Bypass -File .\start-shms.ps1
```

---

# 🚀 Quick Start

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

# 📌 Project Highlights

* 📊 Real-time Windows infrastructure monitoring.
* 🖥️ Windows Exporter and LibreHardwareMonitor integration.
* 🔒 Secure monitoring through Tailscale private networking.
* 📈 Prometheus metrics collection and Grafana dashboards.
* ⚡ Flask REST API with PostgreSQL backend.
* 🤖 FastAPI Machine Learning prediction engine.
* 🐳 Fully Dockerized monitoring platform.
* ⚙️ Jenkins CI/CD automated deployment pipeline.
* 🌐 Cloudflare Tunnel automated public deployment.

---

<div align="center">

## 💙 Developed by Bandhav

**B V Raju Institute of Technology (BVRIT)**

</div>
