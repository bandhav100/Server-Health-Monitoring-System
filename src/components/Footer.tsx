import { Atom, Flame, Container } from "lucide-react"

const builtWith = [
  { label: "React", Icon: Atom, color: "text-[#61dafb]" },
  { label: "Grafana", Icon: Flame, color: "text-orange" },
  { label: "Prometheus", Icon: Flame, color: "text-orange" },
  { label: "Python", Icon: Atom, color: "text-yellow" },
  { label: "Flask", Icon: Flame, color: "text-slate-300" },
  { label: "Docker", Icon: Container, color: "text-blue" },
]

export function Footer() {
  return (
    <footer className="mt-6 border-t border-border pt-5">
      <div className="flex flex-col items-center gap-4 pb-6 md:flex-row md:justify-between">
        <p className="text-xs text-muted-foreground">
          © 2025 Server Health Monitoring System. All rights reserved.
        </p>
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Built With</span>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {builtWith.map(({ label, Icon, color }) => (
              <span key={label} className="flex items-center gap-1.5 text-sm text-foreground">
                <Icon className={`h-4 w-4 ${color}`} />
                {label}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-sm text-foreground">
              <span className="rounded bg-purple px-1.5 py-0.5 text-[10px] font-bold text-white">API</span>
              REST API
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
