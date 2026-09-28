# 🚀 Server Health Monitoring System (SHMS)

<p align="center">
  <img src="frontend/public/logo.png" alt="SHMS Logo" width="140"/>
</p>

<p align="center">
  <b>Enterprise-Grade Infrastructure Monitoring & Observability Platform</b>
</p>

<p align="center">

![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge\&logo=springboot\&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge\&logo=react\&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge\&logo=docker\&logoColor=white)
![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge\&logo=jenkins\&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=for-the-badge\&logo=grafana\&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge\&logo=prometheus\&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge\&logo=postgresql\&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge\&logo=python\&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare_Tunnel-F38020?style=for-the-badge\&logo=cloudflare\&logoColor=white)
![Tailscale](https://img.shields.io/badge/Tailscale-242424?style=for-the-badge\&logo=tailscale\&logoColor=white)

</p>

---

## 🌍 Project Overview

**Server Health Monitoring System (SHMS)** is an enterprise-grade infrastructure monitoring and observability platform designed to simulate a real-world production monitoring environment using multiple Windows systems as servers.

SHMS continuously collects CPU, memory, disk, GPU temperature, network, uptime, and hardware health metrics from multiple Windows machines through **Windows Exporter** and **LibreHardwareMonitor Exporter**. These metrics are scraped by **Prometheus**, stored in a centralized monitoring pipeline, visualized through **Grafana**, and displayed inside a modern **React Dashboard** powered by a **Spring Boot backend**.

The project also includes:

* 🤖 Machine Learning health prediction engine.
* 🔐 JWT Authentication.
* 🌐 Cloudflare Tunnel for secure public dashboard access.
* 🛡️ Tailscale Zero-Trust VPN networking.
* 🐳 Dockerized monitoring stack.
* 🚀 Jenkins CI/CD Pipeline.
* ⚡ GitHub Actions automated health checks.

> SHMS demonstrates how enterprise organizations monitor distributed infrastructure in real time.

---

# 🎯 Problem Statement

Monitoring server infrastructure becomes difficult when metrics are spread across multiple systems.

Organizations need a centralized platform to:

* Monitor hardware health.
* Detect unhealthy servers.
* Visualize infrastructure performance.
* Predict future server failures.
* Access dashboards securely from anywhere.
* Automate deployments using CI/CD.

SHMS solves these challenges using a complete observability stack built with open-source DevOps technologies.

---

# ✨ Key Features

## 📊 Infrastructure Monitoring

* Real-time monitoring dashboard.
* Multi-server infrastructure monitoring.
* CPU usage.
* RAM usage.
* Disk usage.
* Network Traffic.
* System Uptime.
* GPU Temperature.
* CPU Temperature.
* Fan Speed.
* Voltage & Power Usage.

## 📈 Visualization

* Grafana dashboards.
* Interactive React charts.
* Live server table.
* Activity Timeline.
* Alerts Dashboard.
* Performance Analytics.
* Server Health Summary.

## 🤖 Machine Learning

* Server health prediction.
* CPU forecasting.
* RAM forecasting.
* Disk forecasting.
* Failure prediction API.
* ML Dashboard.

## 🔐 Security

* JWT Authentication.
* Secure API communication.
* Cloudflare Tunnel.
* Tailscale VPN.
* Environment-based configuration.

## 🐳 DevOps

* Docker Compose deployment.
* Jenkins CI/CD.
* GitHub Actions automation.
* Health Check workflow.
* Automated Cloudflare URL update.

---

# 🏗️ Enterprise Architecture

```text
                         🌐 User Browser
                               │
                               ▼
                 Cloudflare Tunnel (HTTPS URL)
                               │
                               ▼
                 React + Vite Dashboard (Frontend)
                               │
                               ▼
              Spring Boot Backend REST API (JWT)
                 │                      │
                 │                      │
                 ▼                      ▼
        PostgreSQL Database      FastAPI ML Engine
                 │
                 ▼
           Prometheus Server
                 ▲
      ┌──────────┴──────────┐
      │                     │
Windows Exporter     LibreHardwareMonitor Exporter
      ▲                     ▲
      └──────── Windows Monitoring Systems ────────┘
                       │
                 Connected through
                 Tailscale Zero-Trust VPN
                       │
                 Jenkins CI/CD Pipeline
                       │
              Docker Compose Deployment
```

---

# 🛠️ Technology Stack

| Category              | Technologies                                    |
| --------------------- | ----------------------------------------------- |
| **Frontend**          | React, Vite, JavaScript, CSS, Chart.js          |
| **Backend**           | Spring Boot, Java, JWT Authentication           |
| **ML Engine**         | FastAPI, Python, Scikit-learn                   |
| **Database**          | PostgreSQL                                      |
| **Monitoring**        | Prometheus                                      |
| **Visualization**     | Grafana                                         |
| **Metrics Exporters** | Windows Exporter, LibreHardwareMonitor Exporter |
| **CI/CD**             | Jenkins, GitHub Actions                         |
| **Containerization**  | Docker, Docker Compose                          |
| **Networking**        | Cloudflare Tunnel, Tailscale VPN                |
| **Version Control**   | Git, GitHub                                     |

---

# 📂 Project Structure

```text
Server-Health-Monitoring-System/
│
├── .github/
│   └── workflows/
│       └── frontend-health-check.yml
│
├── backend/                    # Spring Boot Backend
│
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── grafana/                    # Grafana Dashboards
│
├── jenkins/                    # Jenkins CI/CD
│   ├── Jenkinsfile
│   ├── plugins.txt
│   ├── jenkins.env
│   └── README.md
│
├── lhm-exporter/               # LibreHardwareMonitor Exporter
│
├── ml-engine/                  # FastAPI ML Engine
│
├── prometheus/                 # Prometheus Configuration
│
├── scripts/                    # Deployment & Tunnel Scripts
│   ├── start_tunnel.cmd
│   ├── live-url.json
│   └── verify_cloudflare.py
│
├── README.md
├── docker-compose.yml
├── .gitignore
├── .gitattributes
└── .oxlintrc.json
```

---

# ⚙️ SHMS Components

## 🖥️ Frontend

**Technology**

* React
* Vite
* Chart.js
* CSS

### Pages

* Dashboard
* Live Monitoring
* Servers
* Alerts
* Analytics
* Predictions
* Grafana
* Docker
* Reports
* Logs
* Settings
* Profile
* Setup Guide

### UI Components

* Metric Cards
* Server Table
* Status Badge
* Prediction Card
* Alert Card
* Activity Timeline
* Navbar
* Sidebar

---

## ☕ Backend

Spring Boot backend provides REST APIs for:

* Authentication
* Dashboard metrics
* Server management
* Alerts
* Predictions
* Reports
* Settings

### Backend Features

* JWT Authentication.
* PostgreSQL Integration.
* REST APIs.
* CORS Configuration.
* Prometheus API Integration.

---

## 🤖 ML Engine

FastAPI microservice predicts infrastructure health.

### Prediction APIs

| Endpoint             | Purpose                      |
| -------------------- | ---------------------------- |
| `/predict/dashboard` | Dashboard prediction summary |
| `/predict/server`    | Server prediction            |
| `/forecast/cpu`      | CPU Forecast                 |
| `/forecast/ram`      | RAM Forecast                 |
| `/forecast/disk`     | Disk Forecast                |

### ML Models

* Isolation Forest
* Prophet
* Scikit-learn
* Pandas
* NumPy

---

# 🐳 Docker Deployment

SHMS is fully containerized.

## Docker Containers

| Container           | Port      | Purpose           |
| ------------------- | --------- | ----------------- |
| `shms-frontend`     | 80 / 5173 | React Dashboard   |
| `shms-backend`      | 8081      | Spring Boot API   |
| `shms-ml-engine`    | 8000      | Prediction Engine |
| `shms-postgres`     | 5432      | PostgreSQL        |
| `shms-prometheus`   | 9090      | Metrics Collector |
| `shms-grafana`      | 3000      | Visualization     |
| `shms-lhm-exporter` | 9105      | Hardware Metrics  |

## Run Complete Stack

```bash
docker compose up --build
```

Stop Stack

```bash
docker compose down
```

View Running Containers

```bash
docker ps
```

---

# 📊 Prometheus Monitoring

Prometheus scrapes metrics from every Windows monitoring system.

### Scrape Targets

* Backend Metrics
* Windows Exporter
* LibreHardwareMonitor Exporter
* ML Engine Metrics
* Prometheus Self Metrics

### Metrics Collected

* CPU Usage
* Memory Usage
* Disk Usage
* Network Traffic
* GPU Temperature
* CPU Temperature
* Fan Speed
* Power Consumption
* Uptime

---

# 📈 Grafana Dashboards

Grafana provides enterprise visualization.

### Dashboards Included

* Infrastructure Overview
* CPU Monitoring
* RAM Monitoring
* Disk Monitoring
* Network Monitoring
* Temperature Dashboard
* Alerts Dashboard
* Prometheus Metrics Dashboard

### Features

* Real-time graphs.
* Auto refresh.
* Historical metrics.
* Server comparison.
* Custom panels.

---

# 🖥️ Windows Exporter + LibreHardwareMonitor

SHMS monitors Windows systems as production servers.

## Windows Exporter

Provides:

* CPU Metrics.
* Memory Metrics.
* Disk Metrics.
* Network Metrics.
* System Uptime.

## LibreHardwareMonitor Exporter

Provides hardware metrics.

* CPU Temperature.
* GPU Temperature.
* Fan Speed.
* Voltage.
* Power Usage.
* Clock Speed.

---

# 🌐 Cloudflare Tunnel

Cloudflare Tunnel securely exposes the React dashboard without opening router ports.

## Features

* HTTPS URL.
* Secure Remote Access.
* Automatic URL Updates.
* Zero Public IP Exposure.

### Tunnel Workflow

```text
Local React App
      │
Cloudflare Tunnel
      │
HTTPS Public URL
      │
Users Access Dashboard
```

---

# 🔒 Tailscale VPN

Tailscale connects multiple Windows monitoring systems.

### Benefits

* Zero Trust Networking.
* Secure Private Mesh VPN.
* Remote Server Monitoring.
* No Manual Port Forwarding.

---

# 🚀 Jenkins CI/CD Pipeline

SHMS includes an automated Jenkins pipeline.

## Pipeline Stages

```text
1. Clean Workspace
2. Checkout GitHub Repository
3. Verify Project Structure
4. Build Spring Boot Backend
5. Install Frontend Dependencies
6. Build React Dashboard
7. Validate Docker Compose
8. Run Health Checks
9. Deploy Monitoring Stack
10. Cleanup Workspace
```

## Jenkins Features

* GitHub Integration.
* Docker Pipeline.
* Workspace Cleanup.
* Build Timeout.
* Color Console Output.
* Timestamp Logs.

---

# ⚡ GitHub Actions

GitHub Actions automate frontend health verification.

### Workflow

```text
Push → Health Check → Verify Cloudflare URL → Success
```

### Automation

* Frontend availability.
* Cloudflare URL verification.
* Deployment validation.

---

# 🔐 Authentication

SHMS uses JWT Authentication.

### Login Flow

```text
User Login
    │
Spring Boot
    │
JWT Token
    │
Authenticated APIs
```

### Protected APIs

* Dashboard
* Servers
* Alerts
* Reports
* Predictions
* Settings

---

# 📡 REST API Overview

## Dashboard APIs

```http
GET /api/dashboard/live
GET /api/dashboard/summary
```

## Server APIs

```http
GET /api/servers
POST /api/servers
DELETE /api/servers/{id}
```

## Alert APIs

```http
GET /api/alerts
POST /api/alerts
```

## Prediction APIs

```http
GET /api/predictions/dashboard
POST /api/predictions/server
```

---

# 🗄️ PostgreSQL Database

Stores centralized monitoring information.

## Tables

* servers
* metrics
* alerts
* predictions
* users
* reports

---

# 📊 Monitoring Workflow

```text
Windows Machine
       │
Windows Exporter
       │
LibreHardwareMonitor Exporter
       │
Prometheus
       │
Spring Boot Backend
       │
PostgreSQL
       │
Grafana + React Dashboard
```

---

# 🧪 Local Development Setup

## Clone Repository

```bash
git clone https://github.com/bandhav100/Server-Health-Monitoring-System.git
cd Server-Health-Monitoring-System
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Runs at:

```text
http://localhost:5173
```

---

## Backend

```bash
cd backend

./mvnw spring-boot:run
```

Runs at:

```text
http://localhost:8081
```

---

## ML Engine

```bash
cd ml-engine

pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

Runs at:

```text
http://localhost:8000
```

---

## Prometheus

```bash
docker compose up prometheus
```

Runs at:

```text
http://localhost:9090
```

---

## Grafana

```bash
docker compose up grafana
```

Runs at:

```text
http://localhost:3000
```

---

# 🛡️ Environment Variables

## Frontend

```env
VITE_BACKEND_URL=http://localhost:8081
VITE_GRAFANA_URL=http://localhost:3000
```

## Backend

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shms
DB_USER=postgres
DB_PASSWORD=******
JWT_SECRET=******
PROMETHEUS_URL=http://localhost:9090
ML_ENGINE_URL=http://localhost:8000
```

---

# 📊 Dashboard Modules

* Infrastructure Health
* Live Monitoring
* Analytics
* Predictions
* Reports
* Alerts
* Server Management
* Docker Status
* Grafana Dashboard
* Settings

---

# 📈 SHMS Monitoring Features

* Real-Time Metrics.
* Health Score.
* Online / Offline Detection.
* Historical Trends.
* Predictive Analytics.
* Temperature Monitoring.
* Performance Summary.
* Alert Notifications.

---

# 👥 Project Team

| Team Member         | Role                              |
| ------------------- | --------------------------------- |
| **Bandhav**         | DevOps Engineer                   |
| **Vinay Charan**    | Product Owner & Scrum Master      |
| **Sai Abhiram**     | Lead Backend Developer            |
| **Navadeep**        | Backend Developer                 |
| **Manjunath**       | Machine Learning Engineer         |
| **Nihal**           | QA Engineer                       |
| **Abhiram Krishna** | Frontend Dashboard Developer      |
| **Prem Kumar**      | Cloud & Release Coordinator (SRE) |

---

# 🚀 Future Enhancements

* Kubernetes Deployment.
* Redis Caching.
* Alert Email Notifications.
* Slack Integration.
* Mobile Dashboard.
* AI Root Cause Analysis.
* Auto Scaling Support.
* Multi-Cluster Monitoring.

---

# 📚 Learning Outcomes

This project demonstrates practical implementation of:

* Spring Boot REST APIs.
* React Dashboard Development.
* JWT Authentication.
* PostgreSQL Integration.
* Docker & Docker Compose.
* Jenkins CI/CD.
* GitHub Actions.
* Prometheus Monitoring.
* Grafana Visualization.
* Cloudflare Tunnel.
* Tailscale VPN.
* Machine Learning Predictions.
* Infrastructure Observability.

---

# 📜 License

This project is developed for academic learning and enterprise DevOps practice at **B V Raju Institute of Technology (BVRIT)**.

---

# ⭐ Support

<<<<<<< Updated upstream
If you like this project:

* ⭐ Star this repository.
* 🍴 Fork it.
* 🐞 Open an Issue.
* 🚀 Contribute with Pull Requests.

---

<p align="center">
  <b>🚀 Server Health Monitoring System (SHMS)</b><br/>
  Enterprise Monitoring • DevOps • Observability • Machine Learning
</p>
=======
The first query should return `1`. The second should return process metrics including `windows_process_cpu_time_total`.

> **Live Dashboard:** https://through-joe-sharp-betty.trycloudflare.com
>>>>>>> Stashed changes
