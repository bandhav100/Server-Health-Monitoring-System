import { Server, Users, HeartPulse } from "lucide-react"
import { Card } from "./Card"
import { runningServices, todaysStats } from "../lib/data"

export function RightColumn() {
  return (
    <div className="flex flex-col gap-4">
      {/* Connected Servers */}
      <Card className="p-5">
        <p className="text-sm font-semibold text-foreground">Connected Servers</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue/15 text-blue">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">4</p>
            <p className="text-xs text-green">All systems operational</p>
          </div>
        </div>
      </Card>

      {/* Active Users */}
      <Card className="p-5">
        <p className="text-sm font-semibold text-foreground">Active Users</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green/15 text-green">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">7</p>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </div>
        </div>
      </Card>

      {/* System Health Score */}
      <Card className="p-5">
        <p className="text-sm font-semibold text-foreground">System Health Score</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red/15 text-red">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green">92%</p>
            <p className="text-xs text-muted-foreground">Excellent</p>
          </div>
        </div>
      </Card>

      {/* Running Services */}
      <Card className="p-5">
        <p className="text-sm font-semibold text-foreground">Running Services</p>
        <ul className="mt-3 space-y-2.5">
          {runningServices.map((svc) => (
            <li key={svc} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{svc}</span>
              <span className="flex items-center gap-1.5 text-green">
                <span className="h-1.5 w-1.5 rounded-full bg-green" />
                Running
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Today's Statistics */}
      <Card className="p-5">
        <p className="text-sm font-semibold text-foreground">Today&apos;s Statistics</p>
        <ul className="mt-3 space-y-3">
          {todaysStats.map((stat) => (
            <li key={stat.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{stat.label}</span>
              <span className="font-semibold text-foreground">{stat.value}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
