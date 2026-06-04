"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Search, Filter } from "lucide-react";
import { Card, CardHeader, Button } from "@/components/ui/shared";
import { formatDate, formatTime } from "@/lib/utils";

export default function AuditLogsClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/super-admin/audit-logs?limit=100");
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actor?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading audit logs...</div>;
  }

  const getActionColor = (action: string) => {
    switch(action) {
      case "CREATE": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "UPDATE": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "DELETE": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "LOGIN": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-primary" />
            Global Audit Logs
          </h2>
          <p className="text-muted-foreground mt-1">
            Monitor activity across all vendors on the platform
          </p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-border/50 bg-muted/20">
          <h3 className="text-lg font-medium">Platform Activity</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search logs..."
                className="flex h-10 w-full rounded-md border border-input bg-background/50 pl-8 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="md" className="shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                  <th className="px-6 py-4 font-medium">Vendor</th>
                  <th className="px-6 py-4 font-medium">Actor</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{formatDate(log.createdAt)}</div>
                        <div className="text-xs text-muted-foreground">{formatTime(log.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {log.vendor?.name || "System"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{log.actor?.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{log.actor?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {log.description}
                        <div className="text-xs mt-1">
                           <span className="text-muted-foreground/60">{log.entityType} ({log.entityId})</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
