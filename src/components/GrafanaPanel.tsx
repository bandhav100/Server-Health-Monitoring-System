import {
  Search,
  Plus,
  LayoutGrid,
  Clock,
  RefreshCw,
  MessageSquare,
  Star,
  Share2,
  ChevronDown,
  BarChart3,
  PanelsTopLeft,
  Settings,
  Bell,
  Compass,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
} from "lucide-react"
import { ResponsiveContainer, AreaChart, Area } from "recharts"
import {
  CpuAreaChart,
  MemoryAreaChart,
  DiskGauge,
  NetworkLineChart,
} from "./GrafanaCharts"
import { activeAlerts, serverStatus, uptimeSpark, type Severity } from "../lib/data"

const severityBadge: Record<Severity, string> = {
  Critical: "bg-red text-white",
  Warning: "bg-yellow text-black",
  Info: "bg-blue text-white",
}

const severityIcon: Record<Severity, { Icon: typeof AlertCircle; color: string }> = {
  Critical: { Icon: AlertCircle, color: "text-red" },
  Warning: { Icon: AlertTriangle, color: "text-yellow" },
  Info: { Icon: Info, color: "text-blue" },
}

function ToolbarButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded border border-panel-border bg-panel-inner px-2 py-1 text-xs text-slate-300 hover:bg-white/5"
    >
      {children}
    </button>
  )
}

export function GrafanaPanel() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-panel-border bg-panel">
      {/* Grafana top bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-panel-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange text-sm font-bold text-white">
            G
          </span>
          <span className="font-semibold text-slate-100">Grafana</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <LayoutGrid className="h-4 w-4" />
          <span>General</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200">Server Health Dashboard</span>
          <Star className="ml-1 h-4 w-4 text-slate-500" />
          <Share2 className="h-4 w-4 text-slate-500" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ToolbarButton>
            <BarChart3 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton>
            <PanelsTopLeft className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton>
            <Settings className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton>
            <Clock className="h-3.5 w-3.5" />
            <span>Last 1 hour</span>
            <ChevronDown className="h-3 w-3" />
          </ToolbarButton>
          <ToolbarButton>
            <Search className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton>
            <RefreshCw className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton>
            <MessageSquare className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      </div>

      <div className="flex">
        {/* Grafana vertical icon rail */}
        <div className="hidden w-12 shrink-0 flex-col items-center gap-4 border-r border-panel-border py-4 text-slate-500 md:flex">
          <Search className="h-4 w-4 hover:text-slate-200" />
          <Plus className="h-4 w-4 hover:text-slate-200" />
          <LayoutGrid className="h-4 w-4 hover:text-slate-200" />
          <Compass className="h-4 w-4 hover:text-slate-200" />
          <ShieldCheck className="h-4 w-4 hover:text-slate-200" />
          <Bell className="h-4 w-4 hover:text-slate-200" />
          <ShieldCheck className="h-4 w-4 hover:text-slate-200" />
          <span className="mt-auto flex h-6 w-6 items-center justify-center rounded-full bg-orange text-xs font-bold text-white">
            G
          </span>
        </div>

        {/* Panel content */}
        <div className="min-w-0 flex-1 p-4">
          {/* Top charts row */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <CpuAreaChart />
            <MemoryAreaChart />
            <DiskGauge />
            <NetworkLineChart />
          </div>

          {/* Bottom row: uptime + alerts + server status */}
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {/* System uptime */}
            <div className="flex flex-col rounded-md border border-panel-border bg-panel-inner p-4">
              <p className="text-center text-sm font-medium text-slate-300">System Uptime</p>
              <p className="mt-3 text-center text-3xl font-bold text-green">7d 14h 32m</p>
              <div className="mt-3 h-20 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={uptimeSpark} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="uptimeFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#22c55e"
                      strokeWidth={1.5}
                      fill="url(#uptimeFill)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Active alerts */}
            <div className="rounded-md border border-panel-border bg-panel-inner p-4">
              <p className="mb-3 text-sm font-semibold text-slate-200">Active Alerts</p>
              <ul className="space-y-2.5">
                {activeAlerts.map((a) => {
                  const { Icon, color } = severityIcon[a.severity]
                  return (
                    <li key={a.label} className="flex items-center gap-3 text-sm">
                      <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                      <span className="flex-1 text-slate-200">{a.label}</span>
                      <span className="text-xs text-slate-500">{a.server}</span>
                      <span className="text-xs text-slate-500">{a.time}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-semibold ${severityBadge[a.severity]}`}
                      >
                        {a.severity}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Server status */}
            <div className="rounded-md border border-panel-border bg-panel-inner p-4">
              <p className="mb-3 text-sm font-semibold text-slate-200">Server Status</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="pb-2 font-medium">Server</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">CPU</th>
                      <th className="pb-2 font-medium">Memory</th>
                      <th className="pb-2 font-medium">Disk</th>
                      <th className="pb-2 font-medium">Uptime</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {serverStatus.map((s) => (
                      <tr key={s.server} className="border-t border-panel-border/60">
                        <td className="py-2 font-medium text-slate-200">{s.server}</td>
                        <td className="py-2">
                          <span className="inline-flex items-center rounded bg-green/15 px-2 py-0.5 text-[11px] font-medium text-green">
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2">{s.cpu}</td>
                        <td className="py-2">{s.memory}</td>
                        <td className="py-2">{s.disk}</td>
                        <td className="py-2">{s.uptime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
