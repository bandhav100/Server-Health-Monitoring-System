export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  statusCode: number;
}

export interface Server {
  id: number;
  name: string;
  operating_system: string | null;
  tailscale_ip: string | null;
  prometheus_instance: string | null;
  prometheus_job: string | null;
  grafana_uid: string | null;
  location: string | null;
  status: string | null;
  operatingSystem: string | null;
  tailscaleIp: string | null;
  prometheusInstance: string | null;
  cpu: number | null;
  ram: number | null;
  disk: number | null;
  network: number | null;
  uptime: number | null;
  lastSeen: string | null;
  healthScore: number | null;
  created_at: string | null;
}

export interface MetricHistoryPoint {
  value: number | null;
  timestamp: string;
}

export interface NetworkHistoryPoint {
  in: number | null;
  out: number | null;
  timestamp: string;
}

export interface LiveMetrics {
  server_id: number;
  server_name: string;
  serverName: string;
  ipAddress: string | null;
  instance: string | null;
  cpu: number | null;
  ram: number | null;
  disk: number | null;
  network: number | null;
  networkReceive: number | null;
  networkSend: number | null;
  temperature: number | null;
  uptime: number | null;
  processCount: number | null;
  status: string | null;
  lastUpdated: string;
  timestamp: string;
}

export interface Notification {
  id: number;
  admin_id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string | null;
}

export interface NotificationsResponse {
  total: number;
  unread_count: number;
  limit: number;
  offset: number;
  notifications: Notification[];
}
