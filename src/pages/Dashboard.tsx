import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { MetricCards } from "../components/MetricCards";
import { GrafanaPanel } from "../components/GrafanaPanel";
import { GrafanaCharts } from "../components/GrafanaCharts";
import { RecentAlerts } from "../components/RecentAlerts";
import { RightColumn } from "../components/RightColumn";
import { SystemLogs } from "../components/SystemLogs";
import { Footer } from "../components/Footer";

export default function Dashboard() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <MetricCards />
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <GrafanaPanel />
                <div className="mt-6">
                  <GrafanaCharts />
                </div>
              </div>
              <RightColumn />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RecentAlerts />
              <SystemLogs />
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
