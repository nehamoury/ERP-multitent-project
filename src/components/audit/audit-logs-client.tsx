// src/components/audit/audit-logs-client.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { timeAgo, getRoleBadge } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string; action: string; entityType: string; entityId: string;
  description: string; createdAt: string; ipAddress: string | null;
  oldValues: any; newValues: any;
  actor: { id: string; name: string; employeeId: string; role: string };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  LOGIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  LOGOUT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  CHECKIN: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  CHECKOUT: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  APPROVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECT: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  EXPORT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
};

export default function AuditLogsClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (entityType) params.set("entityType", entityType);
      if (action) params.set("action", action);
      const res = await fetch(`/api/audit-logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch { }
    finally { setLoading(false); }
  }, [page, entityType, action]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 bg-card border border-border rounded-xl p-4">
        <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-sm bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">All Entities</option>
          {["User","Attendance","Leave"].map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-sm bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">All Actions</option>
          {["CREATE","UPDATE","DELETE","LOGIN","LOGOUT","CHECKIN","CHECKOUT","APPROVE","REJECT","EXPORT"].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <span className="ml-auto text-sm text-muted-foreground self-center">{total} total logs</span>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["Actor", "Action", "Entity", "Description", "IP Address", "Time"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && <tr><td colSpan={6} className="py-16 text-center"><Loader2 size={24} className="animate-spin mx-auto text-primary" /></td></tr>}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={6} className="py-16 text-center text-muted-foreground">No audit logs found</td></tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{log.actor.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", getRoleBadge(log.actor.role))}>
                        {log.actor.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold", ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-700")}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">{log.entityType}</span>
                  </td>
                  <td className="px-4 py-3 max-w-xs text-muted-foreground">{log.description}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{log.ipAddress ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{timeAgo(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
