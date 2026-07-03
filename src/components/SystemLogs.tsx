import { Card } from "./Card"
import { systemLogs, type Severity } from "../lib/data"

const statusColor: Record<Severity, string> = {
  Critical: "text-red",
  Warning: "text-yellow",
  Info: "text-blue",
}

export function SystemLogs() {
  return (
    <Card className="p-5">
      <p className="text-base font-semibold text-foreground">System Logs</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="pb-3 font-medium">Timestamp</th>
              <th className="pb-3 font-medium">Server Name</th>
              <th className="pb-3 font-medium">Event</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {systemLogs.map((log, idx) => (
              <tr key={idx} className="border-t border-border">
                <td className="py-3 text-muted-foreground">{log.timestamp}</td>
                <td className="py-3 text-foreground">{log.server}</td>
                <td className="py-3 text-foreground">{log.event}</td>
                <td className={`py-3 font-medium ${statusColor[log.status]}`}>{log.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
