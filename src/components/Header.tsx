import { useState } from "react";
import {
  Menu,
  Search,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  UserRound,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode(!darkMode);
  };

  const logout = () => {
    localStorage.removeItem("loggedIn");
    navigate("/login");
  };

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-topbar px-4 md:px-6">
      {/* Sidebar Toggle */}
      <button
        type="button"
        className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
      >
        <Menu className="h-6 w-6" />
      </button>

      <h1 className="text-lg font-semibold text-foreground md:text-xl">
        Server Health Monitoring System
      </h1>

      {/* Search */}
      <div className="ml-auto hidden max-w-md flex-1 items-center lg:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="text"
            placeholder="Search servers, metrics..."
            className="w-full rounded-lg border border-border bg-background/60 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 lg:ml-4">
        {/* Notifications */}
        <button
          onClick={() => navigate("/alerts")}
          className="relative rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <Bell className="h-5 w-5" />

          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-semibold text-white">
            5
          </span>
        </button>

        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          {darkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary">
              <UserRound className="h-5 w-5" />
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-foreground">
                Sai Abhiram
              </p>

              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>

            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-border bg-card shadow-xl">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}