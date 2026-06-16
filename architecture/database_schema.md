# Database Schema Design

## Table: servers

| Field | Type | Description |
|---|---|---|
| server_id | VARCHAR | Unique ID of server like VM-1, VM-2, VM-3 |
| server_name | VARCHAR | Name of server |
| server_type | VARCHAR | Web, App, or Database server |
| ip_address | VARCHAR | IP address of the VM |

## Table: server_metrics

| Field | Type | Description |
|---|---|---|
| id | INT | Primary key |
| server_id | VARCHAR | Identifies which VM sent the data |
| cpu_usage | FLOAT | CPU usage percentage |
| memory_usage | FLOAT | Memory usage percentage |
| disk_usage | FLOAT | Disk usage percentage |
| uptime | VARCHAR | Server running time |
| timestamp | DATETIME | Time when data was collected |

## Importance of server_id

The server_id field is important because it prevents data from VM-1, VM-2, and VM-3 from mixing together.# Database Schema Design


