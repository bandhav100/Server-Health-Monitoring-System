# ðŸš€ Server Health Monitoring System (SHMS)

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

## ðŸŒ Project Overview

**Server Health Monitoring System (SHMS)** is an enterprise-grade infrastructure monitoring and observability platform designed to simulate a real-world production monitoring environment using multiple Windows systems as servers.

SHMS continuously collects CPU, memory, disk, GPU temperature, network, uptime, and hardware health metrics from multiple Windows machines through **Windows Exporter** and **LibreHardwareMonitor Exporter**. These metrics are scraped by **Prometheus**, stored in a centralized monitoring pipeline, visualized through **Grafana**, and displayed inside a modern **React Dashboard** powered by a **Spring Boot backend**.

The project also includes:

* ðŸ¤– Machine Learning health prediction engine.
* ðŸ” JWT Authentication.
* ðŸŒ Cloudflare Tunnel for secure public dashboard access.
* ðŸ›¡ï¸ Tailscale Zero-Trust VPN networking.
* ðŸ³ Dockerized monitoring stack.
* ðŸš€ Jenkins CI/CD Pipeline.
* âš¡ GitHub Actions automated health checks.

> SHMS demonstrates how enterprise organizations monitor distributed infrastructure in real time.

---

# ðŸŽ¯ Problem Statement

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

# âœ¨ Key Features

## ðŸ“Š Infrastructure Monitoring

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

## ðŸ“ˆ Visualization

* Grafana dashboards.
* Interactive React charts.
* Live server table.
* Activity Timeline.
* Alerts Dashboard.
* Performance Analytics.
* Server Health Summary.

## ðŸ¤– Machine Learning

* Server health prediction.
* CPU forecasting.
* RAM forecasting.
* Disk forecasting.
* Failure prediction API.
* ML Dashboard.

## ðŸ” Security

* JWT Authentication.
* Secure API communication.
* Cloudflare Tunnel.
* Tailscale VPN.
* Environment-based configuration.

## ðŸ³ DevOps

* Docker Compose deployment.
* Jenkins CI/CD.
* GitHub Actions automation.
* Health Check workflow.
* Automated Cloudflare URL update.

---

# ðŸ—ï¸ Enterprise Architecture

```text
                         ðŸŒ User Browser
                               â”‚
                               â–¼
                 Cloudflare Tunnel (HTTPS URL)
                               â”‚
                               â–¼
                 React + Vite Dashboard (Frontend)
                               â”‚
                               â–¼
              Spring Boot Backend REST API (JWT)
                 â”‚                      â”‚
                 â”‚                      â”‚
                 â–¼                      â–¼
        PostgreSQL Database      FastAPI ML Engine
                 â”‚
                 â–¼
           Prometheus Server
                 â–²
      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
      â”‚                     â”‚
Windows Exporter     LibreHardwareMonitor Exporter
      â–²                     â–²
      â””â”€â”€â”€â”€â”€â”€â”€â”€ Windows Monitoring Systems â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                 Connected through
                 Tailscale Zero-Trust VPN
                       â”‚
                 Jenkins CI/CD Pipeline
                       â”‚
              Docker Compose Deployment
```

---

# ðŸ› ï¸ Technology Stack

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

# ðŸ“‚ Project Structure

```text
Server-Health-Monitoring-System/
â”‚
â”œâ”€â”€ .github/
â”‚   â””â”€â”€ workflows/
â”‚       â””â”€â”€ frontend-health-check.yml
â”‚
â”œâ”€â”€ backend/                    # Spring Boot Backend
â”‚
â”œâ”€â”€ frontend/                   # React + Vite Frontend
â”‚   â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ public/
â”‚   â”œâ”€â”€ package.json
â”‚   â”œâ”€â”€ Dockerfile
â”‚   â”œâ”€â”€ vite.config.js
â”‚   â””â”€â”€ tailwind.config.js
â”‚
â”œâ”€â”€ grafana/                    # Grafana Dashboards
â”‚
â”œâ”€â”€ jenkins/                    # Jenkins CI/CD
â”‚   â”œâ”€â”€ Jenkinsfile
â”‚   â”œâ”€â”€ plugins.txt
â”‚   â”œâ”€â”€ jenkins.env
â”‚   â””â”€â”€ README.md
â”‚
â”œâ”€â”€ lhm-exporter/               # LibreHardwareMonitor Exporter
â”‚
â”œâ”€â”€ ml-engine/                  # FastAPI ML Engine
â”‚
â”œâ”€â”€ prometheus/                 # Prometheus Configuration
â”‚
â”œâ”€â”€ scripts/                    # Deployment & Tunnel Scripts
â”‚   â”œâ”€â”€ start_tunnel.cmd
â”‚   â”œâ”€â”€ live-url.json
â”‚   â””â”€â”€ verify_cloudflare.py
â”‚
â”œâ”€â”€ README.md
â”œâ”€â”€ docker-compose.yml
â”œâ”€â”€ .gitignore
â”œâ”€â”€ .gitattributes
â””â”€â”€ .oxlintrc.json
```

---

# âš™ï¸ SHMS Components

## ðŸ–¥ï¸ Frontend

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

## â˜• Backend

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

## ðŸ¤– ML Engine

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

# ðŸ³ Docker Deployment

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

# ðŸ“Š Prometheus Monitoring

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

# ðŸ“ˆ Grafana Dashboards

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

# ðŸ–¥ï¸ Windows Exporter + LibreHardwareMonitor

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

# ðŸŒ Cloudflare Tunnel

Cloudflare Tunnel securely exposes the React dashboard without opening router ports.

## Features

* HTTPS URL.
* Secure Remote Access.
* Automatic URL Updates.
* Zero Public IP Exposure.

### Tunnel Workflow

```text
Local React App
      â”‚
Cloudflare Tunnel
      â”‚
HTTPS Public URL
      â”‚
Users Access Dashboard
```

---

# ðŸ”’ Tailscale VPN

Tailscale connects multiple Windows monitoring systems.

### Benefits

* Zero Trust Networking.
* Secure Private Mesh VPN.
* Remote Server Monitoring.
* No Manual Port Forwarding.

---

# ðŸš€ Jenkins CI/CD Pipeline

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

# âš¡ GitHub Actions

GitHub Actions automate frontend health verification.

### Workflow

```text
Push â†’ Health Check â†’ Verify Cloudflare URL â†’ Success
```

### Automation

* Frontend availability.
* Cloudflare URL verification.
* Deployment validation.

---

# ðŸ” Authentication

SHMS uses JWT Authentication.

### Login Flow

```text
User Login
    â”‚
Spring Boot
    â”‚
JWT Token
    â”‚
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

# ðŸ“¡ REST API Overview

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

# ðŸ—„ï¸ PostgreSQL Database

Stores centralized monitoring information.

## Tables

* servers
* metrics
* alerts
* predictions
* users
* reports

---

# ðŸ“Š Monitoring Workflow

```text
Windows Machine
       â”‚
Windows Exporter
       â”‚
LibreHardwareMonitor Exporter
       â”‚
Prometheus
       â”‚
Spring Boot Backend
       â”‚
PostgreSQL
       â”‚
Grafana + React Dashboard
```

---

# ðŸ§ª Local Development Setup

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

# ðŸ›¡ï¸ Environment Variables

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

# ðŸ“Š Dashboard Modules

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

# ðŸ“ˆ SHMS Monitoring Features

* Real-Time Metrics.
* Health Score.
* Online / Offline Detection.
* Historical Trends.
* Predictive Analytics.
* Temperature Monitoring.
* Performance Summary.
* Alert Notifications.

---

# ðŸ‘¥ Project Team

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

# ðŸš€ Future Enhancements

* Kubernetes Deployment.
* Redis Caching.
* Alert Email Notifications.
* Slack Integration.
* Mobile Dashboard.
* AI Root Cause Analysis.
* Auto Scaling Support.
* Multi-Cluster Monitoring.

---

# ðŸ“š Learning Outcomes

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

# ðŸ“œ License

This project is developed for academic learning and enterprise DevOps practice at **B V Raju Institute of Technology (BVRIT)**.

---

# â­ Support

<<<<<<< Updated upstream
If you like this project:

* â­ Star this repository.
* ðŸ´ Fork it.
* ðŸž Open an Issue.
* ðŸš€ Contribute with Pull Requests.

---

<p align="center">
  <b>ðŸš€ Server Health Monitoring System (SHMS)</b><br/>
  Enterprise Monitoring â€¢ DevOps â€¢ Observability â€¢ Machine Learning
</p>
=======
The first query should return `1`. The second should return process metrics including `windows_process_cpu_time_total`.

> **Live Dashboard:** https://targeted-several-nickel-advanced.trycloudflare.com
>>>>>>> Stashed changes

