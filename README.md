# 🚀 Server Health Monitoring System (SHMS)

<div align="center">

### Enterprise DevOps Monitoring Platform for Real-Time Infrastructure Health

**React • Flask • FastAPI • PostgreSQL • Docker • Jenkins • Prometheus • Grafana • Cloudflare Tunnel**

![GitHub stars](https://img.shields.io/github/stars/bandhav100/Server-Health-Monitoring-System?style=for-the-badge)
![GitHub forks](https://img.shields.io/github/forks/bandhav100/Server-Health-Monitoring-System?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/bandhav100/Server-Health-Monitoring-System?style=for-the-badge)

</div>

---

## 📌 Overview

**Server Health Monitoring System (SHMS)** is a full-stack DevOps monitoring platform that continuously monitors multiple **Windows machines as servers** in real time.

The system collects hardware and operating system metrics using **Windows Exporter** and **LibreHardwareMonitor Exporter**, stores and processes monitoring data through a **Flask backend** with **PostgreSQL**, visualizes live metrics using **React**, and predicts potential server failures using a **FastAPI Machine Learning Engine**.

The complete monitoring stack is containerized using **Docker**, visualized through **Grafana**, monitored by **Prometheus**, and automated using **Jenkins CI/CD** and **Cloudflare Tunnel**.

---

# ✨ Features

* 📊 Real-time Server Health Dashboard.
* 🖥️ Monitor Multiple Windows Systems as Servers.
* 📈 Live CPU, RAM, Disk, Network & Temperature Monitoring.
* 🟢 Server Online / Offline Detection.
* 🚨 Alert Management Dashboard.
* 📉 Historical Analytics & Reports.
* 🤖 Machine Learning Based Health Prediction.
* 📊 Grafana Dashboard Integration.
* 📡 Prometheus Metrics Collection.
* 🐳 Dockerized Monitoring Stack.
* ⚙️ Jenkins CI/CD Pipeline.
* 🌐 Automatic Cloudflare Tunnel Deployment.

---

# 🏗️ System Architecture

```text
                    Windows Machines
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
 Windows Exporter              LibreHardwareMonitor Exporter
         │                                   │
         └─────────────────┬─────────────────┘
                           │
                           ▼
                     Prometheus Server
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
         Grafana Dashboard          Flask Backend API
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

# 🛠️ Tech Stack

| Layer                | Technology                                      |
| -------------------- | ----------------------------------------------- |
| **Frontend**         | React, Vite, Tailwind CSS, Recharts             |
| **Backend API**      | Python Flask                                    |
| **Machine Learning** | FastAPI, Python                                 |
| **Database**         | PostgreSQL                                      |
| **Monitoring**       | Prometheus                                      |
| **Visualization**    | Grafana                                         |
| **Hardware Metrics** | Windows Exporter, LibreHardwareMonitor Exporter |
| **Containers**       | Docker, Docker Compose                          |
| **CI/CD**            | Jenkins                                         |
| **Deployment**       | Cloudflare Tunnel                               |
| **Version Control**  | Git & GitHub                                    |

---

# 📂 Project Structure

```text
Server-Health-Monitoring-System/
│
├── .github/                 # GitHub Actions & Workflows
├── backend/                 # Flask Backend API
├── frontend/                # React + Vite Frontend
├── ml-engine/               # FastAPI ML Prediction Engine
├── prometheus/              # Prometheus Configuration
├── grafana/                 # Grafana Dashboards
├── lhm-exporter/            # LibreHardwareMonitor Exporter
├── jenkins/                 # Jenkins Pipeline Files
├── scripts/                 # Deployment Automation Scripts
│
├── docker-compose.yml        # Complete Monitoring Stack
├── README.md
└── .gitignore
```

---

# 📊 Monitoring Components

## Prometheus

Prometheus continuously scrapes metrics from:

* Windows Exporter
* LibreHardwareMonitor Exporter
* Flask Backend
* Prometheus Server

Collected metrics include:

* CPU Usage
* RAM Usage
* Disk Utilization
* Network Traffic
* Temperature
* System Uptime
* Server Availability

---

## Grafana

Grafana provides interactive dashboards for:

* CPU Usage
* Memory Usage
* Disk Usage
* Network Throughput
* Temperature Monitoring
* Historical Trends
* Server Availability

---

# 🖥️ Dashboard Modules

The React dashboard contains the following pages:

| Module              | Description                |
| ------------------- | -------------------------- |
| **Live Monitoring** | Real-time server metrics   |
| **Servers**         | View all monitored systems |
| **Alerts**          | Server alert management    |
| **Analytics**       | Performance analytics      |
| **Predictions**     | ML prediction results      |
| **Reports**         | Monitoring reports         |
| **Docker**          | Docker container status    |
| **Grafana**         | Embedded Grafana dashboard |
| **Logs**            | Server logs                |
| **Settings**        | Dashboard configuration    |

---

# 🐳 Docker Monitoring Stack

Docker Compose runs the complete monitoring infrastructure.

## Services

| Container         | Port     |
| ----------------- | -------- |
| React Frontend    | **5173** |
| Flask Backend     | **8081** |
| FastAPI ML Engine | **8000** |
| Grafana           | **3000** |
| Prometheus        | **9090** |

### Start Containers

```bash
docker compose up -d
```

### Stop Containers

```bash
docker compose down
```

### View Running Containers

```bash
docker ps
```

---

# ⚙️ Jenkins CI/CD Pipeline

Jenkins automates the deployment workflow.

## Pipeline Stages

1. Checkout GitHub Repository
2. Install Dependencies
3. Build React Frontend
4. Build Flask Backend
5. Build Docker Images
6. Deploy Docker Containers
7. Health Check Verification
8. Deployment Success Notification

Jenkins configuration files are available inside:

```text
jenkins/
├── Jenkinsfile
├── plugins.txt
├── jenkins.env
└── README.md
```

---

# 🤖 Machine Learning Prediction Engine

The FastAPI ML Engine predicts server health using collected monitoring metrics.

### Prediction Endpoint

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

### Output

* Healthy
* Warning
* Critical

Prediction results are displayed inside the dashboard.

---

# 📡 Prometheus Scraping

Prometheus monitors multiple Windows machines using exporters.

### Exporters Used

* Windows Exporter
* LibreHardwareMonitor Exporter

### Metrics Collected

* CPU Utilization
* Memory Usage
* Disk Space
* Network Speed
* Hardware Temperature
* Fan Speed
* Power Usage

---

# 🌐 Cloudflare Tunnel Automation

Deployment automation automatically performs:

* Start Docker Containers.
* Restart Cloudflare Tunnel.
* Generate New Public URL.
* Update GitHub Secret (`FRONTEND_URL`).
* Update GitHub Variable (`FRONTEND_LINK`).
* Update GitHub Repository Website.
* Create Git Commit.
* Push Latest Deployment.

### Run Deployment Script

```powershell
powershell -ExecutionPolicy Bypass -File .\start-shms.ps1
```

---

# 🚀 Getting Started

## 1. Clone Repository

```bash
git clone https://github.com/bandhav100/Server-Health-Monitoring-System.git

cd Server-Health-Monitoring-System
```

---

## 2. Start Flask Backend

```bash
cd backend

pip install -r requirements.txt

python app.py
```

Backend runs on:

```text
http://localhost:8081
```

---

## 3. Start React Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

## 4. Start ML Engine

```bash
cd ml-engine

pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

ML Engine runs on:

```text
http://localhost:8000
```

---

## 5. Start Monitoring Stack

```bash
docker compose up -d
```

---

# 📈 Monitoring Workflow

```text
Windows Exporter
        │
LibreHardwareMonitor Exporter
        │
        ▼
   Prometheus Scrapes Metrics
        │
        ▼
     Flask Backend
        │
        ▼
   PostgreSQL Database
        │
        ▼
 React Dashboard Displays Metrics
        │
        ▼
 FastAPI Predicts Server Health
        │
        ▼
 Grafana Visualizes Historical Data
```

---

# 🔐 Security

* JWT Authentication
* Environment Variables
* GitHub Secrets
* Docker Network Isolation
* Cloudflare Secure Tunnel

---

# 📚 Future Enhancements

* Kubernetes Deployment
* Named Cloudflare Tunnel
* Email & Slack Notifications
* Multi-Region Monitoring
* AI Root Cause Analysis
* Mobile Dashboard
* Auto Scaling Recommendations

---

# 👥 Project Team

| Role                                  | Member          |
| ------------------------------------- | --------------- |
| **Product Owner / Scrum Master**      | Vinay Charan    |
| **Lead Developer**                    | Sai Abhiram     |
| **DevOps Engineer**                   | **Bandhav**     |
| **Backend Developer**                 | Navadeep        |
| **ML Engineer**                       | Manjunath       |
| **QA Engineer**                       | Nihal           |
| **Dashboard Developer**               | Abhiram Krishna |
| **Cloud & Release Coordinator (SRE)** | Prem Kumar      |

---

# 🎯 Project Highlights

* Real-Time Infrastructure Monitoring.
* Enterprise DevOps Workflow.
* Docker Containerization.
* Jenkins CI/CD Automation.
* Prometheus Metrics Collection.
* Grafana Observability Dashboard.
* Machine Learning Based Server Health Prediction.
* Cloudflare Tunnel Automated Deployment.

---

# 📄 License

This project was developed for academic learning and DevOps engineering practice at **B V Raju Institute of Technology (BVRIT)**.

It demonstrates modern infrastructure monitoring, observability, automation, CI/CD, Docker containerization, and predictive analytics in a production-style environment.
