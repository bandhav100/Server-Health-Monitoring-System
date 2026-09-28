# 🚀 Jenkins CI/CD Pipeline — SHMS

This directory contains the Jenkins Continuous Integration and Continuous Deployment (CI/CD) configuration for the **Server Health Monitoring System (SHMS)**.

The Jenkins pipeline automates backend validation, testing, Docker verification, and deployment checks whenever code is pushed to the repository.

---

## 📌 Pipeline Overview

The SHMS pipeline performs the following stages:

| Stage                        | Description                                                    |
| ---------------------------- | -------------------------------------------------------------- |
| 🧹 Clean Workspace           | Removes previous Jenkins workspace files.                      |
| 📥 Checkout Repository       | Clones the SHMS GitHub repository.                             |
| ✅ Verify Repository          | Displays current branch, latest commit, and project structure. |
| 🐍 Backend Validation        | Checks `backend/` folder and required Flask files.             |
| 📦 Install Dependencies      | Installs Python packages from `requirements.txt`.              |
| ❤️ Flask Health Check        | Verifies the `/api/health` endpoint.                           |
| 🧪 Run Tests                 | Executes backend test cases.                                   |
| 🐳 Docker Verification       | Checks Docker CLI, Docker Engine, and Docker Compose.          |
| 🚀 Docker Compose Validation | Validates `docker-compose.yml` configuration.                  |

---

## 🏗️ Technology Used

* Jenkins LTS
* Git & GitHub
* Python 3.13
* Flask
* Docker Desktop
* Docker Compose

---

## 📂 Files in this Directory

| File          | Purpose                        |
| ------------- | ------------------------------ |
| `Jenkinsfile` | Main Jenkins Pipeline as Code. |
| `plugins.txt` | Required Jenkins plugins.      |
| `jenkins.env` | Jenkins environment variables. |

---

## ▶️ Running the Pipeline

1. Open Jenkins Dashboard.
2. Select **SHMS_pipeline**.
3. Click **Build with Parameters**.
4. Choose the GitHub branch.
5. Start the pipeline and monitor each stage.

---

## 📊 Expected Result

A successful build verifies:

* Backend health endpoint is working.
* All backend tests pass.
* Docker is installed and accessible.
* Docker Compose configuration is valid.

---

## 👨‍💻 Project

**Server Health Monitoring System (SHMS)**

Enterprise-grade infrastructure monitoring platform built with **React, Spring Boot, FastAPI, PostgreSQL, Prometheus, Grafana, Docker, Cloudflare Tunnel, Tailscale, and Jenkins CI/CD**.
