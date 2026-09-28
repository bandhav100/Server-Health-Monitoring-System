# 🚀 Server Health Monitoring System (SHMS)

<p align="center">
  Enterprise-grade DevOps monitoring platform for real-time server health, predictive analytics, and automated deployment.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react"/>
  <img src="https://img.shields.io/badge/SpringBoot-3.5-green?logo=springboot"/>
  <img src="https://img.shields.io/badge/FastAPI-ML-success?logo=fastapi"/>
  <img src="https://img.shields.io/badge/Docker-Containerized-blue?logo=docker"/>
  <img src="https://img.shields.io/badge/Jenkins-CI/CD-red?logo=jenkins"/>
  <img src="https://img.shields.io/badge/Prometheus-Monitoring-orange?logo=prometheus"/>
  <img src="https://img.shields.io/badge/Grafana-Dashboard-F46800?logo=grafana"/>
</p>

---

## 📌 Overview

**Server Health Monitoring System (SHMS)** is a full-stack DevOps platform that continuously monitors infrastructure health, visualizes metrics in real time, predicts server failures using machine learning, and automates deployments through Docker, Jenkins, and Cloudflare Tunnel.

Instead of monitoring Linux servers directly, this project treats **Windows machines as monitored servers** using **Windows Exporter** and **LibreHardwareMonitor Exporter**, allowing Prometheus to scrape CPU, RAM, disk, network, and hardware metrics from multiple systems.

---

## ✨ Features

* 📊 Real-time server health dashboard.
* 🖥️ Monitor multiple Windows systems as servers.
* 📈 Live CPU, RAM, Disk, Network, Temperature metrics.
* 🚨 Alert management for unhealthy servers.
* 🤖 Machine Learning failure prediction (FastAPI ML Engine).
* 📉 Historical analytics and reports.
* 🐳 Dockerized monitoring stack.
* ⚙️ Jenkins CI/CD pipeline.
* 🌐 Automatic Cloudflare Tunnel deployment.
* 🔐 GitHub Secret & Variable automation.

---

## 🏗️ Architecture

```text
Windows Servers
      │
      ├── Windows Exporter
      └── LibreHardwareMonitor Exporter
               │
               ▼
         Prometheus Scraper
               │
      ┌────────┴─────────┐
      ▼                  ▼
   Grafana         Spring Boot API
      │                  │
      │                  ▼
      │           PostgreSQL Database
      │                  │
      └──────────┬───────┘
                 ▼
            React Dashboard
                 │
                 ▼
        FastAPI ML Prediction Engine
```

---

## 🧰 Tech Stack

| Layer            | Technology                                       |
| ---------------- | ------------------------------------------------ |
| Frontend         | React + Vite + Tailwind CSS + Recharts           |
| Backend          | Spring Boot + JWT + REST APIs                    |
| ML Engine        | FastAPI + Python                                 |
| Database         | PostgreSQL                                       |
| Monitoring       | Prometheus                                       |
| Dashboard        | Grafana                                          |
| Hardware Metrics | Windows Exporter + LibreHardwareMonitor Exporter |
| Containers       | Docker & Docker Compose                          |
| CI/CD            | Jenkins                                          |
| Tunnel           | Cloudflare Tunnel                                |
| Version Control  | Git & GitHub                                     |

---

## 📂 Project Structure

```text
Server-Health-Monitoring-System/
│
├── .github/                 # GitHub Actions
├── backend/                 # Spring Boot Backend
├── frontend/                # React + Vite Frontend
├── ml-engine/               # FastAPI ML Prediction Service
├── prometheus/              # Prometheus Configuration
├── grafana/                 # Grafana Dashboards
├── lhm-exporter/            # LibreHardwareMonitor Exporter
├── jenkins/                 # Jenkins Pipeline Files
├── scripts/                 # Deployment Automation Scripts
│
├── docker-compose.yml       # Complete Monitoring Stack
├── README.md
└── .gitignore
```

---

## 📊 Monitoring Components

### Prometheus

Collects metrics from:

* Windows Exporter
* LibreHardwareMonitor Exporter
* Spring Boot Actuator
* Prometheus Server

### Grafana

Provides dashboards for:

* CPU Usage
* RAM Usage
* Disk Utilization
* Network Traffic
* Temperature
* JVM Metrics
* Server Availability

---

## 🐳 Docker Services

The monitoring stack runs using Docker Compose.

| Service             | Port |
| ------------------- | ---- |
| React Frontend      | 5173 |
| Spring Boot Backend | 8081 |
| FastAPI ML Engine   | 8000 |
| Grafana             | 3000 |
| Prometheus          | 9090 |

Start everything:

```bash
docker compose up -d
```

---

## ⚙️ Jenkins CI/CD

Jenkins automates the deployment pipeline.

Pipeline stages include:

1. Checkout Repository
2. Build Spring Boot Backend
3. Build React Frontend
4. Build Docker Images
5. Deploy Containers
6. Verify Deployment
7. Update GitHub Deployment Status

Jenkins configuration files are available inside the `jenkins/` directory.

---

## 🤖 Machine Learning Prediction Engine

FastAPI ML service predicts server health using collected metrics.

Prediction API:

```http
POST /predict/dashboard
```

Input metrics include CPU, RAM, Disk usage, temperature, uptime, and network activity.

---

## 🌐 Cloudflare Tunnel Automation

Every deployment automatically:

* Creates a new Cloudflare Tunnel.
* Updates GitHub Secret (`FRONTEND_URL`).
* Updates GitHub Variable (`FRONTEND_LINK`).
* Updates the GitHub Repository **Website** link.
* Creates and pushes a deployment commit.

Run automation:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-shms.ps1
```

---

## 🚀 Running the Project

### 1. Clone Repository

```bash
git clone https://github.com/bandhav100/Server-Health-Monitoring-System.git
cd Server-Health-Monitoring-System
```

### 2. Backend

```bash
cd backend
./mvnw spring-boot:run
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. ML Engine

```bash
cd ml-engine
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 5. Monitoring Stack

```bash
docker compose up -d
```

---

## 📈 Dashboards

The React dashboard provides:

* Live Monitoring
* Server Status
* Analytics
* Alerts
* Predictions
* Reports
* Docker Overview
* Grafana Integration
* Settings

---

## 🔐 Security

* JWT Authentication
* Environment Variables
* GitHub Secrets
* Cloudflare Secure Tunnel
* Prometheus Read-only Metrics

---

## 📚 Future Improvements

* Kubernetes Deployment
* Named Cloudflare Tunnel
* Email & Slack Alerts
* Multi-region Monitoring
* AI Root Cause Analysis
* Mobile Dashboard
* Auto Scaling Recommendations

---

## 👨‍💻 Team

| Role                              | Member          |
| --------------------------------- | --------------- |
| Product Owner / Scrum Master      | Vinay Charan    |
| Lead Developer                    | Sai Abhiram     |
| DevOps Engineer                   | **Bandhav**     |
| Backend Developer                 | Navadeep        |
| ML Engineer                       | Manjunath       |
| QA Engineer                       | Nihal           |
| Dashboard Developer               | Abhiram Krishna |
| Cloud & Release Coordinator (SRE) | Prem Kumar      |

---

## 📄 License

This project is built for academic and DevOps learning purposes at **B V Raju Institute of Technology (BVRIT)** and demonstrates enterprise monitoring, automation, CI/CD, and observability practices.
