# Multi-VM Ingestion Path Blueprint

## Data Flow

1. VM-1, VM-2, and VM-3 run monitoring scripts.
2. Each script collects CPU, memory, disk, and uptime details.
3. Each VM sends JSON data to the Flask API.
4. Flask API receives the payload.
5. Flask validates the server_id.
6. Data is stored in the database.
7. Dashboard fetches data for visualization.
8. ML engine uses stored data for prediction.

## Sample JSON Payload

{
  "server_id": "VM-1",
  "cpu_usage": 65.5,
  "memory_usage": 58.2,
  "disk_usage": 70.1,
  "uptime": "5 hours",
  "timestamp": "2026-06-16 18:30:00"
}

## Interface Mapping

VM-1 -> Flask API  
VM-2 -> Flask API  
VM-3 -> Flask API  
Flask API -> Database  
Database -> Dashboard  
Database -> ML Engine  


