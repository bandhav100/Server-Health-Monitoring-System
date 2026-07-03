import {
  LayoutDashboard,
  Activity,
  Server,
  Bell,
  Gauge,
  FileText,
  Settings,
  Users,
  Boxes,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navItems = [
  {
    label: "Dashboard",
    icon: "dashboard",
    path: "/dashboard",
  },
  {
    label: "Live Monitoring",
    icon: "activity",
    path: "/monitoring",
  },
  {
    label: "Servers",
    icon: "server",
    path: "/servers",
  },
  {
    label: "Alerts",
    icon: "bell",
    path: "/alerts",
    badge: 3,
  },
  {
    label: "Performance",
    icon: "gauge",
    path: "/dashboard",
  },
  {
    label: "Reports",
    icon: "report",
    path: "/reports",
  },
  {
    label: "Settings",
    icon: "settings",
    path: "/settings",
  },
  {
    label: "Users",
    icon: "users",
    path: "/users",
  },
];

const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  activity: Activity,
  server: Server,
  bell: Bell,
  gauge: Gauge,
  report: FileText,
  settings: Settings,
  users: Users,
};

export function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Boxes className="h-6 w-6" />
        </div>

        <span className="text-xl font-bold tracking-wide text-foreground">
          SHMS
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-foreground"
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />

              <span className="flex-1">{item.label}</span>

              {item.badge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red px-1.5 text-xs font-semibold text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-slate-200">
            <UserRound className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              System Administrator
            </p>

            <p className="truncate text-xs text-muted-foreground">
              admin@shms.local
            </p>

            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}