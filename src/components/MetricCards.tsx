import { ResponsiveContainer, LineChart, Line } from "recharts"
import { Cpu, MemoryStick, HardDrive, Network, ArrowUp, ArrowDown } from "lucide-react"
import { Card } from "./Card"
import { metricCards } from "../lib/data"

const colorMap = {
  blue: { text: "text-blue", bg: "bg-blue", stroke: "#3b82f6", soft: "bg-blue/15" },
  green: { text: "text-green", bg: "bg-green", stroke: "#22c55e", soft: "bg-green/15" },
  orange: { text: "text-orange", bg: "bg-orange", stroke: "#f97316", soft: "bg-orange/15" },
  purple: { text: "text-purple", bg: "bg-purple", stroke: "#a855f7", soft: "bg-purple/15" },
} as const

const iconMap = {
  cpu: Cpu,
  memory: MemoryStick,
  disk: HardDrive,
  network: Network,
} as const

export function MetricCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metricCards.map((m) => {
        const c = colorMap[m.color]
        const Icon = iconMap[m.icon]
        const TrendIcon = m.trend === "up" ? ArrowUp : ArrowDown
        const trendColor = m.trend === "up" ? "text-green" : "text-red"
        return (
          <Card key={m.key} className="p-5">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.bg} text-white`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{m.title}</p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {m.value}
                  {m.unit === "%" ? (
                    <span>%</span>
                  ) : (
                    <span className="ml-1 text-base font-medium text-muted-foreground">{m.unit}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                <span className="font-medium">{m.change}</span>
                <span className="text-muted-foreground">from yesterday</span>
              </div>
              <div className="h-9 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={m.data}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={c.stroke}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
