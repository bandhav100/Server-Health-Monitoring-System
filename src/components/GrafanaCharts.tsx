import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts"
import { cpuBigSeries, memBigSeries, netBigSeries } from "../lib/data"

const axisStyle = { fontSize: 10, fill: "#8b949e" }
const gridStroke = "#21262d"

function PanelBox({
  title,
  legend,
  legendColor,
  children,
}: {
  title: string
  legend: string
  legendColor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col rounded-md border border-panel-border bg-panel-inner p-3">
      <p className="mb-2 text-center text-xs font-medium text-slate-300">{title}</p>
      <div className="h-40 w-full">{children}</div>
      <div className="mt-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: legendColor }} />
        <span className="text-[11px] text-slate-400">{legend}</span>
      </div>
    </div>
  )
}

export function CpuAreaChart() {
  return (
    <PanelBox title="CPU Usage (%)" legend="CPU Usage" legendColor="#22c55e">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={cpuBigSeries} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="cpuFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="i"
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: gridStroke }}
            ticks={[0, 8, 16, 24, 32, 39]}
            tickFormatter={(_, idx) => ["09:30", "09:40", "09:50", "10:00", "10:10", "10:20"][idx] ?? ""}
          />
          <YAxis
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#22c55e"
            strokeWidth={1.5}
            fill="url(#cpuFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </PanelBox>
  )
}

export function MemoryAreaChart() {
  return (
    <PanelBox title="Memory Usage (%)" legend="Memory Usage" legendColor="#eab308">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={memBigSeries} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="memFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eab308" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="i"
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: gridStroke }}
            ticks={[0, 8, 16, 24, 32, 39]}
            tickFormatter={(_, idx) => ["09:30", "09:40", "09:50", "10:00", "10:10", "10:20"][idx] ?? ""}
          />
          <YAxis
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#eab308"
            strokeWidth={1.5}
            fill="url(#memFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </PanelBox>
  )
}

export function DiskGauge() {
  const data = [{ name: "disk", value: 55, fill: "#22c55e" }]
  return (
    <PanelBox title="Disk Usage (%)" legend="Disk Usage" legendColor="#22c55e">
      <div className="relative h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={180}
            endAngle={0}
            cy="70%"
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: "#21262d" }} dataKey="value" cornerRadius={2} isAnimationActive={false} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-x-0 bottom-6 text-center">
          <span className="text-2xl font-bold text-green">55%</span>
        </div>
      </div>
    </PanelBox>
  )
}

export function NetworkLineChart() {
  return (
    <PanelBox title="Network Traffic (Mbps)" legend="Network Traffic" legendColor="#3b82f6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={netBigSeries} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="i"
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: gridStroke }}
            ticks={[0, 13, 26, 39]}
            tickFormatter={(_, idx) => ["09:30", "09:45", "10:00", "10:15"][idx] ?? ""}
          />
          <YAxis
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            domain={[0, 200]}
            ticks={[0, 50, 100, 150, 200]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </PanelBox>
  )
}
export function GrafanaCharts() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <CpuAreaChart />
      <MemoryAreaChart />
      <DiskGauge />
      <NetworkLineChart />
    </div>
  );
}