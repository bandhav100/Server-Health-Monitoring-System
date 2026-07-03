// Deterministic pseudo-random series generator so charts look organic but stable.
function series(seed: number, count: number, base: number, amp: number, drift = 0) {
  const out: number[] = []
  let x = seed
  for (let i = 0; i < count; i++) {
    x = (x * 9301 + 49297) % 233280
    const r = x / 233280
    const value = base + Math.sin(i / 2.2) * amp * 0.5 + (r - 0.5) * amp + drift * i
    out.push(Math.max(0, Math.round(value * 10) / 10))
  }
  return out
}

export const timeLabelsHour = ["09:30", "09:40", "09:50", "10:00", "10:10", "10:20"]
export const timeLabelsNet = ["09:30", "09:45", "10:00", "10:15"]

export const cpuBigSeries = series(11, 40, 50, 30).map((v, i) => ({ i, value: v }))
export const memBigSeries = series(27, 40, 62, 22).map((v, i) => ({ i, value: v }))
export const netBigSeries = series(53, 40, 110, 60).map((v, i) => ({ i, value: v }))

// Small sparklines for the top metric cards
export const cpuSpark = series(7, 24, 40, 18).map((v, i) => ({ i, value: v }))
export const memSpark = series(13, 24, 60, 16).map((v, i) => ({ i, value: v }))
export const diskSpark = series(19, 24, 55, 14).map((v, i) => ({ i, value: v }))
export const netSpark = series(31, 24, 100, 40).map((v, i) => ({ i, value: v }))
export const uptimeSpark = series(41, 30, 55, 30, 0.4).map((v, i) => ({ i, value: v }))

export const metricCards = [
  {
    key: "cpu",
    title: "CPU Usage",
    value: "42",
    unit: "%",
    change: "8%",
    trend: "up" as const,
    color: "blue" as const,
    icon: "cpu" as const,
    data: cpuSpark,
  },
  {
    key: "memory",
    title: "Memory Usage",
    value: "68",
    unit: "%",
    change: "5%",
    trend: "up" as const,
    color: "green" as const,
    icon: "memory" as const,
    data: memSpark,
  },
  {
    key: "disk",
    title: "Disk Usage",
    value: "55",
    unit: "%",
    change: "3%",
    trend: "down" as const,
    color: "orange" as const,
    icon: "disk" as const,
    data: diskSpark,
  },
  {
    key: "network",
    title: "Network Traffic",
    value: "125",
    unit: "Mbps",
    change: "15%",
    trend: "up" as const,
    color: "purple" as const,
    icon: "network" as const,
    data: netSpark,
  },
]

export type Severity = "Critical" | "Warning" | "Info"

export const activeAlerts: {
  label: string
  server: string
  time: string
  severity: Severity
}[] = [
  { label: "High CPU Usage", server: "Server-01", time: "10:28:15", severity: "Critical" },
  { label: "Memory Usage > 80%", server: "Server-02", time: "10:25:10", severity: "Warning" },
  { label: "Disk Usage > 90%", server: "Server-03", time: "10:20:05", severity: "Warning" },
  { label: "All Systems Normal", server: "Server-04", time: "10:15:20", severity: "Info" },
]

export const serverStatus = [
  { server: "Server-01", status: "Online", cpu: "42%", memory: "68%", disk: "55%", uptime: "7d 14h" },
  { server: "Server-02", status: "Online", cpu: "37%", memory: "72%", disk: "48%", uptime: "5d 09h" },
  { server: "Server-03", status: "Online", cpu: "55%", memory: "65%", disk: "91%", uptime: "3d 21h" },
  { server: "Server-04", status: "Online", cpu: "29%", memory: "45%", disk: "33%", uptime: "10d 05h" },
]

export const runningServices = ["Prometheus", "Grafana", "Node Exporter", "Alertmanager"]

export const systemLogs: { timestamp: string; server: string; event: string; status: Severity }[] = [
  { timestamp: "May 25, 2025 10:30:15", server: "Server-01", event: "CPU usage crossed 80%", status: "Critical" },
  { timestamp: "May 25, 2025 10:28:45", server: "Server-02", event: "Memory usage crossed 75%", status: "Warning" },
  { timestamp: "May 25, 2025 10:27:30", server: "Server-03", event: "Disk usage crossed 90%", status: "Warning" },
  { timestamp: "May 25, 2025 10:25:10", server: "Server-01", event: "User login successful", status: "Info" },
  { timestamp: "May 25, 2025 10:20:05", server: "Server-04", event: "System backup completed", status: "Info" },
]

export const recentAlerts: { title: string; desc: string; time: string; severity: Severity }[] = [
  {
    title: "High CPU Usage",
    desc: "CPU usage is above 80% on Server-01",
    time: "10:28 AM",
    severity: "Critical",
  },
  {
    title: "Memory Threshold Crossed",
    desc: "Memory usage is above 75% on Server-02",
    time: "10:25 AM",
    severity: "Warning",
  },
  {
    title: "Disk Space Warning",
    desc: "Disk usage is above 90% on Server-03",
    time: "10:20 AM",
    severity: "Warning",
  },
]

export const todaysStats = [
  { label: "Total Alerts", value: "12" },
  { label: "Resolved Alerts", value: "9" },
  { label: "Avg. Response Time", value: "120ms" },
  { label: "Data Points Collected", value: "1.2M" },
]

export const navItems = [
  { label: "Dashboard", icon: "dashboard" as const, active: true },
  { label: "Live Monitoring", icon: "activity" as const },
  { label: "Servers", icon: "server" as const },
  { label: "Alerts", icon: "bell" as const, badge: 3 },
  { label: "Performance", icon: "gauge" as const },
  { label: "Reports", icon: "report" as const },
  { label: "Settings", icon: "settings" as const },
  { label: "Users", icon: "users" as const },
]
