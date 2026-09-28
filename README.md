# 🚀 Server Health Monitoring System (SHMS)

<div align="center">

  <img src="frontend/public/logo.png" alt="SHMS Logo" width="180"/>

## Enterprise DevOps Monitoring Platform

**Real-Time Monitoring • Predictive Analytics • CI/CD Automation • Observability**

  <br/>

  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white"/>

  <br/>

  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white"/>
  <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white"/>
  <img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white"/>
  <img src="https://img.shields.io/badge/Cloudflare_Tunnel-F38020?style=for-the-badge&logo=cloudflare&logoColor=white"/>

</div>

---

# 📖 Overview

**Server Health Monitoring System (SHMS)** is a full-stack DevOps monitoring platform designed to monitor multiple Windows machines as servers in real time. The project provides live infrastructure monitoring, predictive analytics, automated deployment, and centralized observability through a modern monitoring stack.

SHMS collects system and hardware metrics using **Windows Exporter** and **LibreHardwareMonitor Exporter**, scrapes metrics through **Prometheus**, stores monitoring data in **PostgreSQL**, visualizes dashboards with **React** and **Grafana**, and predicts server health using a **FastAPI Machine Learning Engine**.

The entire deployment workflow is automated using **Docker**, **Jenkins CI/CD**, **GitHub**, and **Cloudflare Tunnel**.

---

# ✨ Project Features

### 📊 Real-Time Monitoring

* Live CPU usage monitoring.
* Memory (RAM) monitoring.
* Disk usage monitoring.
* Network traffic monitoring.
* System uptime monitoring.
* Hardware temperature monitoring.

### 🖥️ Server Management

* Monitor multiple Windows systems as servers.
* Online and offline server detection.
* Server status dashboard.
* Hardware resource monitoring.

### 🚨 Alert Management

* Real-time health alerts.
* Resource usage alerts.
* Server availability notifications.
* Monitoring event logs.

### 📈 Analytics & Reports

* Historical performance analytics.
* Resource utilization reports.
* Monitoring trends.
* Performance dashboard.

### 🤖 Machine Learning Predictions

* Predict server health status.
* Healthy, Warning and Critical classification.
* Dashboard prediction visualization.

### ⚙️ DevOps Automation

* Dockerized deployment.
* Jenkins CI/CD pipeline.
* Cloudflare Tunnel automation.
* Automated GitHub deployment updates.

---

# 🛠️ Technology Stack

| Category                    | Technology                                      |
| --------------------------- | ----------------------------------------------- |
| **Frontend**                | React, Vite, Tailwind CSS, Recharts             |
| **Backend API**             | Flask (Python)                                  |
| **Machine Learning Engine** | FastAPI, Python                                 |
| **Database**                | PostgreSQL                                      |
| **Monitoring**              | Prometheus                                      |
| **Visualization**           | Grafana                                         |
| **Hardware Metrics**        | Windows Exporter, LibreHardwareMonitor Exporter |
| **Containerization**        | Docker, Docker Compose                          |
| **CI/CD**                   | Jenkins                                         |
| **Deployment**              | Cloudflare Tunnel                               |
| **Version Control**         | Git & GitHub                                    |

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
```

---

# 📂 Project Structure

```text
Server-Health-Monitoring-System/
│
├── .github/                  # GitHub Actions
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

Prometheus is responsible for collecting and scraping monitoring metrics from different exporters and services.

**Metrics collected include:**

* CPU Usage
* RAM Usage
* Disk Usage
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

Grafana provides interactive dashboards for monitoring infrastructure health.

**Available Dashboards**

* CPU Monitoring Dashboard
* Memory Monitoring Dashboard
* Disk Usage Dashboard
* Network Monitoring Dashboard
* Temperature Dashboard
* Historical Performance Dashboard
* Server Availability Dashboard

---

# 🖥️ Dashboard Modules

| Module             | Description                                        |
| ------------------ | -------------------------------------------------- |
| 🟢 Live Monitoring | Displays real-time server metrics.                 |
| 🖥️ Servers        | Shows connected Windows systems and server status. |
| 🚨 Alerts          | Displays server health alerts and notifications.   |
| 📈 Analytics       | Visualizes resource utilization and trends.        |
| 🤖 Predictions     | Displays machine learning prediction results.      |
| 📄 Reports         | Historical monitoring reports and summaries.       |
| 🐳 Docker          | Docker container monitoring and status.            |
| 📊 Grafana         | Embedded Grafana monitoring dashboards.            |
| 📜 Logs            | Monitoring events and server logs.                 |
| ⚙️ Settings        | Dashboard configuration and preferences.           |

---

# 🐳 Docker Deployment

The complete monitoring platform is containerized using **Docker Compose**.

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

# ⚙️ Jenkins CI/CD Workflow

Jenkins automates the deployment process from code changes to a running monitoring platform.

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
 Build Frontend & Backend
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

### Jenkins Pipeline Stages

1. Checkout Repository
2. Install Project Dependencies
3. Build React Frontend
4. Build Flask Backend
5. Build Docker Images
6. Deploy Containers using Docker Compose
7. Verify Running Services
8. Publish Live Deployment

---

# 🤖 Machine Learning Workflow

The FastAPI Machine Learning Engine analyzes monitoring metrics and predicts server health.

## Prediction Endpoint

```http
POST /predict/dashboard
```

## Prediction Input Metrics

* CPU Usage
* Memory Usage
* Disk Usage
* Temperature
* Network Activity
* System Uptime

## Prediction Output

| Status      | Description                         |
| ----------- | ----------------------------------- |
| 🟢 Healthy  | Server is operating normally.       |
| 🟡 Warning  | Resource utilization is increasing. |
| 🔴 Critical | Immediate attention is required.    |

---

# 🌐 Cloudflare Tunnel Workflow

A PowerShell deployment script automates Cloudflare Tunnel deployment.

## Deployment Workflow

```text
Start Docker Containers
        │
        ▼
Restart Cloudflare Tunnel
        │
        ▼
Generate New Public URL
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

---

## Backend Setup

```bash
cd backend

pip install -r requirements.txt

python app.py
```

Backend runs on **http://localhost:8081**

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on **http://localhost:5173**

---

## ML Engine Setup

```bash
cd ml-engine

pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

ML Engine runs on **http://localhost:8000**

---

## Start Monitoring Stack

```bash
docker compose up -d
```

---

# 🔄 Monitoring Workflow

```text
Windows Exporter
        │
LibreHardwareMonitor Exporter
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
        ▼
 FastAPI ML Prediction Engine
        │
        ▼
 Grafana Dashboards
```

---

# 📌 Project Highlights

* Real-time Windows infrastructure monitoring.
* Prometheus-based metrics collection.
* Grafana dashboards for observability.
* Flask REST API with PostgreSQL backend.
* FastAPI machine learning prediction engine.
* Dockerized monitoring stack with Docker Compose.
* Jenkins CI/CD automated deployment pipeline.
* Cloudflare Tunnel automated public deployment.

---

<div align="center">

## 💙 Developed by Bandhav

**B V Raju Institute of Technology (BVRIT)**

</div>
