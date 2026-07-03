import { AlertCircle, AlertTriangle, ArrowRight } from "lucide-react"
import { Card } from "./Card"
import { recentAlerts, type Severity } from "../lib/data"

const iconFor: Record<Severity, { Icon: typeof AlertCircle; wrap: string; color: string }> = {
  Critical: { Icon: AlertCircle, wrap: "bg-red/15", color: "text-red" },
  Warning: { Icon: AlertTriangle, wrap: "bg-yellow/15", color: "text-yellow" },
  Info: { Icon: AlertCircle, wrap: "bg-blue/15", color: "text-blue" },
}

export function RecentAlerts() {
  return (
    <Card className="flex flex-col p-5">
      <p className="text-base font-semibold text-foreground">Recent Alerts</p>
      <ul className="mt-4 flex-1 space-y-4">
        {recentAlerts.map((alert) => {
          const { Icon, wrap, color } = iconFor[alert.severity]
          return (
            <li key={alert.title} className="flex items-start gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${wrap} ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.desc}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{alert.time}</span>
            </li>
          )
        })}
      </ul>
      <a
        href="#"
        className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        View all alerts
        <ArrowRight className="h-4 w-4" />
      </a>
    </Card>
  )
}
