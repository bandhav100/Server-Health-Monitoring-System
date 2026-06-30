# Sprint 1 – Monitoring Environment Setup

## Sprint Duration

**15-06-2026 to 28-06-2026**

## Task

Configure the monitoring environment to collect and visualize system health metrics for the Server Health Monitoring System.

## Work Completed

* Installed and configured **Prometheus** on a Windows machine.
* Explored the functionality of **Windows Exporter** and its role in exposing system metrics (similar to Node Exporter on Linux).
* Verified that Prometheus was successfully scraping metrics through the web interface at **http://localhost:9090**.
* Prepared the monitoring infrastructure for integration with **Grafana** dashboards.
* Verified the end-to-end flow of metric collection between the exporter and Prometheus.

## Tools & Technologies

* Prometheus
* Windows Exporter
* Grafana (integration preparation)
* Git & GitHub

## Outcome

Successfully established the initial monitoring setup for the DevOps project. The monitoring pipeline is ready for dashboard creation and future enhancements, enabling real-time system health visualization and analysis.

## Monitoring Architecture

**Windows Exporter → Prometheus → Grafana**
