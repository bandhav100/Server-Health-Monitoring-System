# 🚀 Server Health Monitoring System (SHMS)

<div align="center">

<img src="frontend/public/logo.png" alt="SHMS Logo" width="180"/>

### Enterprise DevOps Monitoring Platform

**Real-Time Monitoring • Predictive Analytics • CI/CD Automation • Observability**

<p>
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white"/>
</p>

<p>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white"/>
  <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white"/>
  <img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white"/>
  <img src="https://img.shields.io/badge/Cloudflare_Tunnel-F38020?style=for-the-badge&logo=cloudflare&logoColor=white"/>
</p>

<p>
  <img src="https://img.shields.io/github/stars/bandhav100/Server-Health-Monitoring-System?style=flat-square"/>
  <img src="https://img.shields.io/github/forks/bandhav100/Server-Health-Monitoring-System?style=flat-square"/>
  <img src="https://img.shields.io/github/last-commit/bandhav100/Server-Health-Monitoring-System?style=flat-square"/>
  <img src="https://img.shields.io/github/repo-size/bandhav100/Server-Health-Monitoring-System?style=flat-square"/>
  <img src="https://img.shields.io/github/languages/top/bandhav100/Server-Health-Monitoring-System?style=flat-square"/>
</p>

</div>

---

## 📖 Overview

**Server Health Monitoring System (SHMS)** is a production-style DevOps monitoring platform that continuously monitors multiple Windows machines in real time.

Instead of Linux servers, SHMS treats **Windows systems as monitored servers** using **Windows Exporter** and **LibreHardwareMonitor Exporter**. Metrics are scraped by **Prometheus**, stored in **PostgreSQL**, visualized through a **React Dashboard** and **Grafana**, and analyzed using a **FastAPI Machine Learning Engine**. The complete deployment workflow is automated with **Docker**, **Jenkins**, **GitHub**, and **Cloudflare Tunnel**.

---

## ✨ Features

| Feature                         | Description                                                     |
| ------------------------------- | --------------------------------------------------------------- |
| 📊 **Live Monitoring**          | CPU, RAM, Disk, Network, Temperature & Uptime monitoring.       |
| 🖥️ **Server Management**       | Monitor multiple Windows systems with online/offline detection. |
| 🚨 **Alerts**                   | Real-time health alerts and server status notifications.        |
| 📈 **Analytics**                | Historical metrics, performance trends, and reports.            |
| 🤖 **ML Predictions**           | Predict server health as Healthy, Warning, or Critical.         |
| 🐳 **Containerized Deployment** | Docker Compose monitoring stack.                                |
| ⚙️ **CI/CD Automation**         | Jenkins pipeline for automated deployment.                      |
| 🌐 **Public Deployment**        | Cloudflare Tunnel for secure live dashboard access.             |

---

## 🖼️ Dashboard Preview

> Replace these placeholders with your SHMS screenshots after deployment.

### 🟢 Live Monitoring Dashboard

<p align="center">
  <img src="frontend/public/logo.png" width="750"/>
</p>

### 📈 Analytics Dashboard

<p align="center">
  <img src="frontend/public/logo.png" width="750"/>
</p>

### 📊 Grafana Dashboard

<p align="center">
  <img src="frontend/public/logo.png" width="750"/>
</p>

---

## 🏗️ System Architecture

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

## 🛠️ Tech Stack

| Category                 | Technologies                                    |
| ------------------------ | ----------------------------------------------- |
| 🎨 **Frontend**          | React, Vite, Tailwind CSS, Recharts             |
| ⚡ **Backend API**        | Flask REST API                                  |
| 🤖 **Machine Learning**  | FastAPI, Python                                 |
| 🗄️ **Database**         | PostgreSQL                                      |
| 📊 **Monitoring**        | Prometheus                                      |
| 📈 **Visualization**     | Grafana                                         |
| 🖥️ **Hardware Metrics** | Windows Exporter, LibreHardwareMonitor Exporter |
| 🐳 **Containers**        | Docker, Docker Compose                          |
| ⚙️ **CI/CD**             | Jenkins                                         |
| 🌐 **Deployment**        | Cloudflare Tunnel                               |
| 🔧 **Version Control**   | Git & GitHub                                    |

---

## 📂 Project Structure

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

## 📊 Monitoring Stack

### Prometheus

Prometheus continuously scrapes metrics from:

* Windows Exporter
* LibreHardwareMonitor Exporter
* Flask Metrics Endpoint
* Prometheus Server

**Collected Metrics**

* CPU Usage
* Memory Usage
* Disk Utilization
* Network Throughput
* Temperature
* Fan Speed
* Uptime
* Server Availability

---

### Grafana

Grafana provides interactive dashboards for:

* CPU Monitoring
* Memory Monitoring
* Disk Usage
* Network Monitoring
* Temperature Monitoring
* Historical Performance
* Server Availability

---

## 🖥️ Dashboard Modules

| Module             | Description                       |
| ------------------ | --------------------------------- |
| 🟢 Live Monitoring | Real-time server metrics          |
| 🖥️ Servers        | Connected server status           |
| 🚨 Alerts          | Health alerts and notifications   |
| 📈 Analytics       | Resource utilization analytics    |
| 🤖 Predictions     | Machine learning predictions      |
| 📄 Reports         | Historical monitoring reports     |
| 🐳 Docker          | Docker container monitoring       |
| 📊 Grafana         | Embedded Grafana dashboards       |
| 📜 Logs            | Server logs and monitoring events |
| ⚙️ Settings        | Dashboard configuration           |

---

## 🐳 Docker Deployment

The complete monitoring platform runs with **Docker Compose**.

### Services

| Service           | Port     |
| ----------------- | -------- |
| React Frontend    | **5173** |
| Flask Backend     | **8081** |
| FastAPI ML Engine | **8000** |
| Grafana           | **3000** |
| Prometheus        | **9090** |

### Start the Stack

```bash
docker compose up -d
```

### Stop the Stack

```bash
docker compose down
```

### View Running Containers

```bash
docker ps
```

---

## ⚙️ Jenkins CI/CD Pipeline

Jenkins automates the deployment of the SHMS monitoring platform.

### Pipeline Workflow

```text
GitHub Repository
        │
        ▼
 Jenkins Pipeline
        │
        ▼
 Install Dependencies
        │
        ▼
 Build Docker Images
        │
        ▼
 Docker Compose Deployment
        │
        ▼
 Cloudflare Tunnel
        │
        ▼
 Live SHMS Dashboard
```

### Pipeline Stages

* Repository Checkout
* Dependency Installation
* Frontend Build
* Backend Build
* Docker Image Build
* Docker Compose Deployment
* Health Check Verification
* Deployment Success

---

## 🤖 Machine Learning Prediction

The FastAPI ML Engine predicts server health using collected monitoring metrics.

### API Endpoint

```http
POST /predict/dashboard
```

### Prediction Inputs

* CPU Usage
* Memory Usage
* Disk Usage
* Temperature
* Network Activity
* System Uptime

### Prediction Output

| Status      | Meaning                            |
| ----------- | ---------------------------------- |
| 🟢 Healthy  | Server operating normally          |
| 🟡 Warning  | Resource utilization is increasing |
| 🔴 Critical | Immediate attention required       |

---

## 🌐 Cloudflare Tunnel Automation

A single PowerShell script automates deployment.

### Run Deployment Script

```powershell
powershell -ExecutionPolicy Bypass -File .\start-shms.ps1
```

### Automated Tasks

* Start Docker Containers
* Restart Cloudflare Tunnel
* Generate New Public URL
* Update GitHub Repository Website
* Update GitHub Secrets & Variables
* Create Deployment Commit
* Push Changes to GitHub

---

## 🚀 Quick Start

### Clone Repository

```bash
git clone https://github.com/bandhav100/Server-Health-Monitoring-System.git

cd Server-Health-Monitoring-System
```

### Start Backend

```bash
cd backend

pip install -r requirements.txt

python app.py
```

### Start Frontend

```bash
cd frontend

npm install

npm run dev
```

### Start ML Engine

```bash
cd ml-engine

pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

### Start Monitoring Stack

```bash
docker compose up -d
```

---

## 📈 Monitoring Workflow

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
 FastAPI ML Predictions
        │
        ▼
 Grafana Dashboards
```

---

## 📌 Project Highlights

* Enterprise-style DevOps monitoring platform.
* Real-time Windows server monitoring.
* Prometheus + Grafana observability stack.
* Dockerized deployment with Docker Compose.
* Jenkins CI/CD automation pipeline.
* Machine Learning based server health prediction.
* Cloudflare Tunnel automated public deployment.

---

<div align="center">

### ⭐ If you found this project useful, consider giving it a Star!

**Built to learn real-world DevOps, Monitoring, CI/CD, and Observability through a production-style project.**

</div>
