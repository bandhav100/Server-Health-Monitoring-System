# System Architecture Design

## Project: Multi-VM Server Health Monitoring System

The system contains three virtual machines:

- VM-1: Web Server
- VM-2: Application Server
- VM-3: Database Server

Each VM runs a Python metrics collector using psutil. The collector gathers CPU usage, memory usage, disk usage, and uptime.

The collected metrics are sent to a centralized Flask REST API. The Flask API stores the data in the centralized database. The dashboard reads the data from the backend and displays server health. The ML engine uses historical data to predict future resource issues.

## Architecture Flow

VM-1 Web Server  
VM-2 Application Server  
VM-3 Database Server  
↓  
Python Metrics Collector  
↓  
Flask REST API Receiver  
↓  
Centralized Database  
↓  
Dashboard and ML Prediction Engine  

## My Role

As the Lead Developer / Architect, my role is to design the overall system flow, define how the virtual machines communicate with the backend, and prepare the architecture blueprint for the team.
