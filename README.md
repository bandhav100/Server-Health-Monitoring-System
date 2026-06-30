# Server-Health-Monitoring-System
# Team Epsilon
# 🚀 Server Health Monitoring System

A DevOps-based Server Health Monitoring System that securely monitors multiple servers in real time using **Tailscale**, **Windows Exporter**, **Prometheus**, **Grafana**, **Flask**, **MySQL**, and **Machine Learning**.

---

# 📖 Project Overview

The Server Health Monitoring System is designed to monitor multiple servers connected over a secure private network using Tailscale. System metrics are collected using Windows Exporter, stored in Prometheus, processed by a Flask backend, visualized through Grafana and a custom web dashboard, and analyzed using Machine Learning for predictive monitoring.

The project follows DevOps practices and is divided into multiple modules developed collaboratively by different team members.

---

# 🎯 Objectives

- Monitor multiple servers in real time.
- Secure communication using Tailscale VPN.
- Collect system health metrics.
- Store monitoring data.
- Visualize metrics.
- Predict future resource usage using Machine Learning.
- Generate alerts for abnormal system behavior.

---

# 🛠 Technology Stack

| Layer | Technology |
|---------|------------|
| VPN | Tailscale |
| Metrics Collector | Windows Exporter |
| Monitoring | Prometheus |
| Visualization | Grafana |
| Backend | Flask (Python) |
| Database | MySQL |
| Frontend | HTML, CSS, JavaScript |
| Machine Learning | Scikit-Learn |
| Version Control | Git & GitHub |

---

# 🏗 System Architecture

```
Servers (VM-1, VM-2, VM-3)
          │
          ▼
Windows Exporter
          │
          ▼
Tailscale Secure Network
          │
          ▼
Prometheus
          │
     PromQL Queries
          │
          ▼
Flask Backend API
      │          │
      ▼          ▼
MySQL Database   ML Engine
      │          │
      └────┬─────┘
           ▼
Frontend Dashboard
           │
           ▼
Alert System
```

---

# 📊 Metrics Monitored

The system continuously monitors the following metrics:

- CPU Usage %
- RAM Usage %
- Disk Usage %
- Network Usage
- System Uptime
- Running Processes Count
- Available Memory
- Swap Usage
- Disk Read Rate
- Disk Write Rate
- Network Sent
- Network Received
- CPU Temperature (if available)
- Top CPU Process
- Top RAM Process

---

# 📁 Project Structure

```
Server-Health-Monitoring-System/

│
├── architecture/
│   ├── system_architecture.md
│   ├── database_schema.md
│   └── ingestion_flow.md
│
├── backend/
│
├── frontend/
│
├── ml/
│
├── monitoring/
│
├── database/
│
├── docs/
│
├── screenshots/
│
└── README.md
```

---

# 🔄 Data Flow

```
Windows Exporter

        │

        ▼

Prometheus

        │

     PromQL

        │

        ▼

Flask Backend

        │

   ┌────┴────┐

   ▼         ▼

 MySQL      ML Model

   │         │

   ▼         ▼

 Dashboard  Predictions

        │

        ▼

     Alerts
```

---

# 🗄 Database Design

### Tables

- servers
- server_metrics
- alerts
- users
- ml_predictions
- notification_logs

---

# 🌐 Backend APIs

| API | Method | Description |
|------|--------|-------------|
| /api/health | GET | Backend Health Check |
| /api/servers | GET | List all servers |
| /api/metrics/{id} | GET | Server metrics |
| /api/cpu/{id} | GET | CPU Usage |
| /api/memory/{id} | GET | Memory Usage |
| /api/disk/{id} | GET | Disk Usage |
| /api/network/{id} | GET | Network Statistics |
| /api/processes/{id} | GET | Running Processes |
| /api/alerts | GET | Alert Information |
| /api/predictions/{id} | GET | ML Prediction |

---

# 📈 Monitoring Workflow

```
Server

↓

Windows Exporter

↓

Prometheus

↓

Flask API

↓

MySQL

↓

Frontend Dashboard

↓

Machine Learning

↓

Alert System
```

---

# 👥 Team Roles

| Member          | Role                          |
|-----------------|-------------------------------|
| Sai Abhiram     | Scrum MAster                  |
| Vinay Charan    | Lead Developer/Architect      |
| Bandhav         | DevOps Engineer               |
| Manjunath       | Backend Developer             |
| Navadeep        | ML Engineer                   |
| Abhiram Krishna | Frontend Developer            |
| Nihal Raj       | QA/Test Engineer              |
| Prem Kumar      | Data Collection/Documentation |


---

# 📌 Sprint 1 Deliverables

- System Architecture Design
- Multi-VM Ingestion Blueprint
- Database Schema
- Network Data Flow Design
- GitHub Documentation

---

# 🚀 Future Enhancements

- Docker Deployment
- Kubernetes Integration
- Email Notifications
- Slack Notifications
- Telegram Alerts
- Predictive Failure Analysis
- Auto Scaling
- Role-Based Authentication

---

# 📜 License

This project is developed for academic and educational purposes as part of a DevOps course.

---

# 👨‍💻 Developed By

**Server Health Monitoring System Team**

Academic Project — 2026
